import { CreditCard, Lock, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { validateGuests, validateStayDates } from '@shared/domain/availability.js';
import PriceBreakdown from '../../components/property/PriceBreakdown.jsx';
import SafeImage from '../../components/common/SafeImage.jsx';
import { ErrorState, PageLoader, Spinner } from '../../components/common/Feedback.jsx';
import { propertiesActions } from '../../features/properties/propertiesSlice.js';
import { bookingActions } from '../../features/booking/bookingSlice.js';
import { formatDate, plural, useDocumentTitle } from '../../utils/format.js';

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function validatePayment(p) {
  const errors = {};
  if (!p.cardName || p.cardName.trim().length < 2) errors.cardName = 'Enter the name on the card.';
  if (!/^\d{16}$/.test(p.cardNumber.replace(/\s/g, ''))) errors.cardNumber = 'Card number must be 16 digits.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(p.expiry)) errors.expiry = 'Use MM/YY.';
  else {
    const [m, y] = p.expiry.split('/').map(Number);
    if (new Date(Date.UTC(2000 + y, m, 1)) <= new Date()) errors.expiry = 'Card has expired.';
  }
  if (!/^\d{3,4}$/.test(p.cvc)) errors.cvc = '3–4 digits.';
  if (!p.agree) errors.agree = 'Please accept the booking terms.';
  return errors;
}

export default function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { propertyId } = useParams();
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { item: property, status, error } = useSelector((s) => s.properties.detail);
  const quote = useSelector((s) => s.booking.quote);
  const checkout = useSelector((s) => s.booking.checkout);

  const stay = { checkIn: params.get('checkIn') || '', checkOut: params.get('checkOut') || '', guests: Number(params.get('guests')) || 1 };
  const [form, setForm] = useState({
    cardName: user?.name || '',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
    specialRequests: '',
    agree: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(bookingActions.checkoutReset());
    if (property?.id !== propertyId) dispatch(propertiesActions.detailRequest(propertyId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, propertyId]);

  const dateError = validateStayDates(stay.checkIn, stay.checkOut) || (property ? validateGuests(stay.guests, property) : null);

  useEffect(() => {
    if (!dateError) dispatch(bookingActions.quoteRequest({ propertyId, ...stay }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, propertyId, stay.checkIn, stay.checkOut, stay.guests, dateError]);

  useEffect(() => {
    if (checkout.status === 'succeeded' && checkout.booking) {
      navigate(`/bookings/${checkout.booking.id}/confirmation`, { replace: true });
      dispatch(bookingActions.checkoutReset());
    }
  }, [checkout, navigate, dispatch]);

  if (status === 'failed') return <div className="container-page py-16"><ErrorState message={error} /></div>;
  if (!property || property.id !== propertyId) return <PageLoader />;

  const backLink = `/properties/${propertyId}?${new URLSearchParams({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests: String(stay.guests) })}`;

  if (dateError) {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold">Check your trip details</h1>
        <p className="mt-2 text-slate-500">{dateError}</p>
        <Link to={backLink} className="btn-primary mt-6">Choose dates</Link>
      </div>
    );
  }

  const set = (k, fmt) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : fmt ? fmt(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validatePayment(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    dispatch(
      bookingActions.checkoutRequest({
        propertyId,
        ...stay,
        specialRequests: form.specialRequests,
        payment: { cardName: form.cardName, cardNumber: form.cardNumber, expiry: form.expiry, cvc: form.cvc },
      }),
    );
  };

  const unavailable = quote.status === 'succeeded' && !quote.data.available;
  const submitting = checkout.status === 'loading';

  return (
    <div className="container-page py-8">
      <Link to={backLink} className="text-sm text-slate-500 hover:text-brand-600">← Back to property</Link>
      <h1 className="mt-2 text-3xl font-bold">{property.instantBook ? 'Confirm and pay' : 'Request to book'}</h1>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" role="note">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>Simulated checkout.</strong> This is a demo — no real payment is processed and no card is charged. Use test card{' '}
          <code className="font-mono">4242 4242 4242 4242</code>, or <code className="font-mono">4000 0000 0000 0002</code> to simulate a decline.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} noValidate className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Your trip</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="font-medium">Dates</dt><dd className="text-slate-500">{formatDate(stay.checkIn)} – {formatDate(stay.checkOut)}</dd></div>
              <div><dt className="font-medium">Guests</dt><dd className="text-slate-500">{plural(stay.guests, 'guest')}</dd></div>
            </dl>
          </section>

          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard className="h-5 w-5" /> Payment details (simulated)</h2>
            <Field label="Name on card" error={errors.cardName}>
              <input className={`input ${errors.cardName ? 'input-error' : ''}`} value={form.cardName} onChange={set('cardName')} autoComplete="cc-name" />
            </Field>
            <Field label="Card number" error={errors.cardNumber}>
              <input className={`input font-mono ${errors.cardNumber ? 'input-error' : ''}`} inputMode="numeric" value={form.cardNumber} onChange={set('cardNumber', formatCard)} autoComplete="cc-number" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiry (MM/YY)" error={errors.expiry}>
                <input className={`input ${errors.expiry ? 'input-error' : ''}`} inputMode="numeric" value={form.expiry} onChange={set('expiry', formatExpiry)} autoComplete="cc-exp" />
              </Field>
              <Field label="CVC" error={errors.cvc}>
                <input className={`input ${errors.cvc ? 'input-error' : ''}`} inputMode="numeric" maxLength={4} value={form.cvc} onChange={set('cvc', (v) => v.replace(/\D/g, ''))} autoComplete="cc-csc" />
              </Field>
            </div>
          </section>

          <section>
            <Field label="Message to host (optional)">
              <textarea className="input" rows={3} maxLength={500} value={form.specialRequests} onChange={set('specialRequests')} placeholder="Arrival time, special occasions…" />
            </Field>
          </section>

          <div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" checked={form.agree} onChange={set('agree')} />
              <span>I agree to the house rules and the cancellation policy, and understand this payment is simulated.</span>
            </label>
            {errors.agree && <p className="field-error">{errors.agree}</p>}
          </div>

          {checkout.status === 'failed' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{checkout.error}</p>}
          {unavailable && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">These dates are no longer available. <Link to={backLink} className="underline">Choose different dates</Link>.</p>}

          <button type="submit" className="btn-primary w-full py-3 text-base sm:w-auto sm:px-10" disabled={submitting || unavailable || quote.status !== 'succeeded'}>
            {submitting ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {submitting ? 'Processing…' : property.instantBook ? 'Confirm and pay (simulated)' : 'Send request (simulated payment)'}
          </button>
        </form>

        <aside>
          <div className="card sticky top-24 p-6">
            <div className="flex gap-4">
              <SafeImage src={property.images?.[0]} alt="" className="h-24 w-28 shrink-0 rounded-xl" />
              <div>
                <p className="text-xs text-slate-500">{property.type}</p>
                <p className="font-semibold">{property.title}</p>
                <p className="text-sm text-slate-500">{property.city}, {property.country}</p>
              </div>
            </div>
            <hr className="my-5 border-slate-200 dark:border-slate-800" />
            <h2 className="mb-3 font-semibold">Price details</h2>
            {quote.status === 'loading' && <p className="flex items-center gap-2 text-sm text-slate-500"><Spinner className="h-4 w-4" /> Calculating…</p>}
            {quote.status === 'failed' && <p className="text-sm text-red-600">{quote.error}</p>}
            {quote.status === 'succeeded' && <PriceBreakdown price={quote.data.price} showNightly />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">
        {label}
        <div className="mt-1.5 font-normal">{children}</div>
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
