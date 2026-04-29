import { useState } from 'react';

export interface CartItemLocal {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img_url: string;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItemLocal[]>([]);

  const addItem = (item: Omit<CartItemLocal, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, addItem, removeItem, total };
};