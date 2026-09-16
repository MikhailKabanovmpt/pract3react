
import { useState, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { validateCoupon } from '../api';

export default function CouponInput() {
  const { setCouponCode, setCouponDiscount, setCouponApplied } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const code = input.trim().toUpperCase();
    if (!code) { setError('Введите промокод'); return; }
    setError(''); setLoading(true);
    try {
      const res = await validateCoupon(code);
      setCouponCode(code);
      setCouponDiscount(res.data.discount_percent);
      setCouponApplied(true);
    } catch {
      
      if (user?.coupon_code === code) {
        setCouponCode(code);
        setCouponDiscount(user.coupon_discount);
        setCouponApplied(true);
      } else {
        setError('Купон недействителен');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="coupon-input">
      <input
        type="text"
        placeholder="Введите купон"
        value={input}
        onChange={e => { setInput(e.target.value); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && handleApply()}
      />
      {error && <div className="form-error">{error}</div>}
      <button onClick={handleApply} disabled={loading}>
        {loading ? '...' : 'Применить'}
      </button>
    </div>
  );
}