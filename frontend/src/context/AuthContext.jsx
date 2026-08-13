import { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  function saveSession(authResponse) {
    const { token, ...userInfo } = authResponse;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
  }

  async function login(credentials) {
    const data = await authService.login(credentials);
    saveSession(data);
    return data;
  }

  async function register(payload) {
    const data = await authService.register(payload);
    saveSession(data);
    return data;
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
