import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import * as crypto from 'crypto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async startConversation(dto: StartConversationDto): Promise<string> {
    // Tạo conversationId mới
    const conversationId = crypto.randomUUID();

    // Tạo tin nhắn chào mừng
    const welcomeMessage = new this.messageModel({
      conversationId,
      sender: 'admin',
      text: `Xin chào ${dto.fullName}! Tôi có thể giúp gì cho bạn?`,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      isRead: true,
    });

    await welcomeMessage.save();

    return conversationId;
  }

  async createMessage(dto: CreateMessageDto): Promise<MessageDocument> {
    const message = new this.messageModel({
      ...dto,
      text: dto.text || '', // Đảm bảo text luôn có giá trị (có thể là chuỗi rỗng)
      isRead: dto.sender === 'admin',
    });
    return message.save();
  }

  async getMessages(conversationId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async getAllConversations(): Promise<any[]> {
    // Lấy tất cả conversationId duy nhất
    const conversations = await this.messageModel
      .aggregate([
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $last: '$$ROOT' },
            messageCount: { $sum: 1 },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$sender', 'user'] },
                      { $eq: ['$isRead', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'messages',
            let: { convId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$conversationId', '$$convId'] } } },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'lastMessageData',
          },
        },
        {
          $lookup: {
            from: 'messages',
            let: { convId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$conversationId', '$$convId'] },
                  fullName: { $exists: true, $ne: null },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'contactInfo',
          },
        },
        { $sort: { 'lastMessage.createdAt': -1 } },
      ])
      .exec();

    return conversations.map((conv) => ({
      conversationId: conv._id,
      lastMessage: conv.lastMessageData[0] || conv.lastMessage,
      messageCount: conv.messageCount,
      unreadCount: conv.unreadCount,
      fullName:
        conv.contactInfo?.[0]?.fullName ||
        conv.lastMessage?.fullName ||
        conv.lastMessageData?.[0]?.fullName,
      phone:
        conv.contactInfo?.[0]?.phone ||
        conv.lastMessage?.phone ||
        conv.lastMessageData?.[0]?.phone,
      email:
        conv.contactInfo?.[0]?.email ||
        conv.lastMessage?.email ||
        conv.lastMessageData?.[0]?.email,
    }));
  }

  async markAsRead(conversationId: string): Promise<void> {
    await this.messageModel
      .updateMany(
        { conversationId, sender: 'user', isRead: false },
        { $set: { isRead: true } },
      )
      .exec();
  }

  async archiveConversation(conversationId: string): Promise<void> {
    await this.messageModel
      .updateMany({ conversationId }, { $set: { isArchived: true } })
      .exec();
  }
}
