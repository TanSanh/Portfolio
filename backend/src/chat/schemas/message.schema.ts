import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true, enum: ['user', 'admin'] })
  sender: string;

  @Prop({ required: false, default: '' })
  text?: string;

  @Prop()
  fullName?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop()
  fileUrl?: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileType?: string; // 'image', 'file', etc.

  @Prop()
  fileSize?: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
