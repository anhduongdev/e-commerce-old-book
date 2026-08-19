export interface CartSummary {
  itemCount: number;
  subtotal: string;
}

export interface AddCartItemPayload {
  variantId: string;
  quantity: number;
}

export interface AddCartItemResponse extends CartSummary {
  success: true;
}
