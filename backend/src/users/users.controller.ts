import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { reviews: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
