import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';
import { AgentsService } from '../agents/agents.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private agentsService: AgentsService,
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

    // Build message history for LangChain
    const messages: any[] = [
      new SystemMessage(agent.systemPrompt),
    ];

    // Add conversation history
    for (const msg of historyMessages) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Initialize LLM based on agent configuration
    const llm = await this.createLLM(agent);

    // Generate AI response
    try {
      const response = await llm.invoke(messages);
      
      // Extract content from response (handle different response types)
      const content = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content)
          ? response.content.map(c => typeof c === 'string' ? c : c.text).join('')
          : String(response.content);
      
      // Save AI response
      const aiMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: content,
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
