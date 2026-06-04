import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import type { AuthResponse, LoginPayload, RegisterPayload, User, ApiResponse } from '../types';

const TOKEN_KEY = 'kaviroq_token';
const USER_KEY  = 'kaviroq_user';

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const res = await apiClient.post<AuthResponse>('/auth/register', payload, false);
  await AsyncStorage.multiSet([[TOKEN_KEY, res.token], [USER_KEY, JSON.stringify(res.user)]]);
  return res;
};

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await apiClient.post<AuthResponse>('/auth/login', payload, false);
  await AsyncStorage.multiSet([[TOKEN_KEY, res.token], [USER_KEY, JSON.stringify(res.user)]]);
  return res;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  return apiClient.get<ApiResponse<User>>('/auth/me');
};

export const updateProfile = async (data: Partial<User>): Promise<ApiResponse<User>> => {
  const res = await apiClient.put<ApiResponse<User>>('/auth/me', data);
  if (res.success && res.data) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data));
  }
  return res;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  return apiClient.put('/auth/change-password', { currentPassword, newPassword });
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

export const restoreSession = async (): Promise<{ token: string; user: User } | null> => {
  try {
    const [token, userJson] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    if (token[1] && userJson[1]) {
      return { token: token[1], user: JSON.parse(userJson[1]) };
    }
    return null;
  } catch {
    return null;
  }
};