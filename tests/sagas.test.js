import { runSaga } from 'redux-saga';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/api/index.js', () => ({
  api: {
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
    quote: vi.fn(),
    searchProperties: vi.fn(),
    login: vi.fn(),
    createProperty: vi.fn(),
    updateProperty: vi.fn(),
  },
}));

const { api } = await import('../src/api/index.js');
const { checkout, fetchQuote } = await import('../src/features/booking/bookingSaga.js');
const { bookingActions } = await import('../src/features/booking/bookingSlice.js');
const { cancelBooking, myBookingsActions } = await import('../src/features/myBookings/myBookingsSlice.js');
const { searchProperties } = await import('../src/features/properties/propertiesSaga.js');
const { propertiesActions } = await import('../src/features/properties/propertiesSlice.js');
const { saveProperty } = await import('../src/features/owner/ownerSaga.js');
const { ownerActions } = await import('../src/features/owner/ownerSlice.js');
const { login } = await import('../src/features/auth/authSaga.js');
const { authActions } = await import('../src/features/auth/authSlice.js');
const { addDays, todayISO } = await import('../shared/domain/dates.js');

async function record(saga, action) {
  const dispatched = [];
  await runSaga({ dispatch: (a) => dispatched.push(a), getState: () => ({}) }, saga, action).toPromise();
  return dispatched;
}
const types = (actions) => actions.map((a) => a.type);

beforeEach(() => vi.clearAllMocks());

describe('booking sagas', () => {
  it('checkout success stores the booking, refreshes data and notifies', async () => {
    api.createBooking.mockResolvedValue({ id: 'b_new', status: 'confirmed' });
    const out = await record(checkout, bookingActions.checkoutRequest({ propertyId: 'p1' }));
    expect(types(out)).toEqual([
      'booking/checkoutSuccess',
      'properties/availabilityRequest',
      'myBookings/fetchRequest',
      'ui/notify',
    ]);
    expect(out[0].payload.id).toBe('b_new');
  });

  it('checkout conflict reports the error and refreshes availability', async () => {
    api.createBooking.mockRejectedValue(Object.assign(new Error('Dates taken'), { status: 409 }));
    const out = await record(checkout, bookingActions.checkoutRequest({ propertyId: 'p1' }));
    expect(types(out)).toEqual(['booking/checkoutFailure', 'ui/notify', 'properties/availabilityRequest']);
    expect(out[0].payload).toBe('Dates taken');
  });

  it('quote validates dates locally before calling the API', async () => {
    const out = await record(fetchQuote, bookingActions.quoteRequest({ propertyId: 'p1', checkIn: '2000-01-01', checkOut: '2000-01-03', guests: 1 }));
    expect(types(out)).toEqual(['booking/quoteFailure']);
    expect(api.quote).not.toHaveBeenCalled();
  });

  it('quote calls the API for valid dates', async () => {
    api.quote.mockResolvedValue({ available: true, price: { total: 100 } });
    const checkIn = addDays(todayISO(), 5);
    const out = await record(fetchQuote, bookingActions.quoteRequest({ propertyId: 'p1', checkIn, checkOut: addDays(checkIn, 2), guests: 1 }));
    expect(types(out)).toEqual(['booking/quoteSuccess']);
  });
});

describe('other sagas', () => {
  it('cancel booking success and failure', async () => {
    api.cancelBooking.mockResolvedValue({ id: 'b1', status: 'cancelled', refundAmount: 50 });
    let out = await record(cancelBooking, myBookingsActions.cancelRequest('b1'));
    expect(types(out)).toEqual(['myBookings/cancelSuccess', 'ui/notify']);
    expect(out[1].payload.message).toMatch(/\$50\.00/);
    api.cancelBooking.mockRejectedValue(new Error('Too late'));
    out = await record(cancelBooking, myBookingsActions.cancelRequest('b1'));
    expect(types(out)).toEqual(['myBookings/cancelFailure', 'ui/notify']);
  });

  it('search puts results or failure', async () => {
    api.searchProperties.mockResolvedValue({ items: [], total: 0 });
    expect(types(await record(searchProperties, propertiesActions.searchRequest({})))).toEqual(['properties/searchSuccess']);
    api.searchProperties.mockRejectedValue(new Error('down'));
    expect(types(await record(searchProperties, propertiesActions.searchRequest({})))).toEqual(['properties/searchFailure']);
  });

  it('saveProperty creates or updates depending on id', async () => {
    api.createProperty.mockResolvedValue({ id: 'p_new' });
    await record(saveProperty, ownerActions.saveRequest({ data: { title: 'x' } }));
    expect(api.createProperty).toHaveBeenCalled();
    api.updateProperty.mockResolvedValue({ id: 'p1' });
    const out = await record(saveProperty, ownerActions.saveRequest({ id: 'p1', data: { title: 'y' } }));
    expect(api.updateProperty).toHaveBeenCalledWith('p1', { title: 'y' });
    expect(types(out)).toEqual(['owner/saveSuccess', 'ui/notify']);
  });

  it('login success and failure', async () => {
    api.login.mockResolvedValue({ token: 't', user: { id: 'u', name: 'Alex Morgan' } });
    expect(types(await record(login, authActions.loginRequest({})))).toEqual(['auth/authSuccess', 'ui/notify']);
    api.login.mockRejectedValue(new Error('Invalid email or password.'));
    const out = await record(login, authActions.loginRequest({}));
    expect(out).toEqual([authActions.authFailure('Invalid email or password.')]);
  });
});
