import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { GUEST_CART_COOKIE_NAME } from './guest-token.util';

const GUEST_CART_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

// Public storefront API — không có AdminGuard, hoạt động cho cả khách vãng
// lai (cookie guest_cart_token) lẫn user đã đăng nhập (cookie session_token
// có sẵn từ AuthModule). Xem CartService cho logic resolve định danh.
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('summary')
  getSummary(@Req() req: Request) {
    return this.cartService.getSummary(req);
  }

  @Post('items')
  async addItem(
    @Body() dto: AddCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mintedGuestToken, ...summary } = await this.cartService.addItem(req, dto);
    if (mintedGuestToken) {
      res.cookie(GUEST_CART_COOKIE_NAME, mintedGuestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: GUEST_CART_COOKIE_MAX_AGE_MS,
      });
    }
    return { success: true, ...summary };
  }
}
