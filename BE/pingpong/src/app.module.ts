import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketService } from './events/events.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, WebsocketService],
})
export class AppModule {}
