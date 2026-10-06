import { http } from './client.js';

/** Typed-ish endpoint map. Sagas call these; components never call fetch directly. */
export const api = {
  meta: () => http.get('/meta'),
  health: () => http.get('/health'),

  login: (credentials) => http.post('/auth/login', credentials),
  register: (data) => http.post('/auth/register', data),
  me: () => http.get('/auth/me'),

  searchProperties: (filters) => http.get('/properties', filters),
  getProperty: (id) => http.get(`/properties/${encodeURIComponent(id)}`),
  getAvailability: (id) => http.get(`/properties/${encodeURIComponent(id)}/availability`),
  quote: (id, data) => http.post(`/properties/${encodeURIComponent(id)}/quote`, data),

  createBooking: (data) => http.post('/bookings', data),
  myBookings: () => http.get('/bookings/me'),
  getBooking: (id) => http.get(`/bookings/${encodeURIComponent(id)}`),
  cancelBooking: (id) => http.post(`/bookings/${encodeURIComponent(id)}/cancel`),

  ownerStats: () => http.get('/owner/stats'),
  ownerProperties: () => http.get('/owner/properties'),
  ownerProperty: (id) => http.get(`/owner/properties/${encodeURIComponent(id)}`),
  createProperty: (data) => http.post('/owner/properties', data),
  updateProperty: (id, data) => http.put(`/owner/properties/${encodeURIComponent(id)}`, data),
  deleteProperty: (id) => http.del(`/owner/properties/${encodeURIComponent(id)}`),
  updateAvailability: (id, blockedDates) => http.put(`/owner/properties/${encodeURIComponent(id)}/availability`, { blockedDates }),
  ownerReservations: (query) => http.get('/owner/reservations', query),
  updateReservationStatus: (id, status) => http.patch(`/owner/reservations/${encodeURIComponent(id)}/status`, { status }),

  adminStats: () => http.get('/admin/stats'),
  adminUsers: () => http.get('/admin/users'),
  adminUpdateUser: (id, data) => http.patch(`/admin/users/${encodeURIComponent(id)}`, data),
  adminDeleteUser: (id) => http.del(`/admin/users/${encodeURIComponent(id)}`),
  adminProperties: () => http.get('/admin/properties'),
  adminUpdateProperty: (id, data) => http.patch(`/admin/properties/${encodeURIComponent(id)}`, data),
  adminDeleteProperty: (id) => http.del(`/admin/properties/${encodeURIComponent(id)}`),
  adminBookings: (query) => http.get('/admin/bookings', query),
  adminUpdateBooking: (id, status) => http.patch(`/admin/bookings/${encodeURIComponent(id)}`, { status }),
};
