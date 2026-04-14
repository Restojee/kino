import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './invites.dto';
import { PaginationDto, paginate } from '../common/pagination.dto';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async create(createdById: string, dto: CreateInviteDto) {
    return this.prisma.invite.create({
      data: {
        token: randomBytes(24).toString('hex'),
        email: dto.email,
        role: dto.role ?? 'user',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById,
      },
    });
  }

  async list(p: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invite.findMany({
        skip: (p.page - 1) * p.limit,
        take: p.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invite.count(),
    ]);
    return paginate(items, total, p.page, p.limit);
  }

  async revoke(id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new NotFoundException('Invite already used');
    await this.prisma.invite.delete({ where: { id } });
    return { ok: true };
  }
}
