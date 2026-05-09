import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { SuggestLocationDto } from './dto/suggest-location.dto';

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

  async setVerified(id: string, verified: boolean) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found');
    return this.prisma.location.update({ where: { id }, data: { verified } });
  }

  async remove(id: string) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found');
    return this.prisma.location.delete({ where: { id } });
  }

  async suggest(dto: SuggestLocationDto, submittedById?: string) {
    // Generate a unique slug from the name
    const base = dto.name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);
    const slug = `${base}-${Date.now()}`;

    return this.prisma.location.create({
      data: {
        slug,
        category: 'kiosk', // default; admin can change later
        verified: false,
        // Same value in all 3 languages — admin reviews and translates later
        nameRu: dto.name,
        nameEn: dto.name,
        nameKk: dto.name,
        descriptionRu: dto.description,
        descriptionEn: dto.description,
        descriptionKk: dto.description,
        addressRu: dto.address,
        addressEn: dto.address,
        addressKk: dto.address,
        lat: dto.lat,
        lng: dto.lng,
        materials: dto.materials,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        photos: [],
        ...(submittedById && { submittedById }),
      },
    });
  }
}
