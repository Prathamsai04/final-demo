import { createSlice } from '@reduxjs/toolkit';
import { authActions } from '../auth/authSlice.js';

const res = (data = null) => ({ data, status: 'idle', error: null });
const initialState = { stats: res(), users: res([]), properties: res([]), bookings: res([]), busyIds: [] };

const start = (key) => (s) => { s[key].status = 'loading'; s[key].error = null; };
const ok = (key) => (s, { payload }) => { s[key] = { data: payload, status: 'succeeded', error: null }; };
const fail = (key) => (s, { payload }) => { s[key].status = 'failed'; s[key].error = payload; };
const busy = (s, id) => { if (!s.busyIds.includes(id)) s.busyIds.push(id); };
const unbusy = (s, id) => { s.busyIds = s.busyIds.filter((x) => x !== id); };
const replace = (key) => (s, { payload }) => {
  unbusy(s, payload.id);
  s[key].data = s[key].data.map((x) => (x.id === payload.id ? { ...x, ...payload } : x));
};
const remove = (key) => (s, { payload }) => {
  unbusy(s, payload);
  s[key].data = s[key].data.filter((x) => x.id !== payload);
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    statsRequest: start('stats'),
    statsSuccess: ok('stats'),
    statsFailure: fail('stats'),
    usersRequest: start('users'),
    usersSuccess: ok('users'),
    usersFailure: fail('users'),
    propertiesRequest: start('properties'),
    propertiesSuccess: ok('properties'),
    propertiesFailure: fail('properties'),
    bookingsRequest: start('bookings'),
    bookingsSuccess: ok('bookings'),
    bookingsFailure: fail('bookings'),

    userUpdateRequest: (s, { payload }) => busy(s, payload.id),
    userDeleteRequest: (s, { payload }) => busy(s, payload),
    userUpdated: replace('users'),
    userDeleted: remove('users'),

    propertyUpdateRequest: (s, { payload }) => busy(s, payload.id),
    propertyDeleteRequest: (s, { payload }) => busy(s, payload),
    propertyUpdated: replace('properties'),
    propertyDeleted: remove('properties'),

    bookingUpdateRequest: (s, { payload }) => busy(s, payload.id),
    bookingUpdated: replace('bookings'),

    actionFailed: (s, { payload }) => unbusy(s, payload),
  },
  extraReducers: (b) => b.addCase(authActions.logout, () => initialState),
});

export const adminActions = adminSlice.actions;
export default adminSlice.reducer;
