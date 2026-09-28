import type { Row } from '../lib/api';
import { price, statusLabel } from '../lib/format';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'bool' | 'image' | 'list' | 'gallery' | 'ref' | 'date';
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: [string, string][];
  ref?: 'projects' | 'buildings';
  required?: boolean;
  help?: string;
  full?: boolean;
  placeholder?: string;
};
export type Entity = {
  key: string;
  table: string;
  label: string;
  singular: string;
  titleField: string;
  publicBase?: string;
  fields: Field[];
  defaults: Row;
  subtitle: (r: Row) => string;
};

const PROJECT_STATUS: [string, string][] = [
  ['current', 'Current'],
  ['upcoming', 'Upcoming'],
  ['under_development', 'Under Development'],
  ['completed', 'Completed'],
];
const LISTING_STATUS: [string, string][] = [
  ['available', 'Available'],
  ['booked', 'Booked'],
  ['sold', 'Sold Out'],
  ['coming_soon', 'Coming Soon'],
];

const common = {
  slug: { name: 'slug', label: 'URL slug', type: 'text' as FieldType, help: 'Leave blank to generate automatically.' },
  description: { name: 'description', label: 'Description', type: 'textarea' as FieldType, full: true },
  cover: { name: 'cover_image', label: 'Cover image', type: 'image' as FieldType, full: true },
  gallery: { name: 'gallery', label: 'Gallery images', type: 'gallery' as FieldType, full: true },
  amenities: { name: 'amenities', label: 'Amenities / features (one per line)', type: 'list' as FieldType, full: true },
  project: { name: 'project_id', label: 'Project', type: 'ref' as FieldType, ref: 'projects' as const },
  price: { name: 'price', label: 'Price (display text)', type: 'text' as FieldType, placeholder: 'Leave blank to show “Price on Request”' },
  featured: { name: 'is_featured', label: 'Featured on homepage', type: 'bool' as FieldType },
  demo: { name: 'is_demo', label: 'Demo content (shows “Demo” badge)', type: 'bool' as FieldType },
  sort: { name: 'sort_order', label: 'Sort order', type: 'number' as FieldType, help: 'Lower numbers appear first.' },
};

export const ENTITIES: Record<string, Entity> = {
  projects: {
    key: 'projects',
    table: 'projects',
    label: 'Projects',
    singular: 'Project',
    titleField: 'name',
    publicBase: '/projects',
    defaults: { status: 'upcoming', is_demo: false, is_featured: false, gallery: [], highlights: [], amenities: [] },
    subtitle: (r) => `${statusLabel(r.status)} · ${r.location || 'Location not set'}`,
    fields: [
      { name: 'name', label: 'Project name', type: 'text', required: true },
      common.slug,
      { name: 'status', label: 'Status', type: 'select', options: PROJECT_STATUS, required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text', full: true },
      common.description,
      { name: 'configurations', label: 'Configurations', type: 'text', placeholder: 'e.g. 1 & 2 BHK' },
      { name: 'total_area', label: 'Total area', type: 'text' },
      { name: 'possession', label: 'Possession', type: 'text' },
      { name: 'rera_number', label: 'RERA number', type: 'text' },
      { name: 'progress_percent', label: 'Construction progress %', type: 'number', help: 'Leave blank to show “Update coming soon”.' },
      common.sort,
      common.cover,
      common.gallery,
      { name: 'highlights', label: 'Highlights (one per line)', type: 'list', full: true },
      common.amenities,
      common.featured,
      common.demo,
    ],
  },
  buildings: {
    key: 'buildings',
    table: 'buildings',
    label: 'Buildings',
    singular: 'Building',
    titleField: 'name',
    publicBase: '/buildings',
    defaults: { status: 'coming_soon', is_demo: false, gallery: [], amenities: [] },
    subtitle: (r) => `${r.projects?.name || 'No project'} · ${statusLabel(r.status)}`,
    fields: [
      { name: 'name', label: 'Building name', type: 'text', required: true },
      common.slug,
      common.project,
      { name: 'status', label: 'Status', type: 'select', options: [...PROJECT_STATUS, ...LISTING_STATUS] },
      { name: 'floors', label: 'Floors', type: 'text' },
      { name: 'units', label: 'Units', type: 'text' },
      common.description,
      common.sort,
      common.cover,
      common.gallery,
      common.amenities,
      common.demo,
    ],
  },
  properties: {
    key: 'properties',
    table: 'properties',
    label: 'Properties / Flats',
    singular: 'Property',
    titleField: 'title',
    publicBase: '/properties',
    defaults: { status: 'coming_soon', property_type: 'Apartment', is_demo: false, is_featured: false, gallery: [], amenities: [] },
    subtitle: (r) => `${r.projects?.name || 'No project'} · ${r.bhk ? r.bhk + ' BHK · ' : ''}${price(r.price)}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      common.slug,
      common.project,
      { name: 'building_id', label: 'Building', type: 'ref', ref: 'buildings' },
      { name: 'property_type', label: 'Property type', type: 'text', placeholder: 'e.g. Apartment' },
      { name: 'bhk', label: 'BHK', type: 'number' },
      { name: 'carpet_area', label: 'Carpet area', type: 'text', placeholder: 'e.g. 650 sq.ft' },
      common.price,
      { name: 'status', label: 'Status', type: 'select', options: LISTING_STATUS },
      { name: 'floor', label: 'Floor', type: 'text' },
      { name: 'facing', label: 'Facing', type: 'text' },
      common.sort,
      common.description,
      common.cover,
      common.gallery,
      common.amenities,
      common.featured,
      common.demo,
    ],
  },
  plots: {
    key: 'plots',
    table: 'plots',
    label: 'Plots',
    singular: 'Plot',
    titleField: 'title',
    publicBase: '/plots',
    defaults: { status: 'coming_soon', is_demo: false, is_featured: false, gallery: [], amenities: [] },
    subtitle: (r) => `${r.projects?.name || 'No project'} · ${r.area || 'Area not set'} · ${price(r.price)}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      common.slug,
      common.project,
      { name: 'plot_number', label: 'Plot number', type: 'text' },
      { name: 'area', label: 'Plot area', type: 'text' },
      common.price,
      { name: 'status', label: 'Status', type: 'select', options: LISTING_STATUS },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'facing', label: 'Facing', type: 'text' },
      common.sort,
      common.description,
      common.cover,
      common.gallery,
      common.amenities,
      common.featured,
      common.demo,
    ],
  },
  society_houses: {
    key: 'society_houses',
    table: 'society_houses',
    label: 'Society Houses',
    singular: 'Society House',
    titleField: 'title',
    publicBase: '/society-houses',
    defaults: { status: 'coming_soon', is_demo: false, is_featured: false, gallery: [], amenities: [] },
    subtitle: (r) => `${r.projects?.name || 'No project'} · ${r.house_type || 'Type not set'} · ${price(r.price)}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      common.slug,
      common.project,
      { name: 'house_type', label: 'House type', type: 'text', placeholder: 'e.g. Row House' },
      { name: 'bhk', label: 'BHK', type: 'number' },
      { name: 'area', label: 'Area', type: 'text' },
      common.price,
      { name: 'status', label: 'Status', type: 'select', options: LISTING_STATUS },
      { name: 'location', label: 'Location', type: 'text' },
      common.sort,
      common.description,
      common.cover,
      common.gallery,
      common.amenities,
      common.featured,
      common.demo,
    ],
  },
  progress_updates: {
    key: 'progress_updates',
    table: 'progress_updates',
    label: 'Progress Updates',
    singular: 'Progress Update',
    titleField: 'title',
    defaults: { is_demo: false },
    subtitle: (r) => `${r.projects?.name || 'No project'} · ${r.update_date || 'No date'}${typeof r.progress_percent === 'number' ? ` · ${r.progress_percent}%` : ''}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      { ...common.project, required: true },
      { name: 'update_date', label: 'Date', type: 'date' },
      { name: 'stage', label: 'Stage', type: 'text', placeholder: 'e.g. Foundation' },
      { name: 'progress_percent', label: 'Progress %', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'image', label: 'Site photo', type: 'image', full: true },
      common.demo,
    ],
  },
  promotions: {
    key: 'promotions',
    table: 'promotions',
    label: 'Promotions',
    singular: 'Promotion',
    titleField: 'title',
    defaults: { active: true, is_demo: false, cta_link: '/contact' },
    subtitle: (r) => `${r.active ? 'Active' : 'Hidden'} · ${r.cta_link || 'No link'}`,
    fields: [
      { name: 'title', label: 'Headline', type: 'text', required: true, full: true },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea', full: true },
      { name: 'cta_label', label: 'Button label', type: 'text' },
      { name: 'cta_link', label: 'Button link (site path)', type: 'text', placeholder: '/projects/umroli' },
      { name: 'image', label: 'Background image', type: 'image', full: true },
      common.sort,
      { name: 'active', label: 'Active (show on homepage)', type: 'bool' },
      common.demo,
    ],
  },
};
