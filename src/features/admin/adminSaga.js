import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { api } from '../../api/index.js';
import { uiActions } from '../ui/uiSlice.js';
import { adminActions as A } from './adminSlice.js';

const fetcher = (fn, success, failure) =>
  function* ({ payload }) {
    try {
      yield put(success(yield call(fn, payload)));
    } catch (e) {
      yield put(failure(e.message));
    }
  };

const mutation = (run, onSuccess, message, idOf) =>
  function* ({ payload }) {
    try {
      const result = yield call(run, payload);
      yield put(onSuccess(result, payload));
      yield put(uiActions.notify({ type: 'success', message: typeof message === 'function' ? message(result) : message }));
      yield put(A.statsRequest());
    } catch (e) {
      yield put(A.actionFailed(idOf(payload)));
      yield put(uiActions.notify({ type: 'error', message: e.message }));
    }
  };

export default function* adminSaga() {
  yield takeLatest(A.statsRequest.type, fetcher(api.adminStats, A.statsSuccess, A.statsFailure));
  yield takeLatest(A.usersRequest.type, fetcher(api.adminUsers, A.usersSuccess, A.usersFailure));
  yield takeLatest(A.propertiesRequest.type, fetcher(api.adminProperties, A.propertiesSuccess, A.propertiesFailure));
  yield takeLatest(A.bookingsRequest.type, fetcher(api.adminBookings, A.bookingsSuccess, A.bookingsFailure));

  yield takeEvery(
    A.userUpdateRequest.type,
    mutation((p) => api.adminUpdateUser(p.id, p.changes), (r) => A.userUpdated(r), (r) => `User ${r.name} updated.`, (p) => p.id),
  );
  yield takeEvery(A.userDeleteRequest.type, mutation(api.adminDeleteUser, (_r, id) => A.userDeleted(id), 'User deleted.', (id) => id));
  yield takeEvery(
    A.propertyUpdateRequest.type,
    mutation((p) => api.adminUpdateProperty(p.id, { status: p.status }), (r) => A.propertyUpdated(r), (r) => `Property marked ${r.status}.`, (p) => p.id),
  );
  yield takeEvery(A.propertyDeleteRequest.type, mutation(api.adminDeleteProperty, (_r, id) => A.propertyDeleted(id), 'Property deleted.', (id) => id));
  yield takeEvery(
    A.bookingUpdateRequest.type,
    mutation((p) => api.adminUpdateBooking(p.id, p.status), (r) => A.bookingUpdated(r), (r) => `Booking ${r.status}.`, (p) => p.id),
  );
}
