import { addDays, todayISO } from '../domain/dates.js';
import { calculatePrice } from '../domain/pricing.js';

// bcrypt hash of "demo1234" (cost 8). Demo credentials are intentionally public.
export const DEMO_PASSWORD = 'demo1234';
const DEMO_HASH = '$2b$08$.cC2q/HtEgQJvAOKl2vvf.fX3tJnNkjuxOywj5.WqAkR2TlQDkgi2';

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

export const DEMO_ACCOUNTS = [
  { role: 'guest', email: 'guest@homestays.demo', password: DEMO_PASSWORD, name: 'Alex Morgan' },
  { role: 'owner', email: 'owner@homestays.demo', password: DEMO_PASSWORD, name: 'Priya Sharma' },
  { role: 'admin', email: 'admin@homestays.demo', password: DEMO_PASSWORD, name: 'Jordan Admin' },
];

const CREATED = '2025-01-15T10:00:00.000Z';

export const seedUsers = [
  { id: 'u_guest', name: 'Alex Morgan', email: 'guest@homestays.demo', role: 'guest', status: 'active', phone: '+1 415 555 0134', avatar: 'https://i.pravatar.cc/150?img=12', createdAt: CREATED, passwordHash: DEMO_HASH },
  { id: 'u_guest2', name: 'Sara Lee', email: 'sara@homestays.demo', role: 'guest', status: 'active', phone: '+44 20 7946 0958', avatar: 'https://i.pravatar.cc/150?img=47', createdAt: '2025-02-02T09:00:00.000Z', passwordHash: DEMO_HASH },
  { id: 'u_owner', name: 'Priya Sharma', email: 'owner@homestays.demo', role: 'owner', status: 'active', phone: '+91 98200 12345', avatar: 'https://i.pravatar.cc/150?img=45', createdAt: '2024-11-20T08:00:00.000Z', passwordHash: DEMO_HASH },
  { id: 'u_owner2', name: 'Marco Rossi', email: 'marco@homestays.demo', role: 'owner', status: 'active', phone: '+39 06 1234 5678', avatar: 'https://i.pravatar.cc/150?img=68', createdAt: '2024-12-05T08:00:00.000Z', passwordHash: DEMO_HASH },
  { id: 'u_admin', name: 'Jordan Admin', email: 'admin@homestays.demo', role: 'admin', status: 'active', phone: '+1 212 555 0100', avatar: 'https://i.pravatar.cc/150?img=33', createdAt: '2024-10-01T08:00:00.000Z', passwordHash: DEMO_HASH },
];

const P = (o) => ({ status: 'active', instantBook: true, blockedDates: [], rating: 4.8, reviewCount: 0, createdAt: CREATED, ...o });

export const seedProperties = [
  P({
    id: 'p_goa_villa', ownerId: 'u_owner', title: 'Sunset Palm Villa with Private Pool', type: 'Villa',
    city: 'Goa', country: 'India', address: 'Candolim Beach Road, North Goa',
    description: 'A breezy Portuguese-style villa a short walk from Candolim beach. Lounge by the private pool, enjoy breakfast in the tropical garden and catch spectacular sunsets from the rooftop terrace.',
    pricePerNight: 180, weekendPrice: 220, cleaningFee: 40, maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 4,
    amenities: ['wifi', 'pool', 'kitchen', 'ac', 'parking', 'breakfast', 'garden', 'beach-access', 'bbq'],
    images: [img('1613490493576-7fde63acd811'), img('1600596542815-ffad4c1539a9'), img('1600607687939-ce8a6c25118c'), img('1505693416388-ac5ce068fe85')],
    rating: 4.92, reviewCount: 128,
  }),
  P({
    id: 'p_manali_cabin', ownerId: 'u_owner', title: 'Pinewood Cabin with Himalayan Views', type: 'Cabin',
    city: 'Manali', country: 'India', address: 'Old Manali, Himachal Pradesh',
    description: 'Cosy timber cabin among apple orchards with sweeping views of snow-capped peaks. Warm up by the fireplace after a day of trekking, then stargaze from the deck.',
    pricePerNight: 85, weekendPrice: 105, cleaningFee: 20, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
    amenities: ['wifi', 'heating', 'fireplace', 'kitchen', 'mountain-view', 'parking', 'pets'],
    images: [img('1449158743715-0a90ebb6d2d8'), img('1510798831971-661eb04b3739'), img('1587061949409-02df41d5e562'), img('1595526114035-0d45ed16cfbf')],
    rating: 4.85, reviewCount: 96,
  }),
  P({
    id: 'p_coorg_estate', ownerId: 'u_owner', title: 'Coffee Estate Bungalow', type: 'Bungalow',
    city: 'Coorg', country: 'India', address: 'Madikeri, Karnataka',
    description: 'Colonial bungalow set in a working coffee plantation. Includes guided estate walks, home-cooked Kodava meals and misty morning views over the Western Ghats.',
    pricePerNight: 120, weekendPrice: 140, cleaningFee: 25, maxGuests: 6, bedrooms: 3, beds: 3, bathrooms: 2,
    amenities: ['wifi', 'breakfast', 'garden', 'parking', 'mountain-view', 'workspace'],
    images: [img('1416331108676-a22ccb276e35'), img('1586023492125-27b2c045efd7'), img('1556020685-ae41abfc9365'), img('1617806118233-18e1de247200')],
    rating: 4.78, reviewCount: 64, instantBook: false,
  }),
  P({
    id: 'p_jaipur_haveli', ownerId: 'u_owner', title: 'Restored Heritage Haveli', type: 'Heritage home',
    city: 'Jaipur', country: 'India', address: 'Near Hawa Mahal, Pink City',
    description: 'Stay in a lovingly restored 19th-century haveli with frescoed walls, a central courtyard and rooftop dining overlooking the old city.',
    pricePerNight: 140, cleaningFee: 30, maxGuests: 5, bedrooms: 3, beds: 3, bathrooms: 3,
    amenities: ['wifi', 'ac', 'breakfast', 'tv', 'workspace'],
    images: [img('1600585154340-be6161a56a0c'), img('1600210492486-724fe5c67fb0'), img('1631049307264-da0ec9d70304'), img('1484154218962-a197022b5858')],
    rating: 4.88, reviewCount: 211,
  }),
  P({
    id: 'p_kerala_house', ownerId: 'u_owner', title: 'Backwater Lakeside Homestay', type: 'Cottage',
    city: 'Alleppey', country: 'India', address: 'Kumarakom Road, Kerala',
    description: 'Traditional Kerala cottage on the edge of the backwaters. Paddle a canoe at sunrise, enjoy fresh seafood curries and relax in hammocks under coconut palms.',
    pricePerNight: 95, weekendPrice: 110, cleaningFee: 15, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
    amenities: ['wifi', 'ac', 'breakfast', 'garden', 'parking'],
    images: [img('1518780664697-55e3ad937233'), img('1505691938895-1758d7feb511'), img('1556909114-f6e7ad7d3136'), img('1493809842364-78817add7ffb')],
    rating: 4.81, reviewCount: 77,
  }),
  P({
    id: 'p_mumbai_loft', ownerId: 'u_owner', title: 'Sea-Facing Loft in Bandra', type: 'Apartment',
    city: 'Mumbai', country: 'India', address: 'Bandstand, Bandra West',
    description: 'Bright designer loft with floor-to-ceiling windows facing the Arabian Sea. Walk to cafes, galleries and the promenade.',
    pricePerNight: 110, weekendPrice: 130, cleaningFee: 20, maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
    amenities: ['wifi', 'ac', 'kitchen', 'workspace', 'tv', 'washer'],
    images: [img('1502672260266-1c1ef2d93688'), img('1522708323590-d24dbb6b0267'), img('1560448204-e02f11c3d0e2'), img('1615874959474-d609969a20ed')],
    rating: 4.7, reviewCount: 143,
  }),
  P({
    id: 'p_bali_retreat', ownerId: 'u_owner2', title: 'Ubud Jungle Retreat', type: 'Villa',
    city: 'Ubud', country: 'Indonesia', address: 'Jalan Raya Sayan, Bali',
    description: 'Open-air villa overlooking the Ayung river valley with an infinity pool, yoga deck and daily floating breakfast.',
    pricePerNight: 160, weekendPrice: 190, cleaningFee: 35, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
    amenities: ['wifi', 'pool', 'breakfast', 'ac', 'garden', 'workspace'],
    images: [img('1540541338287-41700207dee6'), img('1520250497591-112f2f40a3f4'), img('1582719508461-905c673771fd'), img('1445019980597-93fa8acb246c')],
    rating: 4.95, reviewCount: 302,
  }),
  P({
    id: 'p_lisbon_apt', ownerId: 'u_owner2', title: 'Alfama Rooftop Apartment', type: 'Apartment',
    city: 'Lisbon', country: 'Portugal', address: 'Rua de São Miguel, Alfama',
    description: 'Charming top-floor apartment with a private rooftop terrace and river views, in the heart of historic Alfama.',
    pricePerNight: 130, weekendPrice: 150, cleaningFee: 30, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
    amenities: ['wifi', 'kitchen', 'washer', 'heating', 'workspace', 'tv'],
    images: [img('1574362848149-11496d93a7c7'), img('1600566753190-17f0baa2a6c3'), img('1586023492125-27b2c045efd7'), img('1505693416388-ac5ce068fe85')],
    rating: 4.83, reviewCount: 189,
  }),
  P({
    id: 'p_tuscany_farm', ownerId: 'u_owner2', title: 'Tuscan Farmhouse among Vineyards', type: 'Farmhouse',
    city: 'Siena', country: 'Italy', address: 'Strada di Montalcino, Tuscany',
    description: 'Stone farmhouse surrounded by olive groves and vineyards. Pool with panoramic views, wine tastings on request and a big kitchen for family feasts.',
    pricePerNight: 260, weekendPrice: 300, cleaningFee: 60, maxGuests: 10, bedrooms: 5, beds: 6, bathrooms: 4,
    amenities: ['wifi', 'pool', 'kitchen', 'parking', 'bbq', 'garden', 'washer', 'fireplace', 'ev-charger'],
    images: [img('1600047509807-ba8f99d2cdde'), img('1598928506311-c55ded91a20c'), img('1556909114-f6e7ad7d3136'), img('1600210492486-724fe5c67fb0')],
    rating: 4.97, reviewCount: 88,
  }),
  P({
    id: 'p_aspen_lodge', ownerId: 'u_owner2', title: 'Ski-in Mountain Lodge', type: 'Cabin',
    city: 'Aspen', country: 'United States', address: 'Snowmass Village, Colorado',
    description: 'Luxury log lodge steps from the slopes with a hot tub, boot room and roaring stone fireplace.',
    pricePerNight: 340, weekendPrice: 420, cleaningFee: 90, maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 3,
    amenities: ['wifi', 'hot-tub', 'fireplace', 'heating', 'kitchen', 'parking', 'mountain-view', 'washer', 'tv'],
    images: [img('1542718610-a1d656d1884c'), img('1510798831971-661eb04b3739'), img('1493809842364-78817add7ffb'), img('1631049307264-da0ec9d70304')],
    rating: 4.9, reviewCount: 57,
  }),
  P({
    id: 'p_malibu_house', ownerId: 'u_owner2', title: 'Modern Beach House', type: 'Villa',
    city: 'Malibu', country: 'United States', address: 'Pacific Coast Highway, California',
    description: 'Architect-designed glass house right on the sand. Wake up to the sound of waves and watch dolphins from the deck.',
    pricePerNight: 480, weekendPrice: 560, cleaningFee: 120, maxGuests: 6, bedrooms: 3, beds: 3, bathrooms: 3,
    amenities: ['wifi', 'beach-access', 'kitchen', 'ac', 'parking', 'hot-tub', 'bbq', 'tv', 'ev-charger'],
    images: [img('1580587771525-78b9dba3b914'), img('1512917774080-9991f1c4c750'), img('1600607687939-ce8a6c25118c'), img('1617806118233-18e1de247200')],
    rating: 4.86, reviewCount: 42, instantBook: false,
  }),
  P({
    id: 'p_cotswolds_cottage', ownerId: 'u_owner2', title: 'Thatched Cotswolds Cottage', type: 'Cottage',
    city: 'Bibury', country: 'United Kingdom', address: 'Arlington Row, Gloucestershire',
    description: 'Storybook cottage with exposed beams, a wood burner and a rose garden beside the river Coln. Dogs welcome.',
    pricePerNight: 150, weekendPrice: 175, cleaningFee: 35, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
    amenities: ['wifi', 'fireplace', 'heating', 'kitchen', 'garden', 'pets', 'parking'],
    images: [img('1499793983690-e29da59ef1c2'), img('1568605114967-8130f3a36994'), img('1484154218962-a197022b5858'), img('1595526114035-0d45ed16cfbf')],
    rating: 4.89, reviewCount: 135,
  }),
  P({
    id: 'p_kyoto_machiya', ownerId: 'u_owner', title: 'Traditional Kyoto Machiya', type: 'Heritage home',
    city: 'Kyoto', country: 'Japan', address: 'Higashiyama Ward',
    description: 'Restored wooden townhouse with tatami rooms, a cypress soaking tub and a tiny zen garden, minutes from Gion.',
    pricePerNight: 200, cleaningFee: 45, maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
    amenities: ['wifi', 'heating', 'ac', 'kitchen', 'garden', 'washer'],
    images: [img('1570129477492-45c003edd2be'), img('1556020685-ae41abfc9365'), img('1505691938895-1758d7feb511'), img('1600566753190-17f0baa2a6c3')],
    rating: 4.94, reviewCount: 166,
  }),
  P({
    id: 'p_cape_town', ownerId: 'u_owner2', title: 'Camps Bay Ocean View Suite', type: 'Apartment',
    city: 'Cape Town', country: 'South Africa', address: 'Victoria Road, Camps Bay',
    description: 'Stylish suite beneath Table Mountain with a pool terrace and sweeping Atlantic views.',
    pricePerNight: 115, weekendPrice: 135, cleaningFee: 25, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
    amenities: ['wifi', 'pool', 'ac', 'tv', 'workspace', 'parking', 'beach-access'],
    images: [img('1566073771259-6a8506099945'), img('1571896349842-33c89424de2d'), img('1551882547-ff40c63fe5fa'), img('1502672260266-1c1ef2d93688')],
    rating: 4.76, reviewCount: 71,
  }),
  P({
    id: 'p_rishikesh_tree', ownerId: 'u_owner', title: 'Riverside Treehouse Retreat', type: 'Treehouse',
    city: 'Rishikesh', country: 'India', address: 'Tapovan, Uttarakhand',
    description: 'Eco treehouse above the Ganges with yoga sessions, organic meals and rafting trips arranged on request.',
    pricePerNight: 70, weekendPrice: 85, cleaningFee: 10, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
    amenities: ['wifi', 'breakfast', 'garden', 'mountain-view'],
    images: [img('1587061949409-02df41d5e562'), img('1449158743715-0a90ebb6d2d8'), img('1505693416388-ac5ce068fe85'), img('1586023492125-27b2c045efd7')],
    rating: 4.69, reviewCount: 39,
  }),
  P({
    id: 'p_santorini', ownerId: 'u_owner2', title: 'Oia Cave House with Caldera View', type: 'Villa',
    city: 'Santorini', country: 'Greece', address: 'Oia, Cyclades',
    description: 'Whitewashed cave house carved into the cliffs with a plunge pool and the most famous sunset in the Aegean.',
    pricePerNight: 290, weekendPrice: 330, cleaningFee: 50, maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
    amenities: ['wifi', 'pool', 'ac', 'breakfast', 'hot-tub'],
    images: [img('1523217582562-09d0def993a6'), img('1613490493576-7fde63acd811'), img('1501183638710-841dd1904471'), img('1445019980597-93fa8acb246c')],
    rating: 4.93, reviewCount: 214,
  }),
];

/** Seed bookings with dates relative to `today` so the demo always looks current. */
export function buildSeedBookings(today = todayISO()) {
  const byId = Object.fromEntries(seedProperties.map((p) => [p.id, p]));
  const mk = (id, propertyId, guestId, startOffset, nights, guests, status, extra = {}) => {
    const property = byId[propertyId];
    const checkIn = addDays(today, startOffset);
    const checkOut = addDays(checkIn, nights);
    return {
      id, propertyId, guestId, ownerId: property.ownerId, checkIn, checkOut, guests, status,
      price: calculatePrice(property, checkIn, checkOut),
      payment: { method: 'card', last4: '4242', simulated: true, status: status === 'cancelled' ? 'refunded' : 'paid' },
      createdAt: `${addDays(today, Math.min(startOffset, 0) - 14)}T09:30:00.000Z`,
      updatedAt: `${addDays(today, Math.min(startOffset, 0) - 14)}T09:30:00.000Z`,
      ...extra,
    };
  };
  return [
    mk('b_1001', 'p_goa_villa', 'u_guest', 12, 4, 4, 'confirmed', { specialRequests: 'Late check-in around 9pm please.' }),
    mk('b_1002', 'p_manali_cabin', 'u_guest', 30, 3, 2, 'confirmed'),
    mk('b_1003', 'p_coorg_estate', 'u_guest', 45, 2, 3, 'pending'),
    mk('b_1004', 'p_jaipur_haveli', 'u_guest', -40, 3, 2, 'completed'),
    mk('b_1005', 'p_lisbon_apt', 'u_guest', -20, 5, 2, 'cancelled', { cancelledAt: `${addDays(today, -30)}T12:00:00.000Z`, refundAmount: 0 }),
    mk('b_1006', 'p_goa_villa', 'u_guest2', 20, 5, 6, 'confirmed'),
    mk('b_1007', 'p_bali_retreat', 'u_guest2', 8, 6, 2, 'confirmed'),
    mk('b_1008', 'p_malibu_house', 'u_guest2', 25, 3, 4, 'pending'),
    mk('b_1009', 'p_kerala_house', 'u_guest2', -60, 4, 2, 'completed'),
    mk('b_1010', 'p_tuscany_farm', 'u_guest', 60, 7, 8, 'confirmed'),
    mk('b_1011', 'p_mumbai_loft', 'u_guest2', 5, 2, 2, 'confirmed'),
    mk('b_1012', 'p_kyoto_machiya', 'u_guest2', -10, 3, 2, 'completed'),
  ];
}

export function buildSeed(today = todayISO()) {
  // Owner-blocked maintenance window to demonstrate blocked dates.
  const properties = seedProperties.map((p) =>
    p.id === 'p_manali_cabin' ? { ...p, blockedDates: [{ start: addDays(today, 50), end: addDays(today, 55), note: 'Roof maintenance' }] } : p,
  );
  return { users: seedUsers, properties, bookings: buildSeedBookings(today) };
}
