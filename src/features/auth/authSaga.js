import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api/index.js';
import { loadAuth, saveAuth } from '../../api/demoStorage.js';
import { uiActions } from '../ui/uiSlice.js';
import { authActions } from './authSlice.js';

export function* login({ payload }) {
  try {
    const result = yield call(api.login, payload);
    saveAuth(result);
    yield put(authActions.authSuccess(result));
    yield put(uiActions.notify({ type: 'success', message: `Welcome back, ${result.user.name.split(' ')[0]}!` }));
  } catch (e) {
    yield put(authActions.authFailure(e.message));
  }
}

function* register({ payload }) {
  try {
    const result = yield call(api.register, payload);
    saveAuth(result);
    yield put(authActions.authSuccess(result));
    yield put(uiActions.notify({ type: 'success', message: 'Your account has been created.' }));
  } catch (e) {
    yield put(authActions.authFailure(e.message));
  }
}

function* restoreSession() {
  const stored = loadAuth();
  if (!stored?.token) {
    yield put(authActions.sessionEnded());
    return;
  }
  try {
    const { user } = yield call(api.me);
    saveAuth({ ...stored, user });
    yield put(authActions.sessionLoaded(user));
  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      saveAuth(null);
      yield put(authActions.sessionEnded());
      yield put(uiActions.notify({ type: 'info', message: 'Your session ended. Please sign in again.' }));
    } else {
      // Keep the cached user when the API is temporarily unreachable.
      yield put(authActions.sessionLoaded(stored.user));
    }
  }
}

function* logout() {
  saveAuth(null);
  yield put(uiActions.notify({ type: 'info', message: 'You have been signed out.' }));
}

export default function* authSaga() {
  yield takeLatest(authActions.loginRequest.type, login);
  yield takeLatest(authActions.registerRequest.type, register);
  yield takeLatest(authActions.sessionRequest.type, restoreSession);
  yield takeLatest(authActions.logout.type, logout);
}
