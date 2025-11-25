import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true, enum: ['user', 'admin'] })
  sender: string;

  @Prop({ required: true })
  text: string;

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
}

export const MessageSchema = SchemaFactory.createForClass(Message);
