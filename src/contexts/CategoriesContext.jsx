
import { createContext, useState, useEffect } from 'react';
import { getCategories, createCategory as apiCreateCategory } from '../api';

export const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addCategory = async (name) => {
    const res = await apiCreateCategory(name);
    setCategories(prev => [...prev, res.data]);
    return res.data;
  };

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, addCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}
