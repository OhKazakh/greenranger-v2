import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('locations')
export class LocationsController {
  constructor(private locations: LocationsService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('materials') materials?: string,
  ) {
    const materialList = materials ? materials.split(',') : undefined;
    return this.locations.findAll({ category, materials: materialList });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.locations.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateLocationDto, @Req() req: Request) {
    const user = (req as any).user as { id: string } | undefined;
    return this.locations.create(dto, user?.id);
  }
}
