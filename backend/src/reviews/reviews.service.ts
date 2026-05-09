import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getReviews(locationSlug: string) {
    const location = await this.prisma.location.findUnique({
      where: { slug: locationSlug },
    });
    if (!location) throw new NotFoundException('Location not found');

    const reviews = await this.prisma.review.findMany({
      where: { locationId: location.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return { reviews, avgRating, count: reviews.length };
  }

  async createReview(
    locationSlug: string,
    userId: string,
    dto: CreateReviewDto,
  ) {
    const location = await this.prisma.location.findUnique({
      where: { slug: locationSlug },
    });
    if (!location) throw new NotFoundException('Location not found');

    const existing = await this.prisma.review.findUnique({
      where: { userId_locationId: { userId, locationId: location.id } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this location');
    }

    return this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        userId,
        locationId: location.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async deleteReview(locationSlug: string, userId: string) {
    const location = await this.prisma.location.findUnique({
      where: { slug: locationSlug },
    });
    if (!location) throw new NotFoundException('Location not found');

    const review = await this.prisma.review.findUnique({
      where: { userId_locationId: { userId, locationId: location.id } },
    });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({
      where: { userId_locationId: { userId, locationId: location.id } },
    });
    return { success: true };
  }
}
