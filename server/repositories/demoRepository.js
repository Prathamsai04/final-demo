import { applyOverlay, emptyOverlay } from '../../shared/overlay.js';
import { buildSeed } from '../../shared/seed/index.js';

const clone = (v) => (v == null ? v : structuredClone(v));

/**
 * Stateless demo repository. Every request builds its view from seed data plus the
 * client-provided overlay (persisted in browser localStorage). Mutations are recorded
 * in `patch`, which is returned to the client so it can persist them. Nothing is kept
 * in server memory between requests, which makes it safe for serverless functions.
 */
export class DemoRepository {
  constructor(overlay) {
    const state = applyOverlay(buildSeed(), overlay);
    this.mode = 'demo';
    this.data = {
      users: new Map(state.users.map((u) => [u.id, u])),
      properties: new Map(state.properties.map((p) => [p.id, p])),
      bookings: new Map(state.bookings.map((b) => [b.id, b])),
    };
    this.patch = emptyOverlay();
  }

  #list(c) {
    return [...this.data[c].values()].map(clone);
  }

  #get(c, id) {
    return clone(this.data[c].get(id)) || null;
  }

  #put(c, entity) {
    this.data[c].set(entity.id, entity);
    this.patch[c][entity.id] = clone(entity);
    return clone(entity);
  }

  #update(c, id, changes) {
    const existing = this.data[c].get(id);
    if (!existing) return null;
    return this.#put(c, { ...existing, ...changes, id, updatedAt: new Date().toISOString() });
  }

  #delete(c, id) {
    const existed = this.data[c].delete(id);
    if (existed) this.patch[c][id] = null;
    return existed;
  }

  getPatch() {
    return this.patch;
  }

  // Users
  async listUsers() { return this.#list('users'); }
  async getUserById(id) { return this.#get('users', id); }
  async getUserByEmail(email) {
    const e = String(email).toLowerCase();
    return clone([...this.data.users.values()].find((u) => u.email.toLowerCase() === e)) || null;
  }
  async createUser(user) { return this.#put('users', user); }
  async updateUser(id, changes) { return this.#update('users', id, changes); }
  async deleteUser(id) { return this.#delete('users', id); }

  // Properties
  async listProperties() { return this.#list('properties'); }
  async getProperty(id) { return this.#get('properties', id); }
  async createProperty(property) { return this.#put('properties', property); }
  async updateProperty(id, changes) { return this.#update('properties', id, changes); }
  async deleteProperty(id) { return this.#delete('properties', id); }

  // Bookings
  async listBookings() { return this.#list('bookings'); }
  async getBooking(id) { return this.#get('bookings', id); }
  async createBooking(booking) { return this.#put('bookings', booking); }
  async updateBooking(id, changes) { return this.#update('bookings', id, changes); }
}
