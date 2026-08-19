import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const CATEGORY_UPLOAD_DIR = join(process.cwd(), 'uploads', 'categories');
const SERIES_UPLOAD_DIR = join(process.cwd(), 'uploads', 'series');
const PRODUCT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'products');

@Injectable()
export class UploadsService {
  async saveCategoryImage(file: Express.Multer.File): Promise<{ url: string }> {
    // Never trust the client-supplied filename/extension — derive it from
    // the validated MIME type and generate a random name instead.
    const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
    }

    await mkdir(CATEGORY_UPLOAD_DIR, { recursive: true });
    const filename = `${randomBytes(16).toString('hex')}${extension}`;
    await writeFile(join(CATEGORY_UPLOAD_DIR, filename), file.buffer);

    return { url: `/uploads/categories/${filename}` };
  }

  async saveSeriesImage(file: Express.Multer.File): Promise<{ url: string }> {
    const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
    }

    await mkdir(SERIES_UPLOAD_DIR, { recursive: true });
    const filename = `${randomBytes(16).toString('hex')}${extension}`;
    await writeFile(join(SERIES_UPLOAD_DIR, filename), file.buffer);

    return { url: `/uploads/series/${filename}` };
  }

  async saveProductImage(file: Express.Multer.File): Promise<{ url: string }> {
    const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
    }

    await mkdir(PRODUCT_UPLOAD_DIR, { recursive: true });
    const filename = `${randomBytes(16).toString('hex')}${extension}`;
    await writeFile(join(PRODUCT_UPLOAD_DIR, filename), file.buffer);

    return { url: `/uploads/products/${filename}` };
  }
}
