import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import auth from '../features/auth/authSlice.js';
import ui from '../features/ui/uiSlice.js';
import meta from '../features/meta/metaSlice.js';
import properties from '../features/properties/propertiesSlice.js';
import booking from '../features/booking/bookingSlice.js';
import myBookings from '../features/myBookings/myBookingsSlice.js';
import owner from '../features/owner/ownerSlice.js';
import admin from '../features/admin/adminSlice.js';
import rootSaga from './rootSaga.js';

export const reducer = { auth, ui, meta, properties, booking, myBookings, owner, admin };

export function createAppStore(preloadedState) {
  const sagaMiddleware = createSagaMiddleware({
    onError: (err) => console.error('[saga] uncaught error', err),
  });
  const store = configureStore({
    reducer,
    preloadedState,
    middleware: (getDefault) => getDefault({ thunk: false }).concat(sagaMiddleware),
  });
  sagaMiddleware.run(rootSaga);
  return store;
}
