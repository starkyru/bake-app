import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as express from 'express';
import * as path from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

type RawBodyRequest = express.Request & { rawBody?: Buffer };

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Request body size limits
  app.use(express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as RawBodyRequest).rawBody = Buffer.from(buf);
    },
  }));
  app.use(express.urlencoded({
    limit: '10mb',
    extended: true,
    verify: (req, _res, buf) => {
      (req as RawBodyRequest).rawBody = Buffer.from(buf);
    },
  }));

  // Exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serialization — enables @Exclude() decorators on entities
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  const envOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
  const defaultOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:4202',
    'http://localhost:4203',
    'http://localhost:4204',
  ];
  const corsOrigins = envOrigins
    ? envOrigins.split(',').map((o) => o.trim())
    : defaultOrigins;
  app.enableCors({
    origin: [...new Set(corsOrigins)],
    credentials: true,
  });

  // Static file serving for uploads
  app.use('/api/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger documentation (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Bake App API')
      .setDescription('Unified Café-Bakery Automation Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API server is running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
