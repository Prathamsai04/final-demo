import { createSlice } from '@reduxjs/toolkit';
import { call, put, takeLatest } from 'redux-saga/effects';
import { AMENITIES, PROPERTY_TYPES } from '@shared/constants.js';
import { api } from '../../api/index.js';

const metaSlice = createSlice({
  name: 'meta',
  initialState: { mode: 'unknown', amenities: AMENITIES, propertyTypes: PROPERTY_TYPES, demoAccounts: [], status: 'idle' },
  reducers: {
    metaRequest: (s) => { s.status = 'loading'; },
    metaSuccess: (s, { payload }) => ({ ...s, ...payload, status: 'succeeded' }),
    metaFailure: (s) => { s.status = 'failed'; s.mode = 'offline'; },
  },
});

export const metaActions = metaSlice.actions;
export default metaSlice.reducer;

function* loadMeta() {
  try {
    const meta = yield call(api.meta);
    yield put(metaActions.metaSuccess(meta));
  } catch {
    yield put(metaActions.metaFailure());
  }
}

export function* metaSaga() {
  yield takeLatest(metaActions.metaRequest.type, loadMeta);
}
