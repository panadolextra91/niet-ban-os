import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe (Bộ Lọc Nghiệp Chướng) 🛡️
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field thừa thải không có trong DTO
      transform: true, // Tự động convert type (ví dụ string "10" thành number 10)
    }),
  );

  // Setup Swagger (Kinh Thư API) 📜
  const config = new DocumentBuilder()
    .setTitle('Niet-Ban-OS - Kinh Thư API')
    .setDescription('Tài liệu API cho hệ thống quản lý chùa chiền và tu tập online (SaaS)')
    .setVersion('1.0')
    .addTag('practice', 'Các hoạt động tu tập và game hóa')
    .addTag('temples', 'Quản lý thông tin chùa')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Enable CORS for real-time and frontend integration
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🙏 Niet-Ban-OS API is running on: http://localhost:${port}/api/v1`);
  console.log(`📜 Kinh Thư API (Swagger) is available at: http://localhost:${port}/docs`);
}
bootstrap();
