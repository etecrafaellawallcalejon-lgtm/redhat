import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserStatus } from '../types';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  pendingSwitchUser: User | null;
  login: (payload: { identifier: string; password: string }) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateStatus: (status: UserStatus, customStatus?: string) => Promise<void>;
  switchUser: (userId: string, password?: string) => Promise<void>;
  requestSwitchProfile: (targetUser: User) => void;
  cancelSwitchProfile: () => void;
  switchProfileWithPassword: (userId: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('redchat_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingSwitchUser, setPendingSwitchUser] = useState<User | null>(null);
  const { addToast } = useToast();

  const isAdmin = !!(user && (user.role === 'admin' || user.is_admin || user.username === 'admin'));

  const loadUser = useCallback(async (jwtToken: string) => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      wsClient.connect(jwtToken);
    } catch (err: any) {
      console.error('Failed to authenticate token:', err);
      localStorage.removeItem('redchat_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, loadUser]);

  const login = async (payload: { identifier: string; password: string }) => {
    try {
      const data = await api.login(payload);
      localStorage.setItem('redchat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      wsClient.connect(data.token);
      addToast({
        type: 'success',
        title: 'Bem-vindo de volta!',
        message: `Conectado como @${data.user.username}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Falha no login',
        message: err.message || 'Verifique suas credenciais.',
      });
      throw err;
    }
  };

  const register = async (payload: { username: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      const data = await api.register(payload);
      localStorage.setItem('redchat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      wsClient.connect(data.token);
      addToast({
        type: 'success',
        title: 'Conta criada com sucesso!',
        message: `Seja bem-vindo ao RedChat, @${data.user.username}!`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro no cadastro',
        message: err.message || 'Não foi possível criar a conta.',
      });
      throw err;
    }
  };

  const logout = () => {
    wsClient.disconnect();
    localStorage.removeItem('redchat_token');
    setToken(null);
    setUser(null);
    addToast({
      type: 'info',
      title: 'Desconectado',
      message: 'Sessão encerrada com segurança.',
    });
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const res = await api.updateProfile(updates);
      setUser(res.user);
      addToast({
        type: 'success',
        title: 'Perfil atualizado!',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar perfil',
        message: err.message,
      });
      throw err;
    }
  };

  const updateStatus = async (status: UserStatus, customStatus?: string) => {
    try {
      const updates: Partial<User> = { status };
      if (customStatus !== undefined) updates.custom_status = customStatus;
      
      const res = await api.updateProfile(updates);
      setUser(res.user);
      wsClient.send('update_status', { status, custom_status: customStatus });
    } catch (err: any) {
      console.error('Failed to update status', err);
    }
  };

  const switchUser = async (userId: string, password?: string) => {
    try {
      const data = await api.switchUser(userId, password);
      localStorage.setItem('redchat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      wsClient.disconnect();
      wsClient.connect(data.token);
      addToast({
        type: 'success',
        title: 'Troca de perfil realizada',
        message: `Agora conectado como @${data.user.username}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao trocar perfil',
        message: err.message,
      });
      throw err;
    }
  };

  const requestSwitchProfile = (targetUser: User) => {
    const isTargetAdmin =
      targetUser.role === 'admin' ||
      targetUser.is_admin ||
      targetUser.username.toLowerCase() === 'admin' ||
      targetUser.id === 'usr_admin_master';

    const isDemo = !isTargetAdmin && ['usr_rafaela', 'usr_alex', 'usr_lucas', 'usr_beatriz', 'usr_clara'].includes(targetUser.id);
    
    if (isDemo) {
      switchUser(targetUser.id);
    } else {
      setPendingSwitchUser(targetUser);
    }
  };

  const cancelSwitchProfile = () => {
    setPendingSwitchUser(null);
  };

  const switchProfileWithPassword = async (userId: string, password: string) => {
    await switchUser(userId, password);
    setPendingSwitchUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,
        pendingSwitchUser,
        login,
        register,
        logout,
        updateProfile,
        updateStatus,
        switchUser,
        requestSwitchProfile,
        cancelSwitchProfile,
        switchProfileWithPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
