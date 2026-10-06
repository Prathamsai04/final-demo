import { createSlice } from '@reduxjs/toolkit';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { api } from '../../api/index.js';
import { uiActions } from '../ui/uiSlice.js';
import { authActions } from '../auth/authSlice.js';

const initialState = { items: [], status: 'idle', error: null, cancellingId: null };

const myBookingsSlice = createSlice({
  name: 'myBookings',
  initialState,
  reducers: {
    fetchRequest: (s) => { s.status = 'loading'; s.error = null; },
    fetchSuccess: (s, { payload }) => { s.items = payload; s.status = 'succeeded'; },
    fetchFailure: (s, { payload }) => { s.status = 'failed'; s.error = payload; },
    cancelRequest: (s, { payload }) => { s.cancellingId = payload; },
    cancelSuccess: (s, { payload }) => {
      s.cancellingId = null;
      s.items = s.items.map((b) => (b.id === payload.id ? payload : b));
    },
    cancelFailure: (s) => { s.cancellingId = null; },
  },
  extraReducers: (b) => b.addCase(authActions.logout, () => initialState),
});

export const myBookingsActions = myBookingsSlice.actions;
export default myBookingsSlice.reducer;

function* fetchMine() {
  try {
    yield put(myBookingsActions.fetchSuccess(yield call(api.myBookings)));
  } catch (e) {
    yield put(myBookingsActions.fetchFailure(e.message));
  }
}

export function* cancelBooking({ payload: id }) {
  try {
    const booking = yield call(api.cancelBooking, id);
    yield put(myBookingsActions.cancelSuccess(booking));
    const refund = booking.refundAmount ? ` A refund of $${Number(booking.refundAmount).toFixed(2)} has been issued (simulated).` : '';
    yield put(uiActions.notify({ type: 'success', message: `Booking cancelled.${refund}` }));
  } catch (e) {
    yield put(myBookingsActions.cancelFailure());
    yield put(uiActions.notify({ type: 'error', message: e.message }));
  }
}

export function* myBookingsSaga() {
  yield takeLatest(myBookingsActions.fetchRequest.type, fetchMine);
  yield takeEvery(myBookingsActions.cancelRequest.type, cancelBooking);
}
