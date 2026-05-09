import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { category?: string; materials?: string[] }) {
    return this.prisma.location.findMany({
      where: {
        ...(filters?.category && { category: filters.category as any }),
        ...(filters?.materials?.length && {
          materials: { hasSome: filters.materials },
        }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const loc = await this.prisma.location.findUnique({ where: { slug } });
    if (!loc) throw new NotFoundException('Location not found');
    return loc;
  }

  async create(dto: CreateLocationDto, submittedById?: string) {
    return this.prisma.location.create({
      data: {
        ...dto,
        photos: dto.photos ?? [],
        ...(submittedById && { submittedById }),
      },
    });
  }
}
