import { all, call, delay, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api/index.js';
import { propertiesActions as A } from './propertiesSlice.js';

export function* searchProperties({ payload }) {
  yield delay(200); // debounce rapid filter changes (takeLatest cancels the previous run)
  try {
    const results = yield call(api.searchProperties, { ...payload, pageSize: 12 });
    yield put(A.searchSuccess(results));
  } catch (e) {
    yield put(A.searchFailure(e.message));
  }
}

function* loadFeatured() {
  try {
    const results = yield call(api.searchProperties, { sort: 'rating', pageSize: 8 });
    yield put(A.featuredSuccess(results));
  } catch (e) {
    yield put(A.featuredFailure(e.message));
  }
}

function* loadDetail({ payload: id }) {
  try {
    const [property, availability] = yield all([call(api.getProperty, id), call(api.getAvailability, id)]);
    yield put(A.availabilitySuccess(availability));
    yield put(A.detailSuccess(property));
  } catch (e) {
    yield put(A.detailFailure(e.message));
  }
}

function* loadAvailability({ payload: id }) {
  try {
    yield put(A.availabilitySuccess(yield call(api.getAvailability, id)));
  } catch (e) {
    yield put(A.availabilityFailure(e.message));
  }
}

export default function* propertiesSaga() {
  yield takeLatest(A.searchRequest.type, searchProperties);
  yield takeLatest(A.featuredRequest.type, loadFeatured);
  yield takeLatest(A.detailRequest.type, loadDetail);
  yield takeLatest(A.availabilityRequest.type, loadAvailability);
}
