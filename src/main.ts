import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // ==========================================
  // CORS
  // ==========================================

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // ==========================================
  // GLOBAL VALIDATION
  // ==========================================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ==========================================
  // GLOBAL EXCEPTION FILTER
  // ==========================================

  app.useGlobalFilters(new AllExceptionsFilter());

  // ==========================================
  // STATIC FILES
  // ==========================================

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ==========================================
  // START SERVER
  // ==========================================

  await app.listen(3000);
}

void bootstrap();
