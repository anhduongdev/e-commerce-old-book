import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { Cart } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { getSessionCookie } from '../auth/session-cookie.util';
import { getGuestCartToken } from './guest-token.util';
import { AddCartItemDto } from './dto/add-cart-item.dto';

interface CartIdentity {
  userId?: bigint;
  guestToken?: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: string;
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getSummary(req: Request): Promise<CartSummary> {
    const identity = await this.resolveIdentity(req);
    if (!identity.userId && !identity.guestToken) {
      // Chưa từng có cookie nào — không đụng DB, không tạo cart rác.
      return { itemCount: 0, subtotal: '0' };
    }

    const cart = await this.findCart(identity);
    if (!cart) {
      return { itemCount: 0, subtotal: '0' };
    }
    return this.computeSummary(cart.id);
  }

  async addItem(
    req: Request,
    dto: AddCartItemDto,
  ): Promise<CartSummary & { mintedGuestToken?: string }> {
    const identity = await this.resolveIdentity(req);
    const variantId = BigInt(dto.variantId);

    // Không tin dữ liệu giá/tồn từ client — đọc lại từ DB và validate ở đây.
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        isActive: true,
        deletedAt: null,
        product: { status: 'ACTIVE', deletedAt: null },
      },
    });
    if (!variant) {
      throw new BadRequestException('Sản phẩm không khả dụng');
    }

    const availableQuantity = Math.max(0, variant.stockQuantity - variant.reservedQuantity);
    if (availableQuantity <= 0) {
      throw new BadRequestException('Sản phẩm đã hết hàng');
    }

    let mintedGuestToken: string | undefined;
    let cart = await this.findCart(identity);
    if (!cart) {
      const created = await this.createCart(identity);
      cart = created.cart;
      mintedGuestToken = created.mintedGuestToken;
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    const newQuantity = (existing?.quantity ?? 0) + dto.quantity;
    if (newQuantity > availableQuantity) {
      throw new BadRequestException(
        existing
          ? `Chỉ còn ${availableQuantity} cuốn, giỏ hàng của bạn đã có ${existing.quantity}`
          : `Chỉ còn ${availableQuantity} cuốn`,
      );
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: newQuantity },
      create: { cartId: cart.id, variantId, quantity: newQuantity },
    });

    const summary = await this.computeSummary(cart.id);
    return { ...summary, mintedGuestToken };
  }

  private async resolveIdentity(req: Request): Promise<CartIdentity> {
    const sessionToken = getSessionCookie(req);
    if (sessionToken) {
      const user = await this.authService.validateSession(sessionToken);
      if (user) return { userId: user.id };
    }
    return { guestToken: getGuestCartToken(req) };
  }

  private findCart(identity: CartIdentity): Promise<Cart | null> {
    if (identity.userId) {
      return this.prisma.cart.findUnique({ where: { userId: identity.userId } });
    }
    if (identity.guestToken) {
      return this.prisma.cart.findUnique({ where: { guestToken: identity.guestToken } });
    }
    return Promise.resolve(null);
  }

  // Không có merge-giỏ-khách-vào-giỏ-user-khi-đăng-nhập ở đây — đó là việc
  // của module Auth sau này, ngoài phạm vi hiện tại.
  private async createCart(
    identity: CartIdentity,
  ): Promise<{ cart: Cart; mintedGuestToken?: string }> {
    if (identity.userId) {
      const cart = await this.prisma.cart.create({ data: { userId: identity.userId } });
      return { cart };
    }
    const token = identity.guestToken ?? randomUUID();
    const cart = await this.prisma.cart.upsert({
      where: { guestToken: token },
      update: {},
      create: { guestToken: token },
    });
    return { cart, mintedGuestToken: token };
  }

  private async computeSummary(cartId: bigint): Promise<CartSummary> {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { variant: { select: { price: true } } },
    });
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.variant.price * BigInt(item.quantity),
      0n,
    );
    return { itemCount, subtotal: subtotal.toString() };
  }
}
