import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGetMe, apiLogin, apiRegister, apiGoogleLogin } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ca_token');
    if (!token) { setLoading(false); return; }
    apiGetMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('ca_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await apiLogin({ email, password });
    localStorage.setItem('ca_token', token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const { token, user } = await apiRegister({ username, email, password });
    localStorage.setItem('ca_token', token);
    setUser(user);
    return user;
  }, []);

  const googleLogin = useCallback(
  async (credential) => {
    const { token, user } =
      await apiGoogleLogin(
        credential
      );

    localStorage.setItem(
      'ca_token',
      token
    );

    setUser(user);

    return user;
  },
  []
);

  const logout = useCallback(() => {
    localStorage.removeItem('ca_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await apiGetMe();
      setUser(u);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
  value={{
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    refreshUser
  }}
>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
