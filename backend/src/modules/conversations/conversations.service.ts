import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';
import { AgentsService } from '../agents/agents.service';
import { VectorStoreService } from '../knowledge-base/vector-store.service';
import { AnalyticsService } from '../knowledge-base/analytics.service';
import { ToolExecutorService } from '../tools/tool-executor.service';
import { LangChainToolAdapter } from '../tools/langchain-tool.adapter';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private agentsService: AgentsService,
    private vectorStoreService: VectorStoreService,
    private analyticsService: AnalyticsService,
    private toolExecutorService: ToolExecutorService,
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

    // Get conversation history (last 10 messages for context)
    const historyMessages = await this.messagesRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    historyMessages.reverse(); // Oldest first

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
    let systemPrompt = agent.systemPrompt;
    if (contextFromDocs) {
      systemPrompt += `\n\n### Relevant Information from Knowledge Base:\n${contextFromDocs}\n\n` +
        `Use the above information to answer the user's question. If the information is relevant, cite the sources. ` +
        `If the information doesn't answer the question, you can say so and provide a general response.`;
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
}
