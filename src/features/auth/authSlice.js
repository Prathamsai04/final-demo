import { createSlice } from '@reduxjs/toolkit';
import { loadAuth } from '../../api/demoStorage.js';

const stored = loadAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored?.user || null,
    token: stored?.token || null,
    status: 'idle',
    error: null,
    initialized: !stored?.token,
  },
  reducers: {
    loginRequest: (s) => { s.status = 'loading'; s.error = null; },
    registerRequest: (s) => { s.status = 'loading'; s.error = null; },
    authSuccess: (s, { payload }) => {
      s.status = 'succeeded';
      s.user = payload.user;
      s.token = payload.token;
      s.initialized = true;
    },
    authFailure: (s, { payload }) => { s.status = 'failed'; s.error = payload; },
    clearAuthError: (s) => { s.error = null; s.status = 'idle'; },
    sessionRequest: () => {},
    sessionLoaded: (s, { payload }) => { s.user = payload; s.initialized = true; },
    sessionEnded: (s) => { s.user = null; s.token = null; s.initialized = true; },
    logout: (s) => { s.user = null; s.token = null; s.status = 'idle'; },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (s) => s.auth.user;
export const selectRole = (s) => s.auth.user?.role;
export const selectIsAuthenticated = (s) => Boolean(s.auth.user && s.auth.token);
