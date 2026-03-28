import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

// Prisma returns BigInt for timestamp fields — serialize them as numbers
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4300'],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Storee API')
    .setDescription(
      'REST API for Storee — a local-first physical object tracker.\n\n' +
      'Authenticate with `POST /api/auth/login` to get a JWT, ' +
      'then click **Authorize** and paste `Bearer <token>`.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);

  Logger.log(`🚀 API:     http://localhost:${port}/api`);
  Logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
