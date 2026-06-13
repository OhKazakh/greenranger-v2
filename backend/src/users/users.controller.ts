import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
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

  @Get('me/activity')
  @UseGuards(AuthGuard('jwt'))
  async myActivity(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;

    const [reviews, submissions] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          location: {
            select: {
              slug: true,
              nameRu: true,
              nameEn: true,
              nameKk: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.location.findMany({
        where: { submittedById: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          nameRu: true,
          nameEn: true,
          nameKk: true,
          category: true,
          verified: true,
          createdAt: true,
        },
      }),
    ]);

    return { reviews, submissions };
  }
}
