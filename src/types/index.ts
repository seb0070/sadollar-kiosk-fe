export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  spicy_level: number;
  kcal?: number;
  description?: string;
  img_url?: string;
  badge?: string;
}

export interface CartItem {
  cart_id: number;
  menu_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  img_url?: string;
  is_set?: number;
  drink_name?: string;
  drink_price?: number;
  drink_extra_price?: number;
  side_name?: string;
  side_price?: number;
  side_extra_price?: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface ScreenItem {
  name: string;
  price: number;
  img_url: string;
}

export type ActionType =
  | 'PAGE:cart'
  | 'PAGE:welcome'
  | 'PAGE:menu'
  | 'PAGE:complete'
  | 'PAGE:payment_card'
  | 'PAGE:payment_mobile'
  | 'TIMEOUT'
  | 'CART_ADD'
  | `TAB:${string}`
  | 'RECOMMEND'
  | `DRINK_SELECT:${string}`
  | `SIDE_SELECT:${string}`
  | `TYPE_SELECT:${string}`
  | string;

export interface WsMessage {
  stt_text: string;
  refined_text: string;
  voice: string;
  screen: string;
  action: ActionType;
  drink_option?: string;
  side_option?: string;
}

export interface OrderResponse {
  order_id: number;
  total_price: number;
  message: string;
}