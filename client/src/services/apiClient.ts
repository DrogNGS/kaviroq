import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__
  ? (typeof window !== 'undefined' && window.location?.hostname === 'localhost'
      ? 'http://localhost:5000/api'        // web
      : 'http://192.168.1.64:5000/api')    // téléphone
  : 'https://api.kaviroq.com/api';

const getToken = async () => {
  try {
    return await AsyncStorage.getItem('kaviroq_token');
  } catch {
    return null;
  }
};

const buildHeaders = async (withAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (withAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: unknown,
  withAuth = true
): Promise<T> {
  const headers = await buildHeaders(withAuth);
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
  return data as T;
}

export const apiClient = {
  get:    <T>(endpoint: string, withAuth = true) =>
    request<T>('GET', endpoint, undefined, withAuth),
  post:   <T>(endpoint: string, body: unknown, withAuth = true) =>
    request<T>('POST', endpoint, body, withAuth),
  put:    <T>(endpoint: string, body: unknown, withAuth = true) =>
    request<T>('PUT', endpoint, body, withAuth),
  delete: <T>(endpoint: string, withAuth = true) =>
    request<T>('DELETE', endpoint, undefined, withAuth),
};

export { BASE_URL };