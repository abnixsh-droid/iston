export const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: 'Umroli Project',
    slug: 'umroli-project',
    tagline: 'Modern 1 & 2 BHK Residences Near Station',
    status: 'under_development',
    location: 'Umroli Station West',
    description: 'Premier residential development by Iston Builder Group featuring modern 1 and 2 BHK apartments, top-tier amenities, and excellent railway connectivity.',
    cover_image: '/images/umroli-hero.jpg',
    highlights: ['5 mins from Umroli Station', 'RERA Approved', 'Clear Title Land', 'Gated Community'],
    amenities: ['24/7 Security', 'Children Play Area', 'Landscaped Garden', 'Power Backup', 'Lift'],
    configurations: '1 BHK & 2 BHK',
    possession: 'December 2026',
    rera_number: 'P52000012345',
    is_featured: true,
  },
];

export const DEFAULT_PROPERTIES = [
  {
    id: 1,
    title: '1 BHK Premium Flat — Umroli',
    slug: '1-bhk-premium-flat',
    project_id: 1,
    property_type: 'flats',
    bhk: 1,
    carpet_area: '425 sq.ft.',
    price: '₹18.5 Lacs',
    status: 'available',
    floor: '2nd Floor',
    facing: 'East',
    location: 'Umroli Station West',
    description: 'Well-ventilated 1 BHK flat with vitrified tile flooring, modular kitchen platform, and scenic balcony views.',
    cover_image: '/images/building.jpg',
    is_featured: true,
  },
  {
    id: 2,
    title: '2 BHK Luxury Apartment — Umroli',
    slug: '2-bhk-luxury-apartment',
    project_id: 1,
    property_type: 'flats',
    bhk: 2,
    carpet_area: '620 sq.ft.',
    price: '₹26.5 Lacs',
    status: 'available',
    floor: '4th Floor',
    facing: 'North-East',
    location: 'Umroli Station West',
    description: 'Spacious 2 BHK home designed for contemporary family living with double balconies and premium fittings.',
    cover_image: '/images/interior.jpg',
    is_featured: true,
  },
];

export const DEFAULT_PLOTS = [
  {
    id: 3,
    title: 'Clear Title Residential Plot',
    slug: 'clear-title-residential-plot',
    project_id: 1,
    property_type: 'plots',
    plot_number: 'P-14',
    area: '1,200 sq.ft.',
    price: '₹12.0 Lacs',
    status: 'available',
    location: 'Near Umroli Station',
    description: 'Demarcated NA residential plot with internal road access, water and electricity infrastructure ready.',
    cover_image: '/images/plot.jpg',
    is_featured: true,
  },
];

export const DEFAULT_HOUSES = [
  {
    id: 4,
    title: 'Gated Society Row House',
    slug: 'gated-society-row-house',
    project_id: 1,
    property_type: 'society_houses',
    house_type: 'Row House',
    bhk: 2,
    area: '950 sq.ft.',
    price: '₹34.0 Lacs',
    status: 'available',
    location: 'Umroli West',
    description: 'Independent ground plus one storey society house with private parking and personal garden space.',
    cover_image: '/images/house.jpg',
    is_featured: true,
  },
];

export const DEFAULT_PROMOTIONS = [
  {
    id: 1,
    title: 'Umroli Grand Launch Offer',
    subtitle: 'Book your dream home with zero stamp duty on first 25 bookings.',
    cta_label: 'Explore Umroli',
    cta_link: '/projects/umroli-project',
    image: '/images/umroli-hero.jpg',
    active: true,
  },
];

export const DEFAULT_UPDATES = [
  {
    id: 1,
    title: 'Tower Structure & Slabs Completed',
    stage: 'RCC Framework',
    progress_percent: 65,
    description: 'Fourth floor slab casted successfully. Brickwork and internal plumbing in progress.',
    image: '/images/construction.jpg',
    update_date: 'October 2026',
  },
];

export function getDefaultContent(path: string): any {
  const url = new URL(path, 'http://localhost');
  const type = url.searchParams.get('type') || 'properties';
  const slug = url.searchParams.get('slug');
  const id = url.searchParams.get('id');

  let list: any[] = [];
  if (type === 'projects') list = DEFAULT_PROJECTS;
  else if (type === 'properties') list = DEFAULT_PROPERTIES;
  else if (type === 'plots') list = DEFAULT_PLOTS;
  else if (type === 'society_houses') list = DEFAULT_HOUSES;
  else if (type === 'promotions') list = DEFAULT_PROMOTIONS;
  else if (type === 'progress_updates') list = DEFAULT_UPDATES;
  else if (type === 'buildings') {
    list = [
      {
        id: 1,
        name: 'Tower A',
        slug: 'tower-a',
        project_id: 1,
        status: 'under_development',
        floors: 7,
        units: 28,
        description: 'Multi-storey residential tower in Umroli.',
        cover_image: '/images/building.jpg',
      },
    ];
  }

  if (slug) return list.find((x) => x.slug === slug) || list[0] || null;
  if (id) return list.find((x) => String(x.id) === String(id)) || list[0] || null;
  return list;
}
