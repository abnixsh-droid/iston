import type { Row } from './api';

export type KindKey = 'properties' | 'plots' | 'society_houses';

export type KindConfig = {
  key: KindKey;
  base: string;
  label: string;
  plural: string;
  eyebrow: string;
  intro: string;
  fallbackImg: string;
  hasBhk: boolean;
  typeField: string | null;
  typeLabel: string;
  areaField: string;
  facts: (r: Row) => [string, unknown][];
};

export const KINDS: Record<KindKey, KindConfig> = {
  properties: {
    key: 'properties',
    base: '/properties',
    label: 'Flat',
    plural: 'Properties & Flats',
    eyebrow: 'Residences',
    intro: 'Browse flats and apartments across Iston Builder Group projects. Use search and filters to find the right home.',
    fallbackImg: '/images/interior.jpg',
    hasBhk: true,
    typeField: 'property_type',
    typeLabel: 'Property type',
    areaField: 'carpet_area',
    facts: (r) => [
      ['Property Type', r.property_type],
      ['Configuration', r.bhk ? `${r.bhk} BHK` : null],
      ['Carpet Area', r.carpet_area],
      ['Floor', r.floor],
      ['Facing', r.facing],
      ['Building', r.buildings?.name],
    ],
  },
  plots: {
    key: 'plots',
    base: '/plots',
    label: 'Plot',
    plural: 'Plots',
    eyebrow: 'Land',
    intro: 'Explore plots offered by Iston Builder Group. Details are updated as each layout is released.',
    fallbackImg: '/images/plot.jpg',
    hasBhk: false,
    typeField: null,
    typeLabel: '',
    areaField: 'area',
    facts: (r) => [
      ['Plot No.', r.plot_number],
      ['Plot Area', r.area],
      ['Facing', r.facing],
      ['Location', r.location],
    ],
  },
  society_houses: {
    key: 'society_houses',
    base: '/society-houses',
    label: 'Society House',
    plural: 'Society Houses',
    eyebrow: 'Community Living',
    intro: 'Independent and row houses within planned societies by Iston Builder Group.',
    fallbackImg: '/images/house.jpg',
    hasBhk: true,
    typeField: 'house_type',
    typeLabel: 'House type',
    areaField: 'area',
    facts: (r) => [
      ['House Type', r.house_type],
      ['Configuration', r.bhk ? `${r.bhk} BHK` : null],
      ['Area', r.area],
      ['Location', r.location],
    ],
  },
};
