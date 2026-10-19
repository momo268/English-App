import { NestFactory } from '@nestjs/core';
import { AiModule } from './ai.module';
import { InterceptorExceptionFilter } from '@libs/shared/interceptor/exceptionFilter';
import { Config } from '@en/config';

async function bootstrap() {
  const app = await NestFactory.create(AiModule);
  app.useGlobalFilters(new InterceptorExceptionFilter());
  await app.listen(Config.ports.ai);
}
bootstrap();
