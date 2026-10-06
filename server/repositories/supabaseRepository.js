import { createClient } from '@supabase/supabase-js';
import { ApiError, conflict } from '../errors.js';

const toSnake = (k) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const mapKeys = (obj, fn) => (obj ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v])) : obj);
const toRow = (entity) => mapKeys(entity, toSnake);
const fromRow = (row) => mapKeys(row, toCamel);

/**
 * Supabase PostgreSQL repository. Implements the same interface as DemoRepository.
 * Tables are defined in supabase/schema.sql; column names are snake_case versions
 * of entity fields. Uses the service-role key, so it must only run server-side.
 */
export class SupabaseRepository {
  constructor({ url, serviceRoleKey }) {
    this.mode = 'supabase';
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  getPatch() {
    return null;
  }

  async #run(promise) {
    const { data, error } = await promise;
    if (error) {
      // 23P01 = exclusion_violation (overlapping confirmed booking)
      if (error.code === '23P01') throw conflict('These dates are no longer available.');
      if (error.code === '23505') throw conflict('A record with these details already exists.');
      throw new ApiError(500, 'DATABASE_ERROR', error.message);
    }
    return data;
  }

  async #list(table) {
    return (await this.#run(this.db.from(table).select('*'))).map(fromRow);
  }

  async #get(table, column, value) {
    const row = await this.#run(this.db.from(table).select('*').eq(column, value).maybeSingle());
    return row ? fromRow(row) : null;
  }

  async #insert(table, entity) {
    return fromRow(await this.#run(this.db.from(table).insert(toRow(entity)).select().single()));
  }

  async #update(table, id, changes) {
    const row = await this.#run(
      this.db.from(table).update(toRow({ ...changes, updatedAt: new Date().toISOString() })).eq('id', id).select().maybeSingle(),
    );
    return row ? fromRow(row) : null;
  }

  async #delete(table, id) {
    const rows = await this.#run(this.db.from(table).delete().eq('id', id).select('id'));
    return rows.length > 0;
  }

  listUsers() { return this.#list('users'); }
  getUserById(id) { return this.#get('users', 'id', id); }
  getUserByEmail(email) { return this.#get('users', 'email', String(email).toLowerCase()); }
  createUser(user) { return this.#insert('users', { ...user, email: user.email.toLowerCase() }); }
  updateUser(id, changes) { return this.#update('users', id, changes); }
  deleteUser(id) { return this.#delete('users', id); }

  listProperties() { return this.#list('properties'); }
  getProperty(id) { return this.#get('properties', 'id', id); }
  createProperty(p) { return this.#insert('properties', p); }
  updateProperty(id, changes) { return this.#update('properties', id, changes); }
  deleteProperty(id) { return this.#delete('properties', id); }

  listBookings() { return this.#list('bookings'); }
  getBooking(id) { return this.#get('bookings', 'id', id); }
  createBooking(b) { return this.#insert('bookings', b); }
  updateBooking(id, changes) { return this.#update('bookings', id, changes); }
}
