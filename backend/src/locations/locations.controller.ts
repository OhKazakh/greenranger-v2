import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { SuggestLocationDto } from './dto/suggest-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

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

  @Post('suggest')
  @UseGuards(JwtAuthGuard)
  suggest(@Body() dto: SuggestLocationDto, @Req() req: Request) {
    const user = (req as any).user as { id: string } | undefined;
    return this.locations.suggest(dto, user?.id);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  findAllAdmin() {
    return this.locations.findAllAdmin();
  }

  @Patch(':id/verify')
  @UseGuards(AdminGuard)
  verify(@Param('id') id: string, @Body('verified') verified: boolean) {
    return this.locations.setVerified(id, verified);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.locations.remove(id);
  }
}
