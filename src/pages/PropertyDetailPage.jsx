import { Bath, BedDouble, Check, MapPin, Pencil, Star, Users, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { amenityLabel } from '@shared/constants.js';
import { addDays, todayISO } from '@shared/domain/dates.js';
import { FREE_CANCELLATION_DAYS } from '@shared/domain/availability.js';
import AvailabilityCalendar from '../components/property/AvailabilityCalendar.jsx';
import PriceBreakdown from '../components/property/PriceBreakdown.jsx';
import SafeImage from '../components/common/SafeImage.jsx';
import { ErrorState, PageLoader, Spinner } from '../components/common/Feedback.jsx';
import { propertiesActions } from '../features/properties/propertiesSlice.js';
import { bookingActions } from '../features/booking/bookingSlice.js';
import { formatCurrency, formatDate, useDocumentTitle } from '../utils/format.js';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { item: property, status, error } = useSelector((s) => s.properties.detail);
  const availability = useSelector((s) => s.properties.availability.data);
  const quote = useSelector((s) => s.booking.quote);
  const user = useSelector((s) => s.auth.user);

  const [stay, setStay] = useState({
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: Number(params.get('guests')) || 1,
  });
  const [activeImage, setActiveImage] = useState(0);
  useDocumentTitle(property?.title);

  useEffect(() => {
    dispatch(propertiesActions.detailRequest(id));
    setActiveImage(0);
  }, [dispatch, id]);

  useEffect(() => {
    if (stay.checkIn && stay.checkOut) {
      dispatch(bookingActions.quoteRequest({ propertyId: id, ...stay }));
    } else {
      dispatch(bookingActions.quoteReset());
    }
  }, [dispatch, id, stay]);

  const unavailable = useMemo(() => availability?.propertyId === id ? availability.unavailableNights : [], [availability, id]);
  const isOwnListing = user && property && user.id === property.ownerId;
  const canReserve = quote.status === 'succeeded' && quote.data?.available && !isOwnListing && property?.status === 'active';

  if (status === 'failed') {
    return (
      <div className="container-page py-16">
        <ErrorState message={error} onRetry={() => dispatch(propertiesActions.detailRequest(id))} />
        <div className="mt-4 text-center"><Link to="/search" className="btn-secondary">Back to search</Link></div>
      </div>
    );
  }
  if (!property) return <PageLoader label="Loading property…" />;

  const reserve = () => {
    const query = new URLSearchParams({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests: String(stay.guests) });
    const target = `/checkout/${property.id}?${query}`;
    if (!user) navigate(`/login?redirect=${encodeURIComponent(target)}`);
    else navigate(target);
  };

  const today = todayISO();
  const images = property.images?.length ? property.images : [''];

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{property.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {property.rating > 0 && (
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(property.rating).toFixed(2)} · {property.reviewCount} reviews
              </span>
            )}
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {property.address}, {property.city}, {property.country}</span>
          </p>
        </div>
        {isOwnListing && (
          <Link to={`/owner/listings/${property.id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> Edit listing</Link>
        )}
      </div>

      {property.status !== 'active' && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This listing is currently {property.status} and hidden from guests.
        </p>
      )}

      <div className="mt-6 grid gap-2 md:h-[28rem] md:grid-cols-4 md:grid-rows-1">
        <SafeImage src={images[activeImage]} alt={property.title} className="aspect-[4/3] w-full rounded-2xl md:col-span-3 md:aspect-auto md:h-full md:min-h-0" />
        <div className="grid grid-cols-4 gap-2 md:col-span-1 md:h-full md:min-h-0 md:grid-cols-1 md:grid-rows-3">
          {images.slice(0, 4).map((src, i) => (
            <button key={src + i} onClick={() => setActiveImage(i)} className={`overflow-hidden rounded-xl ring-2 md:min-h-0 ${i === activeImage ? 'ring-brand-600' : 'ring-transparent'} ${i === 3 ? 'md:hidden' : ''}`} aria-label={`Show photo ${i + 1}`}>
              <SafeImage src={src} alt="" className="aspect-[4/3] h-full w-full md:aspect-auto" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-semibold">{property.type} hosted by {property.owner?.name || 'a local host'}</h2>
              <p className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {property.maxGuests} guests</span>
                <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {property.bedrooms} bedrooms · {property.beds} beds</span>
                <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {property.bathrooms} baths</span>
              </p>
            </div>
            {property.owner?.avatar && <img src={property.owner.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />}
          </section>

          {property.instantBook ? (
            <p className="flex items-center gap-2 text-sm"><Zap className="h-5 w-5 text-brand-600" /> <strong>Instant book</strong> — your booking is confirmed immediately.</p>
          ) : (
            <p className="text-sm text-slate-500">The host reviews each request; your booking stays <strong>pending</strong> until approved.</p>
          )}

          <section>
            <h2 className="text-xl font-semibold">About this home</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">{property.description}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">What this place offers</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {property.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600" /> {amenityLabel(a)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Availability</h2>
            <p className="mb-4 text-sm text-slate-500">Select your check-in and check-out dates.</p>
            <div className="card p-4">
              <AvailabilityCalendar unavailable={unavailable} checkIn={stay.checkIn} checkOut={stay.checkOut} onSelect={(d) => setStay((s) => ({ ...s, ...d }))} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Cancellation policy</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Free cancellation up to {FREE_CANCELLATION_DAYS} days before check-in for a full refund. After that, cancellations before check-in receive a 50% refund.
            </p>
          </section>
        </div>

        <aside>
          <div className="card sticky top-24 p-6" data-testid="booking-widget">
            <p>
              <span className="text-2xl font-bold">{formatCurrency(property.pricePerNight)}</span>
              <span className="text-slate-500"> / night</span>
            </p>
            {property.weekendPrice && <p className="text-xs text-slate-500">{formatCurrency(property.weekendPrice)} on Fri & Sat nights</p>}

            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
              <label className="border-r border-slate-300 p-3 dark:border-slate-700">
                <span className="block text-[10px] font-bold uppercase">Check-in</span>
                <input
                  type="date"
                  min={today}
                  className="w-full bg-transparent text-sm outline-none"
                  value={stay.checkIn}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStay((s) => ({ ...s, checkIn: v, checkOut: s.checkOut && s.checkOut > v ? s.checkOut : v ? addDays(v, 1) : '' }));
                  }}
                  aria-label="Check-in date"
                />
              </label>
              <label className="p-3">
                <span className="block text-[10px] font-bold uppercase">Check-out</span>
                <input
                  type="date"
                  min={stay.checkIn ? addDays(stay.checkIn, 1) : addDays(today, 1)}
                  className="w-full bg-transparent text-sm outline-none"
                  value={stay.checkOut}
                  onChange={(e) => setStay((s) => ({ ...s, checkOut: e.target.value }))}
                  aria-label="Check-out date"
                />
              </label>
              <label className="col-span-2 border-t border-slate-300 p-3 dark:border-slate-700">
                <span className="block text-[10px] font-bold uppercase">Guests</span>
                <select className="w-full bg-transparent text-sm outline-none" value={stay.guests} onChange={(e) => setStay((s) => ({ ...s, guests: Number(e.target.value) }))} aria-label="Guests">
                  {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 min-h-[1.5rem]">
              {quote.status === 'loading' && <p className="flex items-center gap-2 text-sm text-slate-500"><Spinner className="h-4 w-4" /> Checking availability…</p>}
              {quote.status === 'failed' && <p className="text-sm text-red-600" role="alert">{quote.error}</p>}
              {quote.status === 'succeeded' && !quote.data.available && (
                <p className="text-sm font-medium text-red-600" role="alert">Those dates are unavailable. Please choose different dates.</p>
              )}
              {quote.status === 'succeeded' && quote.data.available && (
                <p className="text-sm font-medium text-emerald-600">✓ Available {formatDate(stay.checkIn)} – {formatDate(stay.checkOut)}</p>
              )}
            </div>

            {isOwnListing ? (
              <p className="mt-4 rounded-xl bg-slate-100 p-3 text-center text-sm dark:bg-slate-800">This is your listing.</p>
            ) : (
              <button className="btn-primary mt-4 w-full py-3 text-base" disabled={!canReserve} onClick={reserve}>
                {!stay.checkIn || !stay.checkOut ? 'Select dates to reserve' : property.instantBook ? 'Reserve' : 'Request to book'}
              </button>
            )}
            <p className="mt-2 text-center text-xs text-slate-500">You won&apos;t be charged — checkout is simulated.</p>

            {quote.status === 'succeeded' && quote.data.price && (
              <div className="mt-6">
                <PriceBreakdown price={quote.data.price} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
