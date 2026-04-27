import client from './client';
import type { MenuItem } from '../types';

export const getMenus = async (q?: string): Promise<MenuItem[]> => {
  const res = await client.get('/menu', {
    params: { limit: 200, ...(q ? { q } : undefined) } 
  });
  return res.data.items;
};

export const getMenuById = async (id: number): Promise<MenuItem> => {
  const res = await client.get(`/menu/${id}`);
  return res.data;
};