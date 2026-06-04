import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import * as authService from '../services/authService';
import type { AuthState, User, LoginPayload, RegisterPayload } from '../types';

interface AuthContextType extends AuthState {
  login:      (payload: LoginPayload)    => Promise<void>;
  register:   (payload: RegisterPayload) => Promise<void>;
  logout:     () => Promise<void>;
  updateUser: (data: Partial<User>)      => void;
}

type Action =
  | { type: 'RESTORE';     token: string; user: User }
  | { type: 'LOGIN';       token: string; user: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'SET_LOADING'; value: boolean };

const initialState: AuthState = {
  user: null, token: null, isLoading: true, isAuthenticated: false,
};

function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'RESTORE':
    case 'LOGIN':
      return { ...state, user: action.user, token: action.token, isLoading: false, isAuthenticated: true };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.user };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    (async () => {
      const session = await authService.restoreSession();
      if (session) {
        dispatch({ type: 'RESTORE', token: session.token, user: session.user });
      } else {
        dispatch({ type: 'SET_LOADING', value: false });
      }
    })();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await authService.login(payload);
      dispatch({ type: 'LOGIN', token: res.token, user: res.user });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await authService.register(payload);
      dispatch({ type: 'LOGIN', token: res.token, user: res.user });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    if (!state.user) return;
    dispatch({ type: 'UPDATE_USER', user: { ...state.user, ...data } });
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
};