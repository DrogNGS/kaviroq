import { apiClient } from './apiClient';
import type { Restaurant, ApiResponse, RestaurantFilters, NearbyFilters, Review } from '../types';

export const getRestaurants = async (filters: RestaurantFilters = {}): Promise<ApiResponse<Restaurant[]>> => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.commune)  params.append('commune',  filters.commune);
  if (filters.search)   params.append('search',   filters.search);
  if (filters.page)     params.append('page',     String(filters.page));
  if (filters.limit)    params.append('limit',    String(filters.limit));

  const query = params.toString();
  return apiClient.get<ApiResponse<Restaurant[]>>(
    `/businesses${query ? `?${query}` : ''}`, false
  );
};

export const getNearbyRestaurants = async (filters: NearbyFilters): Promise<ApiResponse<Restaurant[]>> => {
  const params = new URLSearchParams({
    lat:    String(filters.lat),
    lng:    String(filters.lng),
    radius: String(filters.radius ?? 5),
  });
  if (filters.category) params.append('category', filters.category);
  return apiClient.get<ApiResponse<Restaurant[]>>(
    `/businesses/nearby?${params.toString()}`, false
  );
};

export const getRestaurant = async (id: string): Promise<ApiResponse<Restaurant>> => {
  return apiClient.get<ApiResponse<Restaurant>>(`/businesses/${id}`, false);
};

export const createRestaurant = async (data: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> => {
  return apiClient.post<ApiResponse<Restaurant>>('/businesses', data);
};

export const updateRestaurant = async (id: string, data: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> => {
  return apiClient.put<ApiResponse<Restaurant>>(`/businesses/${id}`, data);
};

export const deleteRestaurant = async (id: string): Promise<ApiResponse<null>> => {
  return apiClient.delete<ApiResponse<null>>(`/businesses/${id}`);
};

export const getReviews = async (restaurantId: string): Promise<ApiResponse<Review[]>> => {
  return apiClient.get<ApiResponse<Review[]>>(`/businesses/${restaurantId}/reviews`, false);
};

export const addReview = async (restaurantId: string, data: { rating: number; comment?: string }): Promise<ApiResponse<Review>> => {
  return apiClient.post<ApiResponse<Review>>(`/businesses/${restaurantId}/reviews`, data);
};