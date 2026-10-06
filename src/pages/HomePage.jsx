import { CalendarCheck, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/property/SearchBar.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import { CardSkeleton, ErrorState } from '../components/common/Feedback.jsx';
import SafeImage from '../components/common/SafeImage.jsx';
import { propertiesActions } from '../features/properties/propertiesSlice.js';
import { useDocumentTitle } from '../utils/format.js';
import { toSearchParams } from '../utils/query.js';

const HERO = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2000&q=80';

const DESTINATIONS = [
  { name: 'Goa', img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80' },
  { name: 'Manali', img: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Ubud', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Lisbon', img: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=800&q=80' },
];

export default function HomePage() {
  useDocumentTitle();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const featured = useSelector((s) => s.properties.featured);

  useEffect(() => {
    dispatch(propertiesActions.featuredRequest());
  }, [dispatch]);

  const search = (values) => navigate(`/search?${toSearchParams(values)}`);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <SafeImage src={HERO} alt="" className="absolute inset-0 -z-10 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-50 dark:to-slate-950" />
        <div className="container-page pb-16 pt-20 sm:pt-28">
          <div className="max-w-2xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> 16 handpicked homestays · 10 countries
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Stay somewhere that feels like home.</h1>
            <p className="mt-4 text-lg text-white/85">Villas, cabins, heritage havelis and treehouses — hosted by locals who love where they live.</p>
          </div>
          <div className="mt-10">
            <SearchBar onSubmit={search} destinations={featured.destinations || []} />
          </div>
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Top-rated stays</h2>
            <p className="text-slate-500">Guests love these homes.</p>
          </div>
          <Link to="/search" className="btn-secondary">View all</Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.status === 'failed' ? (
            <div className="col-span-full">
              <ErrorState message={featured.error} onRetry={() => dispatch(propertiesActions.featuredRequest())} />
            </div>
          ) : featured.items.length === 0 ? (
            Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)
          ) : (
            featured.items.map((p) => <PropertyCard key={p.id} property={p} />)
          )}
        </div>
      </section>

      <section className="container-page mt-16">
        <h2 className="text-2xl font-bold">Popular destinations</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <Link key={d.name} to={`/search?destination=${d.name}`} className="group relative overflow-hidden rounded-2xl">
              <SafeImage src={d.img} alt={d.name} className="aspect-square w-full transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-4 text-lg font-bold text-white">{d.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-16 grid gap-6 md:grid-cols-3">
        {[
          { icon: CalendarCheck, title: 'Real-time availability', text: 'Live calendars and instant confirmation — no double bookings.' },
          { icon: CreditCard, title: 'Transparent pricing', text: 'See every fee up front, including weekend rates and taxes.' },
          { icon: ShieldCheck, title: 'Flexible cancellation', text: 'Free cancellation up to 48 hours before check-in.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-6">
            <Icon className="h-6 w-6 text-brand-600" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </section>

      <section className="container-page mt-16">
        <div className="card flex flex-col items-start justify-between gap-6 bg-gradient-to-r from-brand-600 to-brand-500 p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Have a place to share?</h2>
            <p className="mt-1 text-white/85">List your home, set your own prices and manage reservations in one dashboard.</p>
          </div>
          <Link to="/owner/listings/new" className="btn bg-white text-brand-700 hover:bg-brand-50">Become a host</Link>
        </div>
      </section>
    </>
  );
}
