import { createSlice } from '@reduxjs/toolkit';

export const defaultFilters = {
  destination: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
  minPrice: '',
  maxPrice: '',
  type: '',
  amenities: [],
  sort: 'recommended',
  page: 1,
};

const empty = { items: [], total: 0, page: 1, totalPages: 1, destinations: [] };

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    filters: defaultFilters,
    results: empty,
    status: 'idle',
    error: null,
    featured: { items: [], destinations: [], status: 'idle', error: null },
    detail: { item: null, status: 'idle', error: null },
    availability: { data: null, status: 'idle', error: null },
  },
  reducers: {
    searchRequest: (s, { payload }) => {
      s.filters = { ...defaultFilters, ...payload };
      s.status = 'loading';
      s.error = null;
    },
    searchSuccess: (s, { payload }) => { s.results = payload; s.status = 'succeeded'; },
    searchFailure: (s, { payload }) => { s.status = 'failed'; s.error = payload; },

    featuredRequest: (s) => { s.featured.status = 'loading'; s.featured.error = null; },
    featuredSuccess: (s, { payload }) => { s.featured = { items: payload.items, destinations: payload.destinations, status: 'succeeded', error: null }; },
    featuredFailure: (s, { payload }) => { s.featured.status = 'failed'; s.featured.error = payload; },

    detailRequest: (s, { payload }) => {
      if (s.detail.item?.id !== payload) s.detail.item = null;
      s.detail.status = 'loading';
      s.detail.error = null;
    },
    detailSuccess: (s, { payload }) => { s.detail = { item: payload, status: 'succeeded', error: null }; },
    detailFailure: (s, { payload }) => { s.detail.status = 'failed'; s.detail.error = payload; },

    availabilityRequest: (s) => { s.availability.status = 'loading'; },
    availabilitySuccess: (s, { payload }) => { s.availability = { data: payload, status: 'succeeded', error: null }; },
    availabilityFailure: (s, { payload }) => { s.availability.status = 'failed'; s.availability.error = payload; },
  },
});

export const propertiesActions = propertiesSlice.actions;
export default propertiesSlice.reducer;
