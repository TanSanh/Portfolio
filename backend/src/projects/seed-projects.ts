// Script để seed dữ liệu mẫu cho projects
// Chạy với: npx ts-node src/projects/seed-projects.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProjectsService } from './projects.service';
import { getModelToken } from '@nestjs/mongoose';
import { Project } from './schemas/project.schema';

const sampleProjects = [
  {
    title: 'E-Commerce API',
    category: 'API Development',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=1000&fit=crop',
    description:
      'Hệ thống RESTful API cho nền tảng thương mại điện tử với NestJS và MongoDB.',
    isActive: true,
    order: 1,
  },
  {
    title: 'Real-time Chat System',
    category: 'Microservices',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=1000&fit=crop',
    description:
      'Hệ thống chat real-time với WebSocket, Redis và microservices architecture.',
    isActive: true,
    order: 2,
  },
  {
    title: 'User Authentication Service',
    category: 'Authentication',
    image:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=1000&fit=crop',
    description:
      'Dịch vụ xác thực người dùng với JWT, OAuth2 và refresh token mechanism.',
    isActive: true,
    order: 3,
  },
  {
    title: 'Analytics Dashboard Backend',
    category: 'Database',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=1000&fit=crop',
    description:
      'Backend cho dashboard phân tích dữ liệu với MySQL và data aggregation.',
    isActive: true,
    order: 4,
  },
  {
    title: 'Payment Gateway Integration',
    category: 'API Development',
    image:
      'https://news.appotapay.com/wp-content/uploads/2025/07/api-thanh-toan-la-gi-doanh-nghiep-can-biet-gi-de-bat-dau-dung-cach-2.jpg',
    description: 'Tích hợp cổng thanh toán với Stripe API và xử lý webhooks.',
    isActive: true,
    order: 5,
  },
  {
    title: 'Task Management API',
    category: 'Microservices',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=1000&fit=crop',
    description:
      'API quản lý công việc với task scheduling và notification system.',
    isActive: true,
    order: 6,
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const projectsService = app.get(ProjectsService);

  for (const project of sampleProjects) {
    try {
      await projectsService.create(project);
    } catch (error) {
      // Bỏ qua lỗi nếu project đã tồn tại
    }
  }

  await app.close();
}

seed().catch((error) => {
  process.exit(1);
});
