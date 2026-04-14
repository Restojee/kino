import {join} from 'path';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {ValidationPipe} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {AppModule} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api', {exclude: ['static/(.*)']});
  app.useStaticAssets(join(process.cwd(), 'public'), {prefix: '/static/'});
  app.enableCors();
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({limit: '6mb'}));
  app.useGlobalPipes(
    new ValidationPipe({whitelist: true, transform: true, forbidNonWhitelisted: true}),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BobKino API')
    .setDescription('Каталог фильмов/сериалов/мультфильмов/аниме с отзывами и импортом')
    .setVersion('0.1.0')
    .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}, 'bearer')
    .addTag('auth')
    .addTag('invites')
    .addTag('categories')
    .addTag('genres')
    .addTag('movies')
    .addTag('reviews')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {persistAuthorization: true},
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}/api`);
  console.log(`Swagger UI:        http://localhost:${port}/api/docs`);
}

bootstrap();
