import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  async startConversation(@Body() dto: StartConversationDto) {
    const conversationId = await this.chatService.startConversation(dto);
    const messages = await this.chatService.getMessages(conversationId);
    return { conversationId, messages };
  }

  @Post('messages')
  async createMessage(@Body() dto: CreateMessageDto) {
    return this.chatService.createMessage(dto);
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getAllConversations() {
    return this.chatService.getAllConversations();
  }

  @UseGuards(JwtAuthGuard)
  @Post('mark-read/:conversationId')
  async markAsRead(@Param('conversationId') conversationId: string) {
    await this.chatService.markAsRead(conversationId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('archive/:conversationId')
  async archiveConversation(@Param('conversationId') conversationId: string) {
    await this.chatService.archiveConversation(conversationId);
    return { success: true };
  }
}

