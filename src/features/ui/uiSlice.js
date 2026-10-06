import { createSlice, nanoid } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    notify: {
      reducer: (s, { payload }) => {
        s.toasts.push(payload);
        if (s.toasts.length > 4) s.toasts.shift();
      },
      prepare: ({ type = 'info', message, duration = 4000 }) => ({ payload: { id: nanoid(), type, message, duration } }),
    },
    dismiss: (s, { payload }) => {
      s.toasts = s.toasts.filter((t) => t.id !== payload);
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;
