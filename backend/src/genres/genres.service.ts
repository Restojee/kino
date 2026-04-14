import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }

  async create(params: { name: string }) {
    const name = params.name?.trim();
    if (!name) throw new ConflictException('Genre name is required');
    const slug = slugify(name);
    try {
      return await this.prisma.genre.create({ data: { slug, name } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const existing = await this.prisma.genre.findUnique({ where: { slug } });
        if (existing) return existing;
      }
      throw e;
    }
  }

  async upsertByExternal(params: { name: string; externalId?: string }) {
    const slug = slugify(params.name);
    return this.prisma.genre.upsert({
      where: { slug },
      update: { externalId: params.externalId ?? undefined },
      create: { slug, name: params.name, externalId: params.externalId },
    });
  }
}
