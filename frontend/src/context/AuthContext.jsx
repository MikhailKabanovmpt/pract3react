import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('salon_token');
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('salon_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const authLogin = (token, userData) => {
    localStorage.setItem('salon_token', token);
    setUser(userData);
  };

  const authLogout = () => {
    localStorage.removeItem('salon_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authLogin, authLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
