import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    // Gateway đã sẵn sàng
  }

  handleConnection(client: Socket) {
    // Client đã kết nối
  }

  handleDisconnect(client: Socket) {
    // Client đã ngắt kết nối
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(data.conversationId);
    const messages = await this.chatService.getMessages(data.conversationId);
    client.emit('messages', messages);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const message = await this.chatService.createMessage(createMessageDto);
      
      // Gửi tin nhắn đến tất cả clients trong conversation
      this.server.to(createMessageDto.conversationId).emit('new_message', message);
      
      // Trả về message cho client gửi (acknowledgment)
      const messageObj = message.toObject ? message.toObject() : message;
      return { success: true, ...messageObj };
    } catch (error) {
      return { error: 'Không thể gửi tin nhắn', success: false };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.chatService.markAsRead(data.conversationId);
    this.server.to(data.conversationId).emit('messages_read', data.conversationId);
  }
}

