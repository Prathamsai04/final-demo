import { CalendarX, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addDays, todayISO } from '@shared/domain/dates.js';
import { ErrorState, PageLoader, Spinner } from '../../components/common/Feedback.jsx';
import SafeImage from '../../components/common/SafeImage.jsx';
import { ownerActions } from '../../features/owner/ownerSlice.js';
import { formatDate, useDocumentTitle } from '../../utils/format.js';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
];

const EMPTY = {
  title: '',
  type: 'Villa',
  description: '',
  city: '',
  country: '',
  address: '',
  pricePerNight: 100,
  weekendPrice: '',
  cleaningFee: 20,
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: ['wifi'],
  imagesText: '',
  instantBook: true,
  status: 'active',
  blockedDates: [],
};

export function validateListing(f) {
  const e = {};
  if (f.title.trim().length < 5) e.title = 'Title must be at least 5 characters.';
  if (f.description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
  if (f.city.trim().length < 2) e.city = 'City is required.';
  if (f.country.trim().length < 2) e.country = 'Country is required.';
  if (f.address.trim().length < 3) e.address = 'Address is required.';
  if (!(Number(f.pricePerNight) >= 10)) e.pricePerNight = 'Minimum $10 per night.';
  if (f.weekendPrice !== '' && f.weekendPrice != null && !(Number(f.weekendPrice) >= 10)) e.weekendPrice = 'Minimum $10, or leave empty.';
  if (!(Number(f.cleaningFee) >= 0)) e.cleaningFee = 'Cannot be negative.';
  if (!(Number(f.maxGuests) >= 1 && Number(f.maxGuests) <= 30)) e.maxGuests = '1–30 guests.';
  if (!(Number(f.beds) >= 1)) e.beds = 'At least 1 bed.';
  if (!(Number(f.bedrooms) >= 0)) e.bedrooms = 'Cannot be negative.';
  if (!(Number(f.bathrooms) >= 0)) e.bathrooms = 'Cannot be negative.';
  const images = parseImages(f.imagesText);
  if (images.length === 0) e.imagesText = 'Add at least one image URL.';
  else if (images.some((u) => !/^https?:\/\/\S+$/.test(u))) e.imagesText = 'Each line must be a valid http(s) URL.';
  return e;
}

const parseImages = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

export default function PropertyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit listing' : 'New listing');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { amenities, propertyTypes } = useSelector((s) => s.meta);
  const { editing, save, busyIds } = useSelector((s) => s.owner);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [range, setRange] = useState({ start: '', end: '', note: '' });
  const [rangeError, setRangeError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(ownerActions.editReset());
    if (isEdit) dispatch(ownerActions.editRequest(id));
    else setForm(EMPTY);
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && editing.data?.id === id && !submitted) {
      const p = editing.data;
      setForm({ ...EMPTY, ...p, weekendPrice: p.weekendPrice ?? '', imagesText: (p.images || []).join('\n'), blockedDates: p.blockedDates || [] });
    }
  }, [editing.data, id, isEdit, submitted]);

  useEffect(() => {
    if (submitted && save.status === 'succeeded') navigate('/owner/listings');
  }, [save.status, submitted, navigate]);

  const images = useMemo(() => parseImages(form.imagesText), [form.imagesText]);

  if (isEdit && editing.status === 'failed') return <ErrorState message={editing.error} />;
  if (isEdit && editing.data?.id !== id) return <PageLoader />;

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const toggleAmenity = (aid) =>
    setForm((f) => ({ ...f, amenities: f.amenities.includes(aid) ? f.amenities.filter((a) => a !== aid) : [...f.amenities, aid] }));

  const addRange = () => {
    if (!range.start || !range.end) return setRangeError('Pick a start and end date.');
    if (range.end <= range.start) return setRangeError('End must be after start.');
    setRangeError(null);
    setForm((f) => ({ ...f, blockedDates: [...f.blockedDates, { ...range, note: range.note || undefined }].sort((a, b) => a.start.localeCompare(b.start)) }));
    setRange({ start: '', end: '', note: '' });
  };
  const removeRange = (i) => setForm((f) => ({ ...f, blockedDates: f.blockedDates.filter((_, idx) => idx !== i) }));

  const toPayload = () => ({
    title: form.title.trim(),
    type: form.type,
    description: form.description.trim(),
    city: form.city.trim(),
    country: form.country.trim(),
    address: form.address.trim(),
    pricePerNight: Number(form.pricePerNight),
    weekendPrice: form.weekendPrice === '' || form.weekendPrice == null ? null : Number(form.weekendPrice),
    cleaningFee: Number(form.cleaningFee),
    maxGuests: Number(form.maxGuests),
    bedrooms: Number(form.bedrooms),
    beds: Number(form.beds),
    bathrooms: Number(form.bathrooms),
    amenities: form.amenities,
    images,
    instantBook: Boolean(form.instantBook),
    status: form.status,
    blockedDates: form.blockedDates.map(({ start, end, note }) => ({ start, end, ...(note ? { note } : {}) })),
  });

  const submit = (e) => {
    e.preventDefault();
    const errs = validateListing(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setSubmitted(true);
    dispatch(ownerActions.saveRequest({ id: isEdit ? id : undefined, data: toPayload() }));
  };

  const saving = save.status === 'loading';
  const today = todayISO();

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/owner/listings" className="text-sm text-slate-500 hover:text-brand-600">← My listings</Link>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit listing' : 'Create a new listing'}</h1>
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} {isEdit ? 'Save changes' : 'Publish listing'}
        </button>
      </div>

      <Section title="Basics">
        <Input id="title" label="Title" value={form.title} onChange={set('title')} error={errors.title} placeholder="Sunny cottage with garden" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Property type</label>
            <select id="type" className="input" value={form.type} onChange={set('type')}>
              {propertyTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Visibility</label>
            <select id="status" className="input" value={form.status} onChange={set('status')}>
              <option value="active">Active — visible to guests</option>
              <option value="inactive">Inactive — hidden</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={5} className={`input ${errors.description ? 'input-error' : ''}`} value={form.description} onChange={set('description')} placeholder="Describe the space, the neighbourhood and what makes it special." />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>
      </Section>

      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="city" label="City" value={form.city} onChange={set('city')} error={errors.city} />
          <Input id="country" label="Country" value={form.country} onChange={set('country')} error={errors.country} />
        </div>
        <Input id="address" label="Address / area" value={form.address} onChange={set('address')} error={errors.address} />
      </Section>

      <Section title="Pricing (USD)">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="pricePerNight" type="number" min={10} label="Nightly price" value={form.pricePerNight} onChange={set('pricePerNight')} error={errors.pricePerNight} />
          <Input id="weekendPrice" type="number" min={10} label="Weekend price (Fri/Sat, optional)" value={form.weekendPrice} onChange={set('weekendPrice')} error={errors.weekendPrice} />
          <Input id="cleaningFee" type="number" min={0} label="Cleaning fee" value={form.cleaningFee} onChange={set('cleaningFee')} error={errors.cleaningFee} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={form.instantBook} onChange={set('instantBook')} />
          Instant book — confirm bookings automatically (otherwise you approve each request)
        </label>
      </Section>

      <Section title="Space & capacity">
        <div className="grid gap-4 sm:grid-cols-4">
          <Input id="maxGuests" type="number" min={1} label="Max guests" value={form.maxGuests} onChange={set('maxGuests')} error={errors.maxGuests} />
          <Input id="bedrooms" type="number" min={0} label="Bedrooms" value={form.bedrooms} onChange={set('bedrooms')} error={errors.bedrooms} />
          <Input id="beds" type="number" min={1} label="Beds" value={form.beds} onChange={set('beds')} error={errors.beds} />
          <Input id="bathrooms" type="number" min={0} step="0.5" label="Bathrooms" value={form.bathrooms} onChange={set('bathrooms')} error={errors.bathrooms} />
        </div>
      </Section>

      <Section title="Amenities">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {amenities.map((a) => (
            <label key={a.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={form.amenities.includes(a.id)} onChange={() => toggleAmenity(a.id)} />
              {a.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Photos">
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="imagesText">Image URLs (one per line)</label>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, imagesText: SAMPLE_IMAGES.join('\n') }))}>
              <ImagePlus className="h-4 w-4" /> Use sample photos
            </button>
          </div>
          <textarea id="imagesText" rows={4} className={`input font-mono text-xs ${errors.imagesText ? 'input-error' : ''}`} value={form.imagesText} onChange={set('imagesText')} placeholder="https://images.unsplash.com/..." />
          {errors.imagesText && <p className="field-error">{errors.imagesText}</p>}
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {images.slice(0, 12).map((src, i) => <SafeImage key={src + i} src={src} alt="" className="aspect-square w-full rounded-lg" />)}
          </div>
        )}
      </Section>

      <Section title="Availability — blocked dates">
        <p className="text-sm text-slate-500">Block dates when the home isn&apos;t available (maintenance, personal use). Guests can&apos;t book blocked nights.</p>
        {form.blockedDates.length > 0 && (
          <ul className="space-y-2">
            {form.blockedDates.map((r, i) => (
              <li key={`${r.start}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                <span>
                  <CalendarX className="mr-2 inline h-4 w-4 text-slate-400" />
                  {formatDate(r.start)} – {formatDate(r.end)} {r.note && <span className="text-slate-500">· {r.note}</span>}
                </span>
                <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => removeRange(i)} aria-label="Remove blocked range">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
          <input type="date" className="input" min={today} value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value, end: r.end && r.end > e.target.value ? r.end : e.target.value ? addDays(e.target.value, 1) : '' }))} aria-label="Blocked from" />
          <input type="date" className="input" min={range.start ? addDays(range.start, 1) : today} value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} aria-label="Blocked until" />
          <input className="input" placeholder="Note (optional)" maxLength={100} value={range.note} onChange={(e) => setRange((r) => ({ ...r, note: e.target.value }))} />
          <button type="button" className="btn-secondary" onClick={addRange}>Add</button>
        </div>
        {rangeError && <p className="field-error">{rangeError}</p>}
        {isEdit && (
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={busyIds.includes(id)}
            onClick={() => dispatch(ownerActions.availabilitySaveRequest({ id, blockedDates: toPayload().blockedDates }))}
          >
            {busyIds.includes(id) && <Spinner className="h-3 w-3" />} Save availability only
          </button>
        )}
      </Section>

      <div className="flex justify-end gap-2">
        <Link to="/owner/listings" className="btn-secondary">Cancel</Link>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />} {isEdit ? 'Save changes' : 'Publish listing'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <section className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Input({ id, label, error, ...rest }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className={`input ${error ? 'input-error' : ''}`} {...rest} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
