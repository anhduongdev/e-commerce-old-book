import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PagesController } from './pages.controller';
import { PagesPublicController } from './pages-public.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [AuthModule],
  controllers: [PagesController, PagesPublicController],
  providers: [PagesService],
})
export class PagesModule {}
