import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { Resend } from 'resend';

@Injectable()
export class ContactService {
  private resend: Resend;

  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    // Lưu vào database
    const contact = new this.contactModel(createContactDto);
    const savedContact = await contact.save();

    // Gửi email thông báo
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = process.env.CONTACT_EMAIL;

    if (!resendApiKey) {
      // Không có API key, bỏ qua việc gửi email nhưng vẫn lưu contact
      return savedContact;
    }

    if (!toEmail || toEmail === '@yourdomain.com') {
      // Không có email nhận thông báo, bỏ qua việc gửi email
      return savedContact;
    }

    const subjectText =
      createContactDto.subject && createContactDto.subject.trim().length > 0
        ? createContactDto.subject
        : 'Không có chủ đề';

    try {
      await this.resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: `Thông Báo Mới Từ Form Liên Hệ Portfolio của Tan Sanh: ${subjectText}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">📧 Thông Báo Mới Từ Form Liên Hệ Portfolio của Tan Sanh</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong style="color: #555;">Họ và Tên:</strong> <span style="color: #333;">${createContactDto.fullName}</span></p>
                <p style="margin: 10px 0;"><strong style="color: #555;">Email:</strong> <a href="mailto:${createContactDto.email}" style="color: #007bff; text-decoration: none;">${createContactDto.email}</a></p>
                <p style="margin: 10px 0;"><strong style="color: #555;">Chủ Đề:</strong> <span style="color: #333;">${subjectText}</span></p>
              </div>
              <div style="margin: 20px 0;">
                <p style="margin: 10px 0;"><strong style="color: #555;">Tin Nhắn:</strong></p>
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; margin-top: 10px;">
                  <p style="color: #333; margin: 0; white-space: pre-wrap;">${createContactDto.message.replace(/\n/g, '<br>')}</p>
                </div>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">Email này được gửi tự động từ form liên hệ trên portfolio của bạn.</p>
            </div>
          </div>
        `,
      });
    } catch (error: any) {
      // Lỗi khi gửi email - không throw error để vẫn lưu được contact vào database
    }

    return savedContact;
  }

  async findAll(): Promise<Contact[]> {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Contact> {
    return this.contactModel.findById(id).exec();
  }
}
