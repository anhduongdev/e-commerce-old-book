import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Banner, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryBannerDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.BannerWhereInput = {
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.position ? { position: query.position } : {}),
      ...(query.isActive !== undefined
        ? { isActive: query.isActive === 'true' }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.banner.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: bigint) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Không tìm thấy banner');
    }
    return this.toResponse(banner);
  }

  async create(dto: CreateBannerDto) {
    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined;
    this.validateDateRange(startAt, endAt);

    try {
      const banner = await this.prisma.banner.create({
        data: {
          title: dto.title,
          imageUrl: dto.imageUrl,
          linkUrl: dto.linkUrl,
          position: dto.position,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
          startAt,
          endAt,
        },
      });
      return this.toResponse(banner);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Banner đã tồn tại');
      }
      throw error;
    }
  }

  async update(id: bigint, dto: UpdateBannerDto) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy banner');
    }

    const startAt =
      dto.startAt !== undefined ? new Date(dto.startAt) : undefined;
    const endAt = dto.endAt !== undefined ? new Date(dto.endAt) : undefined;

    this.validateDateRange(
      startAt ?? existing.startAt ?? undefined,
      endAt ?? existing.endAt ?? undefined,
    );

    try {
      const banner = await this.prisma.banner.update({
        where: { id },
        data: {
          title: dto.title,
          imageUrl: dto.imageUrl,
          linkUrl: dto.linkUrl,
          position: dto.position,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
          startAt,
          endAt,
        },
      });
      return this.toResponse(banner);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Banner đã tồn tại');
      }
      throw error;
    }
  }

  async remove(id: bigint) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy banner');
    }

    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }

  async reorder(dto: ReorderBannersDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.banner.update({
          where: { id: BigInt(item.id) },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  private validateDateRange(startAt?: Date, endAt?: Date) {
    if (startAt && endAt && endAt <= startAt) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }
  }

  private toResponse(banner: Banner) {
    return {
      id: banner.id.toString(),
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startAt: banner.startAt,
      endAt: banner.endAt,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };
  }
}
