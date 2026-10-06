import { call, delay, put, takeLatest } from 'redux-saga/effects';
import { validateStayDates } from '@shared/domain/availability.js';
import { api } from '../../api/index.js';
import { uiActions } from '../ui/uiSlice.js';
import { bookingActions as A } from './bookingSlice.js';
import { myBookingsActions } from '../myBookings/myBookingsSlice.js';
import { propertiesActions } from '../properties/propertiesSlice.js';

export function* fetchQuote({ payload }) {
  const { propertyId, checkIn, checkOut, guests } = payload;
  const dateError = validateStayDates(checkIn, checkOut);
  if (dateError) {
    yield put(A.quoteFailure(dateError));
    return;
  }
  yield delay(150);
  try {
    const quote = yield call(api.quote, propertyId, { checkIn, checkOut, guests });
    yield put(A.quoteSuccess(quote));
  } catch (e) {
    yield put(A.quoteFailure(e.message));
  }
}

export function* checkout({ payload }) {
  try {
    const booking = yield call(api.createBooking, payload);
    yield put(A.checkoutSuccess(booking));
    yield put(propertiesActions.availabilityRequest(payload.propertyId));
    yield put(myBookingsActions.fetchRequest());
    yield put(
      uiActions.notify({
        type: 'success',
        message: booking.status === 'confirmed' ? 'Booking confirmed! 🎉' : 'Request sent — awaiting host approval.',
      }),
    );
  } catch (e) {
    yield put(A.checkoutFailure(e.message));
    yield put(uiActions.notify({ type: 'error', message: e.message }));
    if (e.status === 409) yield put(propertiesActions.availabilityRequest(payload.propertyId));
  }
}

function* loadBooking({ payload: id }) {
  try {
    yield put(A.bookingSuccess(yield call(api.getBooking, id)));
  } catch (e) {
    yield put(A.bookingFailure(e.message));
  }
}

export default function* bookingSaga() {
  yield takeLatest(A.quoteRequest.type, fetchQuote);
  yield takeLatest(A.checkoutRequest.type, checkout);
  yield takeLatest(A.bookingRequest.type, loadBooking);
}
