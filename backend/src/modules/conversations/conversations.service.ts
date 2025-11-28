import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationMetrics } from './entities/conversation-metrics.entity';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';
import { AgentsService } from '../agents/agents.service';
import { VectorStoreService } from '../knowledge-base/vector-store.service';
import { AnalyticsService } from '../knowledge-base/analytics.service';
import { ToolExecutorService } from '../tools/tool-executor.service';
import { LangChainToolAdapter } from '../tools/langchain-tool.adapter';
import { TokenCounterService } from './services/token-counter.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(ConversationMetrics)
    private metricsRepository: Repository<ConversationMetrics>,
    private agentsService: AgentsService,
    private vectorStoreService: VectorStoreService,
    private analyticsService: AnalyticsService,
    private toolExecutorService: ToolExecutorService,
    private tokenCounterService: TokenCounterService,
  ) {}

  async findAll(organizationId: string, userId: string, agentId?: string): Promise<Conversation[]> {
    const query: any = { organizationId, userId };
    if (agentId) {
      query.agentId = agentId;
    }

    return this.conversationsRepository.find({
      where: query,
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id, organizationId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async create(createDto: CreateConversationDto, organizationId: string, userId: string): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({
      ...createDto,
      organizationId,
      userId,
    });

    return this.conversationsRepository.save(conversation);
  }

  async sendMessage(conversationId: string, messageDto: SendMessageDto, organizationId: string): Promise<Message> {
    const conversation = await this.findOne(conversationId, organizationId);

    // Save user message
    const userMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      role: 'user',
      content: messageDto.content,
    });
    await this.messagesRepository.save(userMessage);

    // Get agent configuration
    const agent = await this.agentsService.findOne(conversation.agentId, organizationId);

    // Get token-aware conversation history
    const historyMessages = await this.getTokenAwareHistory(
      conversation.id,
      agent.maxHistoryTokens || 3000
    );

    // RAG: Search for relevant document chunks if agent has knowledge base enabled
    let contextFromDocs = '';
    let sources: any[] = [];
    
    if (agent.useKnowledgeBase) {
      try {
        this.logger.log(`Searching knowledge base for: "${messageDto.content}"`);
        
        // Build conversation context for better search
        const recentHistory = historyMessages
          .slice(-3)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        const searchQuery = recentHistory 
          ? `${recentHistory}\nuser: ${messageDto.content}`
          : messageDto.content;
        
        const searchResults = await this.vectorStoreService.searchSimilar(
          searchQuery,
          organizationId,
          agent.knowledgeBaseMaxResults || 3,
          agent.knowledgeBaseThreshold || 0.7,
        );

        if (searchResults.length > 0) {
          this.logger.log(`Found ${searchResults.length} relevant chunks`);
          
          // Build context from search results
          contextFromDocs = searchResults
            .map((result, index) => 
              `[Source ${index + 1}: ${result.metadata.documentTitle}]\n${result.content}`
            )
            .join('\n\n');

          // Store sources for metadata
          sources = searchResults.map(result => ({
            documentId: result.documentId,
            documentTitle: result.metadata.documentTitle,
            chunkId: result.chunkId,
            score: result.score,
          }));

          // Track document usage for analytics
          this.analyticsService.trackDocumentUsage(sources);
        } else {
          this.logger.log('No relevant chunks found in knowledge base');
        }
      } catch (error) {
        this.logger.error(`Error searching knowledge base: ${error.message}`, error.stack);
        // Continue without RAG if search fails
      }
    }

    // Build system prompt with context
    let systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';
    
    // Add explicit conversational instruction for fine-tuned models
    // This prevents the model from reproducing training example formats
    systemPrompt = `You are having a natural conversation with a user. Respond naturally and conversationally, not in example format.\n\n${systemPrompt}`;
    
    if (contextFromDocs) {
      systemPrompt += `\n\n### Relevant Information from Knowledge Base:\n${contextFromDocs}\n\n` +
        `Use the above information to answer the user's question. If the information is relevant, cite the sources. ` +
        `If the information doesn't answer the question, you can say so and provide a general response.\n` +
        `DO NOT format your response as training examples (e.g., "INPUT:", "OUTPUT:"). Respond naturally as if having a conversation.`;
    }

    // Build message history for LangChain
    const messages: any[] = [
      new SystemMessage(systemPrompt),
    ];

    // Add conversation history
    for (const msg of historyMessages) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Load agent's tools if any
    const agentTools = await this.toolExecutorService.getAgentTools(agent.id, organizationId);
    let toolsUsed: any[] = [];
    
    // Initialize LLM based on agent configuration
    const llm = await this.createLLM(agent);

    // If agent has tools, bind them to the LLM
    let llmToUse: any = llm;
    if (agentTools.length > 0) {
      try {
        this.logger.log(`Agent has ${agentTools.length} tools available`);
        const toolAdapter = new LangChainToolAdapter(this.toolExecutorService);
        const langchainTools = await toolAdapter.convertMultipleTools(agentTools, organizationId);
        
        if (langchainTools.length > 0) {
          llmToUse = llm.bind({ tools: langchainTools });
          this.logger.log(`Bound ${langchainTools.length} tools to LLM`);
        }
      } catch (error) {
        this.logger.error(`Error binding tools to LLM: ${error.message}`, error.stack);
        // Continue without tools if binding fails
      }
    }

    // Generate AI response
    try {
      const response = await llmToUse.invoke(messages);
      
      // Extract content from response
      let content: string;
      if (typeof response === 'string') {
        content = response;
      } else if ('content' in response) {
        const responseContent = response.content;
        if (typeof responseContent === 'string') {
          content = responseContent;
        } else if (Array.isArray(responseContent)) {
          content = responseContent.map(c => typeof c === 'string' ? c : (c as any).text || '').join('');
        } else {
          content = String(responseContent);
        }
      } else {
        content = String(response);
      }
      
      // Save AI response with sources and tools metadata
      const metadata: any = {};
      if (sources.length > 0) {
        metadata.sources = sources;
      }
      if (toolsUsed.length > 0) {
        metadata.toolsUsed = toolsUsed;
      }
      
      const aiMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: content,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
      });
      await this.messagesRepository.save(aiMessage);

      // Update conversation timestamp and auto-generate title if needed
      if (!conversation.title && historyMessages.length === 1) {
        // Auto-generate title from first message
        const title = messageDto.content.length > 50 
          ? messageDto.content.substring(0, 50) + '...'
          : messageDto.content;
        await this.conversationsRepository.update(conversationId, { 
          title,
          updatedAt: new Date() 
        });
      } else {
        await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });
      }

      return aiMessage;
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Save error message
      const errorMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
      });
      await this.messagesRepository.save(errorMessage);
      
      return errorMessage;
    }
  }

  private async createLLM(agent: any) {
    // Check if using Ollama or OpenAI
    const useOllama = process.env.USE_OLLAMA === 'true';

    if (useOllama) {
      // Ollama support (for local development)
      const { Ollama } = await import('@langchain/community/llms/ollama');
      return new Ollama({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: agent.model || 'mistral',
        temperature: agent.temperature || 0.7,
      });
    } else {
      // OpenAI (default)
      return new ChatOpenAI({
        modelName: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const result = await this.conversationsRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Conversation not found');
    }
  }

  /**
   * Get token-aware conversation history
   * Loads messages until token budget is reached
   */
  private async getTokenAwareHistory(
    conversationId: string,
    maxTokens: number = 3000
  ): Promise<Message[]> {
    const allMessages = await this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' }
    });
    
    // Start from most recent and work backwards
    const history: Message[] = [];
    let tokenCount = 0;
    
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i];
      const msgTokens = this.tokenCounterService.estimateTokens(msg.content);
      
      if (tokenCount + msgTokens > maxTokens) {
        break;
      }
      
      history.unshift(msg);
      tokenCount += msgTokens;
    }
    
    this.logger.debug(
      `Loaded ${history.length} messages using ${tokenCount}/${maxTokens} tokens`
    );
    
    return history;
  }

  /**
   * Get RAG context with token limit
   */
  private async getTokenAwareRagContext(
    query: string,
    organizationId: string,
    maxTokens: number = 1500,
    topK: number = 10,
    threshold: number = 0.7
  ): Promise<{ context: string; sources: any[]; tokensUsed: number }> {
    try {
      const results = await this.vectorStoreService.searchSimilar(
        query,
        organizationId,
        topK,
        threshold
      );
      
      let context = '';
      let tokenCount = 0;
      const sources = [];
      
      for (const result of results) {
        const chunkText = `[Source: ${result.metadata?.documentTitle || 'Document'}]\n${result.content}\n\n`;
        const chunkTokens = this.tokenCounterService.estimateTokens(chunkText);
        
        if (tokenCount + chunkTokens > maxTokens) {
          break;
        }
        
        context += chunkText;
        tokenCount += chunkTokens;
        sources.push(result);
      }
      
      this.logger.debug(
        `Loaded ${sources.length} RAG sources using ${tokenCount}/${maxTokens} tokens`
      );
      
      return { context, sources, tokensUsed: tokenCount };
    } catch (error) {
      this.logger.error('Error fetching RAG context:', error);
      return { context: '', sources: [], tokensUsed: 0 };
    }
  }

  /**
   * Save token usage metrics
   */
  private async saveMetrics(data: {
    conversationId: string;
    messageId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    systemTokens: number;
    historyTokens: number;
    ragTokens: number;
    userMessageTokens: number;
    historyMessagesCount: number;
    ragDocumentsUsed: number;
  }): Promise<void> {
    try {
      const totalTokens = data.promptTokens + data.completionTokens;
      const cost = this.tokenCounterService.calculateCost({
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        model: data.model
      });
      
      const metrics = this.metricsRepository.create({
        conversationId: data.conversationId,
        messageId: data.messageId,
        model: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens,
        systemTokens: data.systemTokens,
        historyTokens: data.historyTokens,
        ragTokens: data.ragTokens,
        userMessageTokens: data.userMessageTokens,
        cost,
        historyMessagesCount: data.historyMessagesCount,
        ragDocumentsUsed: data.ragDocumentsUsed,
      });
      
      await this.metricsRepository.save(metrics);
      
      this.logger.log(
        `Saved metrics: ${totalTokens} tokens, $${cost.toFixed(4)} cost`
      );
    } catch (error) {
      this.logger.error('Error saving metrics:', error);
    }
  }

  /**
   * Get metrics for a conversation
   */
  async getConversationMetrics(
    conversationId: string,
    organizationId: string
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    messageCount: number;
    avgTokensPerMessage: number;
    breakdown: any;
  }> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    const metrics = await this.metricsRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' }
    });
    
    const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalCost = metrics.reduce((sum, m) => sum + Number(m.cost), 0);
    
    return {
      totalTokens,
      totalCost,
      messageCount: metrics.length,
      avgTokensPerMessage: metrics.length > 0 ? Math.round(totalTokens / metrics.length) : 0,
      breakdown: {
        promptTokens: metrics.reduce((sum, m) => sum + m.promptTokens, 0),
        completionTokens: metrics.reduce((sum, m) => sum + m.completionTokens, 0),
        systemTokens: metrics.reduce((sum, m) => sum + m.systemTokens, 0),
        historyTokens: metrics.reduce((sum, m) => sum + m.historyTokens, 0),
        ragTokens: metrics.reduce((sum, m) => sum + m.ragTokens, 0),
      }
    };
  }

  /**
   * Get total metrics for a user
   */
  async getUserTotalMetrics(userId: string, organizationId: string) {
    const conversations = await this.conversationsRepository.find({
      where: { userId },
      select: ['id']
    });
    
    const conversationIds = conversations.map(c => c.id);
    
    if (conversationIds.length === 0) {
      return {
        totalTokens: 0,
        totalCost: 0,
        conversationCount: 0,
        messageCount: 0
      };
    }
    
    const metrics = await this.metricsRepository
      .createQueryBuilder('metrics')
      .where('metrics.conversation_id IN (:...ids)', { ids: conversationIds })
      .getMany();
    
    return {
      totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
      totalCost: metrics.reduce((sum, m) => sum + Number(m.cost), 0),
      conversationCount: conversations.length,
      messageCount: metrics.length,
    };
  }
}
