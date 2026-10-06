import { createSlice } from '@reduxjs/toolkit';
import { authActions } from '../auth/authSlice.js';

const res = (data = null) => ({ data, status: 'idle', error: null });

const initialState = {
  stats: res(),
  properties: res([]),
  editing: res(),
  save: { status: 'idle', error: null, savedId: null },
  reservations: res([]),
  busyIds: [],
};

const start = (key) => (s) => { s[key].status = 'loading'; s[key].error = null; };
const ok = (key) => (s, { payload }) => { s[key] = { data: payload, status: 'succeeded', error: null }; };
const fail = (key) => (s, { payload }) => { s[key].status = 'failed'; s[key].error = payload; };
const busy = (s, id) => { if (!s.busyIds.includes(id)) s.busyIds.push(id); };
const unbusy = (s, id) => { s.busyIds = s.busyIds.filter((x) => x !== id); };

const ownerSlice = createSlice({
  name: 'owner',
  initialState,
  reducers: {
    statsRequest: start('stats'),
    statsSuccess: ok('stats'),
    statsFailure: fail('stats'),

    propertiesRequest: start('properties'),
    propertiesSuccess: ok('properties'),
    propertiesFailure: fail('properties'),

    editRequest: (s) => { s.editing = { data: null, status: 'loading', error: null }; },
    editSuccess: ok('editing'),
    editFailure: fail('editing'),
    editReset: (s) => { s.editing = res(); s.save = { status: 'idle', error: null, savedId: null }; },

    saveRequest: (s) => { s.save = { status: 'loading', error: null, savedId: null }; },
    saveSuccess: (s, { payload }) => {
      s.save = { status: 'succeeded', error: null, savedId: payload.id };
      s.editing.data = payload;
    },
    saveFailure: (s, { payload }) => { s.save = { status: 'failed', error: payload, savedId: null }; },

    propertyStatusRequest: (s, { payload }) => busy(s, payload.id),
    availabilitySaveRequest: (s, { payload }) => busy(s, payload.id),
    deleteRequest: (s, { payload }) => busy(s, payload),
    propertyUpdated: (s, { payload }) => {
      unbusy(s, payload.id);
      s.properties.data = s.properties.data.map((p) => (p.id === payload.id ? { ...p, ...payload } : p));
      if (s.editing.data?.id === payload.id) s.editing.data = { ...s.editing.data, ...payload };
    },
    propertyDeleted: (s, { payload }) => {
      unbusy(s, payload);
      s.properties.data = s.properties.data.filter((p) => p.id !== payload);
    },
    actionFailed: (s, { payload }) => unbusy(s, payload),

    reservationsRequest: start('reservations'),
    reservationsSuccess: ok('reservations'),
    reservationsFailure: fail('reservations'),
    reservationStatusRequest: (s, { payload }) => busy(s, payload.id),
    reservationUpdated: (s, { payload }) => {
      unbusy(s, payload.id);
      s.reservations.data = s.reservations.data.map((b) => (b.id === payload.id ? payload : b));
    },
  },
  extraReducers: (b) => b.addCase(authActions.logout, () => initialState),
});

export const ownerActions = ownerSlice.actions;
export default ownerSlice.reducer;
