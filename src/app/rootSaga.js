import { all, fork } from 'redux-saga/effects';
import authSaga from '../features/auth/authSaga.js';
import { metaSaga } from '../features/meta/metaSlice.js';
import propertiesSaga from '../features/properties/propertiesSaga.js';
import bookingSaga from '../features/booking/bookingSaga.js';
import { myBookingsSaga } from '../features/myBookings/myBookingsSlice.js';
import ownerSaga from '../features/owner/ownerSaga.js';
import adminSaga from '../features/admin/adminSaga.js';

export default function* rootSaga() {
  yield all([authSaga, metaSaga, propertiesSaga, bookingSaga, myBookingsSaga, ownerSaga, adminSaga].map((saga) => fork(saga)));
}
