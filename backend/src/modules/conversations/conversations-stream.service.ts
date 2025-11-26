import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/conversation.dto';
import { AgentsService } from '../agents/agents.service';
import { VectorStoreService } from '../knowledge-base/vector-store.service';
import { AnalyticsService } from '../knowledge-base/analytics.service';

@Injectable()
export class ConversationsStreamService {
  private readonly logger = new Logger(ConversationsStreamService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private agentsService: AgentsService,
    private vectorStoreService: VectorStoreService,
    private analyticsService: AnalyticsService,
  ) {}

  async sendMessageStream(
    conversationId: string,
    messageDto: SendMessageDto,
    organizationId: string,
    sendEvent: (data: any) => void,
  ): Promise<void> {
    await this.processStreamingMessage(conversationId, messageDto, organizationId, sendEvent);
  }

  private async processStreamingMessage(
    conversationId: string,
    messageDto: SendMessageDto,
    organizationId: string,
    sendEvent: (data: any) => void,
  ): Promise<void> {
    // Find conversation
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, organizationId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Save user message with explicit timestamp
    const userMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      role: 'user',
      content: messageDto.content,
      createdAt: new Date(),
    });
    await this.messagesRepository.save(userMessage);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Send user message confirmation
    sendEvent({
      type: 'user_message',
      messageId: userMessage.id,
      content: messageDto.content,
    });

    // Get agent configuration
    const agent = await this.agentsService.findOne(conversation.agentId, organizationId);
    
    // DEBUG: Log agent info
    this.logger.log('=== DEBUG: Agent Configuration ===');
    this.logger.log(`Agent ID: ${agent.id}`);
    this.logger.log(`Agent Name: ${agent.name}`);
    this.logger.log(`System Prompt: ${agent.systemPrompt}`);
    this.logger.log(`Use Knowledge Base: ${agent.useKnowledgeBase}`);
    this.logger.log(`Model: ${agent.model}`);
    this.logger.log('=== END Agent DEBUG ===');

    // Get conversation history (last 10 messages for context)
    // This will include the user message we just saved
    const historyMessages = await this.messagesRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    historyMessages.reverse(); // Oldest first

    // RAG: Search for relevant documents
    let contextFromDocs = '';
    let sources: any[] = [];

    if (agent.useKnowledgeBase) {
      try {
        sendEvent({
          type: 'status',
          content: 'Searching knowledge base...',
        });

        const recentHistory = historyMessages
          .slice(-3)
          .map((msg) => `${msg.role}: ${msg.content}`)
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

          contextFromDocs = searchResults
            .map((result, index) => `[Source ${index + 1}: ${result.metadata.documentTitle}]\n${result.content}`)
            .join('\n\n');

          sources = searchResults.map((result) => ({
            documentId: result.documentId,
            documentTitle: result.metadata.documentTitle,
            chunkId: result.chunkId,
            score: result.score,
          }));

          // Send sources to client
          sendEvent({
            type: 'sources',
            sources: sources,
          });

          this.analyticsService.trackDocumentUsage(sources);
        }
      } catch (error) {
        this.logger.error(`Error searching knowledge base: ${error.message}`);
      }
    }

    // Build system prompt
    let systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';
    
    // Add explicit conversational instruction for fine-tuned models
    // This prevents the model from reproducing training example formats
    systemPrompt = `You are having a natural conversation with a user. Respond naturally and conversationally, not in example format.\n\n${systemPrompt}`;
    
    // If we have context from RAG, append it with clear instructions
    if (contextFromDocs) {
      systemPrompt +=
        `\n\n### Relevant Information from Knowledge Base:\n${contextFromDocs}\n\n` +
        `### Instructions:\n` +
        `- Use the information above to answer the user's question accurately.\n` +
        `- If the information is relevant, reference the sources in your answer.\n` +
        `- If the information doesn't help answer the question, use your general knowledge.\n` +
        `- Always be helpful, clear, and concise.\n` +
        `- DO NOT format your response as training examples (e.g., "INPUT:", "OUTPUT:").\n` +
        `- Respond naturally as if having a conversation.`;
    }

    // Build message history for LangChain
    const messages: any[] = [
      new SystemMessage(systemPrompt),
    ];

    // Add conversation history (already includes the current user message)
    for (const msg of historyMessages) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // DEBUG: Log what we're sending to the LLM
    this.logger.log('=== DEBUG: Messages being sent to LLM ===');
    this.logger.log(`Number of messages: ${messages.length}`);
    messages.forEach((msg, idx) => {
      this.logger.log(`Message ${idx}:`);
      this.logger.log(`  Type: ${msg.constructor.name}`);
      if (typeof msg.content === 'string') {
        this.logger.log(`  Content (first 500 chars): ${msg.content.substring(0, 500)}`);
      } else if (Array.isArray(msg.content)) {
        this.logger.log(`  Content: Array with ${msg.content.length} items`);
        this.logger.log(`  First item: ${JSON.stringify(msg.content[0]).substring(0, 200)}`);
      } else {
        this.logger.log(`  Content type: ${typeof msg.content}`);
        this.logger.log(`  Content: ${JSON.stringify(msg.content).substring(0, 200)}`);
      }
    });
    this.logger.log('=== END DEBUG ===');

    // Send status update
    sendEvent({
      type: 'status',
      content: 'Generating response...',
    });

    // Initialize LLM
    const llm = await this.createLLM(agent);

    // Stream the response
    let fullContent = '';
    const messageId = 'temp-' + Date.now();

    try {
      // Use streaming
      const stream = await llm.stream(messages);

      for await (const chunk of stream) {
        let chunkContent = '';

        if (typeof chunk === 'string') {
          chunkContent = chunk;
        } else if ('content' in chunk) {
          const content = chunk.content;
          if (typeof content === 'string') {
            chunkContent = content;
          } else if (Array.isArray(content)) {
            chunkContent = content.map((c) => (typeof c === 'string' ? c : (c as any).text || '')).join('');
          }
        }

        if (chunkContent) {
          fullContent += chunkContent;

          // Send token to client
          sendEvent({
            type: 'token',
            content: chunkContent,
            messageId: messageId,
          });
        }
      }

      // Save complete AI response
      const metadata: any = {};
      if (sources.length > 0) {
        metadata.sources = sources;
      }

      const aiMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: fullContent,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
        createdAt: new Date(),
      });
      await this.messagesRepository.save(aiMessage);

      // Send completion
      sendEvent({
        type: 'done',
        messageId: aiMessage.id,
        fullContent: fullContent,
      });

      // Update conversation
      if (!conversation.title && historyMessages.length === 1) {
        const title =
          messageDto.content.length > 50 ? messageDto.content.substring(0, 50) + '...' : messageDto.content;
        await this.conversationsRepository.update(conversationId, {
          title,
          updatedAt: new Date(),
        });
      } else {
        await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });
      }
    } catch (error) {
      this.logger.error('Error during streaming:', error);

      // Save error message
      const errorMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request.',
      });
      await this.messagesRepository.save(errorMessage);

      sendEvent({
        type: 'error',
        content: 'An error occurred while generating the response.',
      });
    }
  }

  private async createLLM(agent: any) {
    const useOllama = process.env.USE_OLLAMA === 'true';

    if (useOllama) {
      // For Ollama, use ChatOllama for better streaming support
      const { ChatOllama } = await import('@langchain/community/chat_models/ollama');
      return new ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: agent.model || 'mistral',
        temperature: agent.temperature || 0.7,
      });
    } else {
      return new ChatOpenAI({
        modelName: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2000,
        openAIApiKey: process.env.OPENAI_API_KEY,
        streaming: true, // Enable streaming
      });
    }
  }
}
