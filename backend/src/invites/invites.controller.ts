import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './invites.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class InvitesController {
  constructor(private invites: InvitesService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateInviteDto) {
    return this.invites.create(user.id, dto);
  }

  @Get()
  list(@Query() p: PaginationDto) {
    return this.invites.list(p);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.invites.revoke(id);
  }
}
