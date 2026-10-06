import { useSelector } from 'react-redux';

export default function FiltersPanel({ filters, onChange, onReset }) {
  const { amenities, propertyTypes } = useSelector((s) => s.meta);
  const set = (k, v) => onChange({ [k]: v });
  const toggleAmenity = (id) => {
    const list = filters.amenities || [];
    set('amenities', list.includes(id) ? list.filter((a) => a !== id) : [...list, id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="label" htmlFor="sort">Sort by</label>
        <select id="sort" className="input" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="recommended">Recommended</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div>
        <p className="label">Price per night (USD)</p>
        <div className="flex items-center gap-2">
          <input type="number" min={0} className="input" placeholder="Min" aria-label="Minimum price" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
          <span className="text-slate-400">–</span>
          <input type="number" min={0} className="input" placeholder="Max" aria-label="Maximum price" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="type">Property type</label>
        <select id="type" className="input" value={filters.type} onChange={(e) => set('type', e.target.value)}>
          <option value="">Any type</option>
          {propertyTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="label">Amenities</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {amenities.map((a) => (
            <label key={a.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={(filters.amenities || []).includes(a.id)}
                onChange={() => toggleAmenity(a.id)}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>
      <button className="btn-secondary w-full" onClick={onReset}>Clear filters</button>
    </div>
  );
}
