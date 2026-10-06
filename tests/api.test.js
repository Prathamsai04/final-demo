import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { addDays, todayISO } from '../shared/domain/dates.js';
import { emptyOverlay, mergePatch } from '../shared/overlay.js';

const app = createApp();
const encode = (overlay) => Buffer.from(JSON.stringify(overlay)).toString('base64');

/** Simulates the browser: keeps the demo overlay between requests like localStorage does. */
class DemoClient {
  constructor() {
    this.overlay = emptyOverlay();
    this.token = null;
  }
  async call(method, path, body) {
    let req = request(app)[method](`/api${path}`).set('X-Demo-State', encode(this.overlay));
    if (this.token) req = req.set('Authorization', `Bearer ${this.token}`);
    const res = await (body ? req.send(body) : req);
    if (res.body?.demoPatch) this.overlay = mergePatch(this.overlay, res.body.demoPatch);
    return res;
  }
  async login(email) {
    const res = await this.call('post', '/auth/login', { email, password: 'demo1234' });
    this.token = res.body.data.token;
    return res;
  }
}

const payment = { cardName: 'Alex Morgan', cardNumber: '4242 4242 4242 4242', expiry: '12/39', cvc: '123' };
const today = todayISO();

describe('public API', () => {
  it('reports demo mode', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('demo');
  });

  it('searches with filters and availability', async () => {
    const all = await request(app).get('/api/properties?pageSize=50');
    expect(all.body.data.total).toBeGreaterThanOrEqual(12);
    const filtered = await request(app).get('/api/properties?destination=india&guests=6&amenities=wifi,breakfast&sort=price_asc');
    const items = filtered.body.data.items;
    expect(items.length).toBeGreaterThan(0);
    items.forEach((p) => {
      expect(p.country).toBe('India');
      expect(p.maxGuests).toBeGreaterThanOrEqual(6);
      expect(p.amenities).toEqual(expect.arrayContaining(['wifi', 'breakfast']));
    });
    // Seed booking b_1001 occupies Goa villa from today+12 for 4 nights.
    const dates = `checkIn=${addDays(today, 13)}&checkOut=${addDays(today, 14)}`;
    const avail = await request(app).get(`/api/properties?destination=goa&${dates}`);
    expect(avail.body.data.items.find((p) => p.id === 'p_goa_villa')).toBeUndefined();
  });

  it('returns property detail, availability and quotes', async () => {
    const detail = await request(app).get('/api/properties/p_goa_villa');
    expect(detail.body.data.owner.name).toBe('Priya Sharma');
    expect(detail.body.data.owner.passwordHash).toBeUndefined();
    const av = await request(app).get('/api/properties/p_goa_villa/availability');
    expect(av.body.data.unavailableNights).toContain(addDays(today, 12));
    const quote = await request(app).post('/api/properties/p_goa_villa/quote').send({ checkIn: addDays(today, 40), checkOut: addDays(today, 43), guests: 2 });
    expect(quote.body.data.available).toBe(true);
    expect(quote.body.data.price.nights).toBe(3);
  });

  it('validates input and returns JSON errors', async () => {
    const bad = await request(app).post('/api/properties/p_goa_villa/quote').send({ checkIn: 'nope', checkOut: addDays(today, 3) });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('BAD_REQUEST');
    const missing = await request(app).get('/api/properties/does-not-exist');
    expect(missing.status).toBe(404);
    const unknown = await request(app).get('/api/nope');
    expect(unknown.status).toBe(404);
  });

  it('requires auth and enforces roles', async () => {
    expect((await request(app).get('/api/bookings/me')).status).toBe(401);
    const c = new DemoClient();
    await c.login('guest@homestays.demo');
    expect((await c.call('get', '/owner/properties')).status).toBe(403);
    expect((await c.call('get', '/admin/stats')).status).toBe(403);
    const bad = await request(app).post('/api/auth/login').send({ email: 'guest@homestays.demo', password: 'wrong' });
    expect(bad.status).toBe(401);
  });
});

describe('booking workflow (stateless demo mode)', () => {
  let guest;
  beforeEach(async () => {
    guest = new DemoClient();
    await guest.login('guest@homestays.demo');
  });

  it('books, persists via overlay, prevents overlaps, and cancels', async () => {
    const checkIn = addDays(today, 70);
    const checkOut = addDays(today, 73);
    const created = await guest.call('post', '/bookings', { propertyId: 'p_bali_retreat', checkIn, checkOut, guests: 2, payment });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('confirmed');
    expect(created.body.data.payment.last4).toBe('4242');
    expect(created.body.demoPatch.bookings[created.body.data.id]).toBeTruthy();
    const id = created.body.data.id;

    // The server keeps no state: without the overlay the booking does not exist.
    const fresh = new DemoClient();
    await fresh.login('guest@homestays.demo');
    expect((await fresh.call('get', `/bookings/${id}`)).status).toBe(404);

    // With the overlay it is listed, and overlapping bookings are rejected.
    const mine = await guest.call('get', '/bookings/me');
    expect(mine.body.data.some((b) => b.id === id)).toBe(true);
    const other = new DemoClient();
    other.overlay = guest.overlay;
    await other.login('sara@homestays.demo');
    const overlap = await other.call('post', '/bookings', { propertyId: 'p_bali_retreat', checkIn: addDays(checkIn, 1), checkOut: addDays(checkOut, 1), guests: 1, payment });
    expect(overlap.status).toBe(409);

    const cancelled = await guest.call('post', `/bookings/${id}/cancel`);
    expect(cancelled.body.data.status).toBe('cancelled');
    expect(cancelled.body.data.refundAmount).toBe(created.body.data.price.total);
    // Once cancelled, the dates are free again for anyone holding the updated overlay.
    other.overlay = guest.overlay;
    const again = await other.call('post', '/bookings', { propertyId: 'p_bali_retreat', checkIn, checkOut, guests: 1, payment: { ...payment, cardName: 'Sara' } });
    expect(again.status).toBe(201);
  });

  it('rejects invalid bookings', async () => {
    const past = await guest.call('post', '/bookings', { propertyId: 'p_goa_villa', checkIn: addDays(today, -5), checkOut: addDays(today, -2), guests: 2, payment });
    expect(past.status).toBe(400);
    const tooMany = await guest.call('post', '/bookings', { propertyId: 'p_cape_town', checkIn: addDays(today, 90), checkOut: addDays(today, 92), guests: 5, payment });
    expect(tooMany.body.error.message).toMatch(/up to 2 guests/);
    const declined = await guest.call('post', '/bookings', { propertyId: 'p_cape_town', checkIn: addDays(today, 90), checkOut: addDays(today, 92), guests: 1, payment: { ...payment, cardNumber: '4000000000000002' } });
    expect(declined.status).toBe(402);
    const badCard = await guest.call('post', '/bookings', { propertyId: 'p_cape_town', checkIn: addDays(today, 90), checkOut: addDays(today, 92), guests: 1, payment: { ...payment, cardNumber: '123' } });
    expect(badCard.status).toBe(400);
    const seedOverlap = await guest.call('post', '/bookings', { propertyId: 'p_goa_villa', checkIn: addDays(today, 13), checkOut: addDays(today, 15), guests: 2, payment });
    expect(seedOverlap.status).toBe(409);
  });

  it('accepts a large overlay via method-override body', async () => {
    const res = await request(app)
      .post('/api/bookings/me')
      .set('X-HTTP-Method-Override', 'GET')
      .set('Authorization', `Bearer ${guest.token}`)
      .send({ __demoState: guest.overlay });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('owner and admin workflows', () => {
  it('lets owners create, edit, block dates and manage reservations', async () => {
    const owner = new DemoClient();
    await owner.login('owner@homestays.demo');
    const created = await owner.call('post', '/owner/properties', {
      title: 'Test Lake House',
      type: 'Cottage',
      description: 'A peaceful lake house for testing purposes only.',
      city: 'Udaipur',
      country: 'India',
      address: 'Lake Pichola',
      pricePerNight: 90,
      cleaningFee: 10,
      maxGuests: 3,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1,
      amenities: ['wifi'],
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6'],
      instantBook: false,
    });
    expect(created.status).toBe(201);
    const pid = created.body.data.id;
    const updated = await owner.call('put', `/owner/properties/${pid}`, { pricePerNight: 120 });
    expect(updated.body.data.pricePerNight).toBe(120);
    const blocked = await owner.call('put', `/owner/properties/${pid}/availability`, { blockedDates: [{ start: addDays(today, 10), end: addDays(today, 12) }] });
    expect(blocked.body.data.blockedDates).toHaveLength(1);
    const search = await owner.call('get', '/properties?destination=udaipur');
    expect(search.body.data.items[0].id).toBe(pid);

    // Guest requests the non-instant listing -> pending; owner approves.
    const guest = new DemoClient();
    guest.overlay = owner.overlay;
    await guest.login('guest@homestays.demo');
    const blockedTry = await guest.call('post', '/bookings', { propertyId: pid, checkIn: addDays(today, 11), checkOut: addDays(today, 13), guests: 1, payment });
    expect(blockedTry.status).toBe(409);
    const req = await guest.call('post', '/bookings', { propertyId: pid, checkIn: addDays(today, 20), checkOut: addDays(today, 22), guests: 2, payment });
    expect(req.body.data.status).toBe('pending');
    owner.overlay = guest.overlay;
    const res = await owner.call('get', '/owner/reservations?status=pending');
    expect(res.body.data.some((b) => b.id === req.body.data.id)).toBe(true);
    const approved = await owner.call('patch', `/owner/reservations/${req.body.data.id}/status`, { status: 'confirmed' });
    expect(approved.body.data.status).toBe('confirmed');
    const invalid = await owner.call('patch', `/owner/reservations/${req.body.data.id}/status`, { status: 'pending' });
    expect(invalid.status).toBe(400);
    const del = await owner.call('delete', `/owner/properties/${pid}`);
    expect(del.status).toBe(400); // has upcoming booking
    const stats = await owner.call('get', '/owner/stats');
    expect(stats.body.data.totals.properties).toBeGreaterThan(0);
  });

  it('prevents owners from editing other hosts’ listings', async () => {
    const owner = new DemoClient();
    await owner.login('owner@homestays.demo');
    const res = await owner.call('put', '/owner/properties/p_bali_retreat', { pricePerNight: 200 });
    expect(res.status).toBe(403);
  });

  it('lets admins view stats and manage users, properties and bookings', async () => {
    const admin = new DemoClient();
    await admin.login('admin@homestays.demo');
    const stats = await admin.call('get', '/admin/stats');
    expect(stats.body.data.totals.users).toBe(5);
    expect(stats.body.data.revenueByMonth).toHaveLength(9);
    const users = await admin.call('get', '/admin/users');
    expect(users.body.data[0].passwordHash).toBeUndefined();
    const suspended = await admin.call('patch', '/admin/users/u_guest2', { status: 'suspended' });
    expect(suspended.body.data.status).toBe('suspended');
    const self = await admin.call('patch', '/admin/users/u_admin', { status: 'suspended' });
    expect(self.status).toBe(400);

    // Suspended users cannot sign in.
    const sara = new DemoClient();
    sara.overlay = admin.overlay;
    const login = await sara.call('post', '/auth/login', { email: 'sara@homestays.demo', password: 'demo1234' });
    expect(login.status).toBe(403);

    const prop = await admin.call('patch', '/admin/properties/p_santorini', { status: 'suspended' });
    expect(prop.body.data.status).toBe('suspended');
    const hidden = await admin.call('get', '/properties?destination=santorini');
    expect(hidden.body.data.total).toBe(0);
    const booking = await admin.call('patch', '/admin/bookings/b_1003', { status: 'confirmed' });
    expect(booking.body.data.status).toBe('confirmed');
  });

  it('registers new accounts into the overlay', async () => {
    const c = new DemoClient();
    const res = await c.call('post', '/auth/register', { name: 'New Host', email: 'new@example.com', password: 'secret1', role: 'owner' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('owner');
    const dup = await c.call('post', '/auth/register', { name: 'Dup', email: 'NEW@example.com', password: 'secret1' });
    expect(dup.status).toBe(409);
    c.token = res.body.data.token;
    expect((await c.call('get', '/auth/me')).body.data.user.email).toBe('new@example.com');
  });
});
