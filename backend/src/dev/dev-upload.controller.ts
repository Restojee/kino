import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

class DevUploadDto {
  @IsString() path!: string;
  @IsString() base64!: string;
}

@Controller('dev')
export class DevUploadController {
  @Post('upload-static')
  async upload(@Body() body: DevUploadDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('dev endpoint disabled in production');
    }

    const publicRoot = resolve(process.cwd(), 'public');
    const target = resolve(publicRoot, body.path.replace(/^\/+/, ''));
    if (!target.startsWith(publicRoot)) {
      throw new BadRequestException('path escapes public root');
    }

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(body.base64, 'base64'));
    return { ok: true, path: body.path, bytes: Buffer.byteLength(body.base64, 'base64') };
  }
}
