import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('locations/:slug/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getReviews(@Param('slug') slug: string) {
    return this.reviewsService.getReviews(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.createReview(slug, req.user.id, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteReview(@Param('slug') slug: string, @Req() req: any) {
    return this.reviewsService.deleteReview(slug, req.user.id);
  }
}
