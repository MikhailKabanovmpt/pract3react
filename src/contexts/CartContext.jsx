
import { createContext, useState, useCallback, useMemo } from 'react';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart]           = useState([]);
  const [couponCode, setCouponCode]         = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied]   = useState(false);

  const addToCart = useCallback((service) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === service.id);
      if (existing) {
        return prev.map(i => i.id === service.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...service, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
  }, []);

  const applyDiscountedPrice = (price, discountPct) =>
    discountPct > 0 ? Math.round(price * (1 - discountPct / 100)) : price;

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => {
      const price = applyDiscountedPrice(item.price, item.discount_percent || 0);
      return sum + price * item.qty;
    }, 0), [cart]);

  const total = useMemo(() => {
    if (couponApplied && couponDiscount > 0) {
      return Math.round(subtotal * (1 - couponDiscount / 100));
    }
    return subtotal;
  }, [subtotal, couponApplied, couponDiscount]);

  const savings = subtotal - total;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart,
      couponCode, setCouponCode,
      couponDiscount, setCouponDiscount,
      couponApplied, setCouponApplied,
      subtotal, total, savings, totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}
