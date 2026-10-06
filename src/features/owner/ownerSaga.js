import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { api } from '../../api/index.js';
import { uiActions } from '../ui/uiSlice.js';
import { ownerActions as A } from './ownerSlice.js';

const fetcher = (fn, success, failure) =>
  function* ({ payload }) {
    try {
      yield put(success(yield call(fn, payload)));
    } catch (e) {
      yield put(failure(e.message));
    }
  };

export function* saveProperty({ payload }) {
  const { id, data } = payload;
  try {
    const property = id ? yield call(api.updateProperty, id, data) : yield call(api.createProperty, data);
    yield put(A.saveSuccess(property));
    yield put(uiActions.notify({ type: 'success', message: id ? 'Listing updated.' : 'Listing created and published!' }));
  } catch (e) {
    yield put(A.saveFailure(e.message));
    yield put(uiActions.notify({ type: 'error', message: e.message }));
  }
}

function* setPropertyStatus({ payload }) {
  try {
    const property = yield call(api.updateProperty, payload.id, { status: payload.status });
    yield put(A.propertyUpdated(property));
    yield put(uiActions.notify({ type: 'success', message: payload.status === 'active' ? 'Listing is now live.' : 'Listing deactivated.' }));
  } catch (e) {
    yield put(A.actionFailed(payload.id));
    yield put(uiActions.notify({ type: 'error', message: e.message }));
  }
}

function* saveAvailability({ payload }) {
  try {
    const property = yield call(api.updateAvailability, payload.id, payload.blockedDates);
    yield put(A.propertyUpdated(property));
    yield put(uiActions.notify({ type: 'success', message: 'Availability updated.' }));
  } catch (e) {
    yield put(A.actionFailed(payload.id));
    yield put(uiActions.notify({ type: 'error', message: e.message }));
  }
}

function* deleteProperty({ payload: id }) {
  try {
    yield call(api.deleteProperty, id);
    yield put(A.propertyDeleted(id));
    yield put(uiActions.notify({ type: 'success', message: 'Listing deleted.' }));
  } catch (e) {
    yield put(A.actionFailed(id));
    yield put(uiActions.notify({ type: 'error', message: e.message }));
  }
}

function* updateReservation({ payload }) {
  try {
    const booking = yield call(api.updateReservationStatus, payload.id, payload.status);
    yield put(A.reservationUpdated(booking));
    yield put(uiActions.notify({ type: 'success', message: `Reservation ${booking.status}.` }));
    yield put(A.statsRequest());
  } catch (e) {
    yield put(A.actionFailed(payload.id));
    yield put(uiActions.notify({ type: 'error', message: e.message }));
  }
}

export default function* ownerSaga() {
  yield takeLatest(A.statsRequest.type, fetcher(api.ownerStats, A.statsSuccess, A.statsFailure));
  yield takeLatest(A.propertiesRequest.type, fetcher(api.ownerProperties, A.propertiesSuccess, A.propertiesFailure));
  yield takeLatest(A.editRequest.type, fetcher(api.ownerProperty, A.editSuccess, A.editFailure));
  yield takeLatest(A.reservationsRequest.type, fetcher(api.ownerReservations, A.reservationsSuccess, A.reservationsFailure));
  yield takeLatest(A.saveRequest.type, saveProperty);
  yield takeEvery(A.propertyStatusRequest.type, setPropertyStatus);
  yield takeEvery(A.availabilitySaveRequest.type, saveAvailability);
  yield takeEvery(A.deleteRequest.type, deleteProperty);
  yield takeEvery(A.reservationStatusRequest.type, updateReservation);
}
