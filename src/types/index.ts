export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  spicy_level: number;
  kcal: number;
  description?: string;
}

export interface CartItem {
  cart_id: number;
  menu_id: number;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface WsMessage {
  stt_text: string;
  refined_text: string;
  response: string;
}

export interface OrderResponse {
  order_id: number;
  total_price: number;
  message: string;
}