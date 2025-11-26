import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Bật CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation pipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Tiền tố API toàn cục
  app.setGlobalPrefix('api');

  // Serve static files từ thư mục uploads
  const uploadsPath = join(__dirname, '..', 'uploads');
  console.log('[Static] Serving uploads from:', uploadsPath);
  app.useStaticAssets(uploadsPath, {
    prefix: '/api/uploads',
  });
  console.log('[Static] Static assets configured at: /api/uploads');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server đang chạy trên: http://localhost:${port}/api`);
  console.log(
    `Static files available at: http://localhost:${port}/api/uploads/`,
  );
}

bootstrap();
