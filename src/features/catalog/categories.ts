import { Bird, Coffee, Keyboard, Sticker, type LucideIcon } from 'lucide-react';
import type { Category } from '../../api/contract';

export const CATEGORY_META: Record<
  Category,
  { label: string; tagline: string; icon: LucideIcon; tint: string }
> = {
  keyboards: {
    label: 'Keyboards',
    tagline: 'Clicky, tactile and split boards for long debugging sessions.',
    icon: Keyboard,
    tint: 'bg-indigo-50 text-indigo-700',
  },
  ducks: {
    label: 'Rubber Ducks',
    tagline: 'Explain your bug out loud. The duck already knows.',
    icon: Bird,
    tint: 'bg-amber-50 text-amber-800',
  },
  coffee: {
    label: 'Coffee',
    tagline: 'Roasts strong enough for a 2 a.m. production incident.',
    icon: Coffee,
    tint: 'bg-orange-50 text-orange-800',
  },
  stickers: {
    label: 'Stickers',
    tagline: 'Laptop lids deserve strict mode too.',
    icon: Sticker,
    tint: 'bg-pink-50 text-pink-800',
  },
};

export const SORT_LABELS = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'rating-desc': 'Top rated',
} as const;

export const CATEGORY_FEATURES: Record<Category, string[]> = {
  keyboards: [
    'Hot-swappable switches',
    'PBT double-shot keycaps',
    'USB-C with detachable cable',
    'Per-key RGB you can turn off',
  ],
  ducks: [
    'Squeaks only when asked',
    'Floats in coffee (not recommended)',
    'Non-judgemental listener',
    'Desk-safe rubber',
  ],
  coffee: [
    'Roasted to order',
    'Whole bean or ground',
    'Tasting notes: deadlines, cocoa',
    'Ethically sourced',
  ],
  stickers: [
    'Weatherproof vinyl',
    'Removes without residue',
    'Matte, scratch-resistant finish',
    'Fits any laptop lid',
  ],
};
