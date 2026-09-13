import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addItem = (service) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === service.id);
      if (existing) return prev.map((i) => i.id === service.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...service, qty: 1 }];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeItem(id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => setItems([]);

  const totalPrice = (userDiscount = 0) => {
    return items.reduce((sum, item) => {
      const serviceDiscount = item.discount_percent || 0;
      const effectiveDiscount = Math.max(serviceDiscount, userDiscount);
      const discounted = item.price * (1 - effectiveDiscount / 100);
      return sum + discounted * item.qty;
    }, 0);
  };

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalPrice, totalCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
