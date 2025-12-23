import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage on refresh to keep the user logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // 2. Logic: Detect role based on position string
    let role = 'employee'; // Default
    const pos = (userData.position || '').toLowerCase();
    
    if (pos.includes('admin')) role = 'admin';
    else if (pos.includes('manager')) role = 'manager';

    // 3. Create the final user object and save it
    const finalUser = { ...userData, role };
    setUser(finalUser);
    localStorage.setItem('currentUser', JSON.stringify(finalUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);