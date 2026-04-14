import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getBySlug(slug: string) {
    const c = await this.prisma.category.findUnique({ where: { slug } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async ensureDefaults() {
    const defaults = [
      { slug: 'movies', name: 'Фильмы' },
      { slug: 'series', name: 'Сериалы' },
      { slug: 'cartoons', name: 'Мультфильмы' },
      { slug: 'anime', name: 'Аниме' },
    ];
    for (const d of defaults) {
      await this.prisma.category.upsert({
        where: { slug: d.slug },
        update: {},
        create: d,
      });
    }
  }
}
