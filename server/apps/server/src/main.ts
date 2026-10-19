import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InterceptorExceptionFilter } from '@libs/shared/interceptor/exceptionFilter';
import { Config } from '@en/config';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new InterceptorExceptionFilter());
  app.setGlobalPrefix('api'); // 设置全局前缀
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }) // 启用版本控制
  await app.listen(Config.ports.server);
}
bootstrap();
