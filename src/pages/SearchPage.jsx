import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/property/SearchBar.jsx';
import FiltersPanel from '../components/property/FiltersPanel.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/common/Feedback.jsx';
import { defaultFilters, propertiesActions } from '../features/properties/propertiesSlice.js';
import { plural, useDocumentTitle } from '../utils/format.js';
import { toSearchParams } from '../utils/query.js';

function parseParams(params) {
  return {
    ...defaultFilters,
    destination: params.get('destination') || '',
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: Number(params.get('guests')) || 1,
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    type: params.get('type') || '',
    amenities: params.get('amenities') ? params.get('amenities').split(',').filter(Boolean) : [],
    sort: params.get('sort') || 'recommended',
    page: Number(params.get('page')) || 1,
  };
}

export default function SearchPage() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseParams(params), [params]);
  const { results, status, error } = useSelector((s) => s.properties);
  const [showFilters, setShowFilters] = useState(false);
  useDocumentTitle(filters.destination ? `Stays in ${filters.destination}` : 'Explore stays');

  useEffect(() => {
    dispatch(propertiesActions.searchRequest(filters));
  }, [dispatch, filters]);

  const update = (changes) => setParams(toSearchParams({ ...filters, page: 1, ...changes }), { replace: true });
  const stayQuery = useMemo(() => {
    const p = toSearchParams({ checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests });
    return p.toString() ? `?${p}` : '';
  }, [filters.checkIn, filters.checkOut, filters.guests]);

  const activeFilterCount = (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.type ? 1 : 0) + filters.amenities.length;
  const reset = () => setParams(toSearchParams({ destination: filters.destination, checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests }));

  return (
    <div className="container-page py-8">
      <SearchBar
        compact
        initial={{ destination: filters.destination, checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests }}
        destinations={results.destinations}
        onSubmit={(v) => update(v)}
      />

      <div className="mt-8 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <FiltersPanel filters={filters} onChange={update} onReset={reset} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">
                {filters.destination ? `Stays matching “${filters.destination}”` : 'All stays'}
              </h1>
              <p className="text-sm text-slate-500" aria-live="polite">
                {status === 'loading' ? 'Searching…' : `${plural(results.total, 'home')} found`}
                {filters.checkIn && filters.checkOut && ' · available for your dates'}
              </p>
            </div>
            <button className="btn-secondary lg:hidden" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
          </div>

          {status === 'failed' ? (
            <ErrorState message={error} onRetry={() => dispatch(propertiesActions.searchRequest(filters))} />
          ) : status === 'loading' && results.items.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : results.items.length === 0 && status === 'succeeded' ? (
            <EmptyState
              icon={SearchX}
              title="No homes match your search"
              message="Try different dates, fewer guests, or remove some filters."
              action={<button className="btn-primary" onClick={() => setParams(new URLSearchParams())}>Clear search</button>}
            />
          ) : (
            <>
              <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${status === 'loading' ? 'opacity-60' : ''}`}>
                {results.items.map((p) => (
                  <PropertyCard key={p.id} property={p} search={stayQuery} />
                ))}
              </div>
              <Pagination page={results.page} totalPages={results.totalPages} onChange={(page) => update({ page })} />
            </>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button className="btn-ghost p-2" onClick={() => setShowFilters(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FiltersPanel filters={filters} onChange={update} onReset={reset} />
            <button className="btn-primary mt-4 w-full" onClick={() => setShowFilters(false)}>
              Show {plural(results.total, 'home')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
