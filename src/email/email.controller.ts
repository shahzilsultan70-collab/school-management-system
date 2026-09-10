import { Controller, Post, Body } from '@nestjs/common';

import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  sendTestEmail(@Body('email') email: string) {
    return this.emailService.sendTestEmail(email);
  }
}
