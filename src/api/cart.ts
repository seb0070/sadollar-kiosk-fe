import client from './client';
import type { CartResponse } from '../types';

export const getCart = async (sessionId: string): Promise<CartResponse> => {
  const res = await client.get(`/cart/${sessionId}`);
  return res.data;
};

export const addCartItem = async (params: {
  session_id: string;
  menu_id: number;
  quantity: number;
  unit_price: number;
}) => {
  const res = await client.post('/cart', params);
  return res.data;
};

export const updateCartItem = async (cartId: number, quantity: number) => {
  const res = await client.put(`/cart/${cartId}`, { quantity });
  return res.data;
};

export const deleteCartItem = async (cartId: number) => {
  const res = await client.delete(`/cart/${cartId}`);
  return res.data;
};

export const clearCart = async (sessionId: string) => {
  const res = await client.delete(`/cart/session/${sessionId}`);
  return res.data;
};