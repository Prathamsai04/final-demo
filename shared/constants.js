export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'parking', label: 'Free parking' },
  { id: 'ac', label: 'Air conditioning' },
  { id: 'heating', label: 'Heating' },
  { id: 'pool', label: 'Pool' },
  { id: 'hot-tub', label: 'Hot tub' },
  { id: 'washer', label: 'Washer' },
  { id: 'workspace', label: 'Dedicated workspace' },
  { id: 'tv', label: 'TV' },
  { id: 'breakfast', label: 'Breakfast included' },
  { id: 'pets', label: 'Pets allowed' },
  { id: 'fireplace', label: 'Fireplace' },
  { id: 'bbq', label: 'BBQ grill' },
  { id: 'garden', label: 'Garden' },
  { id: 'beach-access', label: 'Beach access' },
  { id: 'mountain-view', label: 'Mountain view' },
  { id: 'ev-charger', label: 'EV charger' },
];

export const AMENITY_IDS = AMENITIES.map((a) => a.id);
export const amenityLabel = (id) => AMENITIES.find((a) => a.id === id)?.label || id;

export const PROPERTY_TYPES = ['Villa', 'Cottage', 'Cabin', 'Apartment', 'Farmhouse', 'Treehouse', 'Bungalow', 'Heritage home'];

export const ROLES = ['guest', 'owner', 'admin'];
