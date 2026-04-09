import {
  Controller, Get, Post, Param, Res, UseGuards, UseInterceptors,
  UploadedFile, Req, BadRequestException, NotFoundException, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import { v4 as uuid } from 'uuid';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response): StreamableFile {
    const filePath = join(uploadsDir, filename);
    if (!existsSync(filePath)) throw new NotFoundException('File not found');
    // Guess content type from extension
    const ext = extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp',
      '.gif': 'image/gif', '.heic': 'image/heic',
    };
    res.set('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000');
    return new StreamableFile(createReadStream(filePath));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload an image and return its public URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file provided');
    const proto = (req.headers['x-forwarded-proto'] as string) ?? req.protocol;
    const host  = (req.headers['x-forwarded-host'] as string) ?? req.get('host');
    return { url: `${proto}://${host}/api/uploads/${file.filename}` };
  }
}
