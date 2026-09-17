import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // GET /api — used as the host's health check target.
  @Get()
  health() {
    return { status: 'ok' };
  }
}
