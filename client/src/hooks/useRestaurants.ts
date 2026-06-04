import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import type { RestaurantFilters } from '../types';

export interface Business {
  _id: string;
  name: string;
  category: string;
  description?: string;
  rating?: number;
  location?: { coordinates: [number, number] };
  address?: any;
  images?: string[];
  coverImage?: string;
  isOpen?: boolean;
  createdAt?: string;
}

interface UseRestaurantsResult {
  restaurants: Business[];
  isLoading:   boolean;
  error:       string | null;
  refresh:     () => void;
  setFilters:  (f: Partial<RestaurantFilters>) => void;
}

export function useRestaurants(initialFilters: RestaurantFilters = {}): UseRestaurantsResult {
  const [restaurants, setRestaurants] = useState<Business[]>([]);
  const [filters, setFiltersState]    = useState<RestaurantFilters>(initialFilters);
  const [isLoading, setLoading]       = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchData = useCallback(async (f: RestaurantFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.category) params.append('category', f.category);
      if (f.search)   params.append('search',   f.search);

      const query = params.toString();
      // Le backend retourne directement un tableau
      const data = await apiClient.get<Business[]>(
        `/businesses${query ? `?${query}` : ''}`, false
      );
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters.category, filters.search]);

  const refresh = useCallback(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const setFilters = useCallback((partial: Partial<RestaurantFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
    setRestaurants([]);
  }, []);

  return { restaurants, isLoading, error, refresh, setFilters };
}