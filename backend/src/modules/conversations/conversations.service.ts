import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
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

    // TODO: Generate AI response using LangChain
    // For now, return a placeholder response
    const aiMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'AI response placeholder - will be implemented with LangChain',
    });
    await this.messagesRepository.save(aiMessage);

    // Update conversation timestamp
    await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });

    return aiMessage;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const result = await this.conversationsRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Conversation not found');
    }
  }
}
