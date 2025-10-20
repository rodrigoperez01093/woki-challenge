import type { Restaurant } from '@/types';

export const restaurant: Restaurant = {
  id: 'REST_001',
  name: 'Bistro Central',
  timezone: 'America/Argentina/Buenos_Aires',
  serviceHours: [
    { start: '12:00', end: '16:00' },
    { start: '20:00', end: '00:00' },
  ],
};
