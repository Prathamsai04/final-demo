import { createSlice } from '@reduxjs/toolkit';

const idle = { data: null, status: 'idle', error: null };

const bookingSlice = createSlice({
  name: 'booking',
  initialState: { quote: idle, checkout: { booking: null, status: 'idle', error: null }, current: idle },
  reducers: {
    quoteRequest: (s) => { s.quote.status = 'loading'; s.quote.error = null; },
    quoteSuccess: (s, { payload }) => { s.quote = { data: payload, status: 'succeeded', error: null }; },
    quoteFailure: (s, { payload }) => { s.quote = { data: null, status: 'failed', error: payload }; },
    quoteReset: (s) => { s.quote = idle; },

    checkoutRequest: (s) => { s.checkout = { booking: null, status: 'loading', error: null }; },
    checkoutSuccess: (s, { payload }) => {
      s.checkout = { booking: payload, status: 'succeeded', error: null };
      s.current = { data: payload, status: 'succeeded', error: null };
    },
    checkoutFailure: (s, { payload }) => { s.checkout = { booking: null, status: 'failed', error: payload }; },
    checkoutReset: (s) => { s.checkout = { booking: null, status: 'idle', error: null }; },

    bookingRequest: (s, { payload }) => {
      if (s.current.data?.id !== payload) s.current.data = null;
      s.current.status = 'loading';
      s.current.error = null;
    },
    bookingSuccess: (s, { payload }) => { s.current = { data: payload, status: 'succeeded', error: null }; },
    bookingFailure: (s, { payload }) => { s.current.status = 'failed'; s.current.error = payload; },
  },
});

export const bookingActions = bookingSlice.actions;
export default bookingSlice.reducer;
