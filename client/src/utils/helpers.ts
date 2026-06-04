import type { RestaurantCategory } from '../types';

export const CATEGORY_LABELS: Record<RestaurantCategory, string> = {
  restaurant:  'Restaurants',
  patisserie:  'Pâtisseries',
  hotel:       'Hôtels',
  maquis:      'Maquis',
  fast_food:   'Fast Food',
  cafe:        'Cafés',
};

export const CATEGORY_EMOJI: Record<RestaurantCategory, string> = {
  restaurant:  '🍽️',
  patisserie:  '🍰',
  hotel:       '🏨',
  maquis:      '🍖',
  fast_food:   '🍔',
  cafe:        '☕',
};

export const COMMUNES_ABIDJAN = [
  'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
  'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon',
  'Bingerville', 'Grand-Bassam',
];

export const formatRating = (rating: number): string => {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
};

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

export const getDistanceKm = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const truncate = (text: string, max = 80): string =>
  text.length <= max ? text : text.slice(0, max) + '…';