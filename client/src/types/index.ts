export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'client' | 'business' | 'admin';
  avatar?: string;
  address?: {
    commune?: string;
    quartier?: string;
    description?: string;
  };
  favorites?: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'client' | 'business' | 'admin';
}


export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export type RestaurantCategory =
  | 'restaurant'
  | 'patisserie'
  | 'hotel'
  | 'maquis'
  | 'fast_food'
  | 'cafe';

export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  category: RestaurantCategory;
  owner: Partial<User>;
  images: string[];
  coverImage?: string;
  address: {
    commune: string;
    quartier?: string;
    description?: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone?: string;
  priceRange?: '€' | '€€' | '€€€';
  rating: number;
  reviewCount: number;
  tags?: string[];
  isOpen: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  restaurant: string;
  user: Partial<User>;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
}

export interface RestaurantFilters {
  category?: RestaurantCategory;
  commune?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NearbyFilters {
  lat: number;
  lng: number;
  radius?: number;
  category?: RestaurantCategory;
}