import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `chat-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'Không có file được upload' };
    }

    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const isImage = file.mimetype.startsWith('image/');
    return {
      url: `/api/uploads/chat/${file.filename}`,
      filename: file.filename,
      originalName,
      fileType: isImage ? 'image' : 'file',
      fileSize: file.size,
    };
  }
}
