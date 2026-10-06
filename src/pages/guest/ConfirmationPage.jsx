import { CalendarDays, CircleCheck, Clock, MapPin, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import PriceBreakdown from '../../components/property/PriceBreakdown.jsx';
import SafeImage from '../../components/common/SafeImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import { bookingActions } from '../../features/booking/bookingSlice.js';
import { formatDate, plural, useDocumentTitle } from '../../utils/format.js';

export default function ConfirmationPage() {
  useDocumentTitle('Booking confirmation');
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data: booking, status, error } = useSelector((s) => s.booking.current);

  useEffect(() => {
    if (booking?.id !== id) dispatch(bookingActions.bookingRequest(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id]);

  if (status === 'failed') return <div className="container-page py-16"><ErrorState message={error} onRetry={() => dispatch(bookingActions.bookingRequest(id))} /></div>;
  if (!booking || booking.id !== id) return <PageLoader />;

  const pending = booking.status === 'pending';
  return (
    <div className="container-page max-w-3xl py-12">
      <div className="text-center">
        {pending ? <Clock className="mx-auto h-14 w-14 text-amber-500" /> : <CircleCheck className="mx-auto h-14 w-14 text-emerald-500" />}
        <h1 className="mt-4 text-3xl font-bold" data-testid="confirmation-title">{pending ? 'Booking request sent' : 'Your booking is confirmed!'}</h1>
        <p className="mt-2 text-slate-500">
          {pending ? 'The host will review your request. You will see the status update in My trips.' : 'Pack your bags — a confirmation has been recorded (no real email is sent in demo mode).'}
        </p>
        <p className="mt-3 text-sm">
          Confirmation code <span className="font-mono font-semibold" data-testid="booking-id">{booking.id.toUpperCase()}</span>
        </p>
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <SafeImage src={booking.property?.image} alt="" className="h-48 w-full sm:h-auto sm:w-56" />
          <div className="flex-1 space-y-3 p-6">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">{booking.property?.title}</h2>
              <StatusBadge status={booking.status} />
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {booking.property?.city}, {booking.property?.country}</p>
            <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}</p>
            <p className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" /> {plural(booking.guests, 'guest')}</p>
            <p className="text-xs text-slate-500">Paid with simulated card •••• {booking.payment?.last4}</p>
          </div>
        </div>
        <div className="border-t border-slate-200 p-6 dark:border-slate-800">
          <PriceBreakdown price={booking.price} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/account/bookings" className="btn-primary">View my trips</Link>
        <Link to="/search" className="btn-secondary">Keep exploring</Link>
      </div>
    </div>
  );
}
