import { MapPin, Star, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SafeImage from '../common/SafeImage.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function PropertyCard({ property, search = '' }) {
  return (
    <Link to={`/properties/${property.id}${search}`} className="group block" data-testid="property-card">
      <div className="relative overflow-hidden rounded-2xl">
        <SafeImage src={property.images?.[0]} alt={property.title} className="aspect-[4/3] w-full transition duration-300 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow">{property.type}</span>
        {property.instantBook && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
            <Zap className="h-3 w-3" /> Instant
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold group-hover:text-brand-600">{property.title}</h3>
          {property.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {Number(property.rating).toFixed(2)}
            </span>
          )}
        </div>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> {property.city}, {property.country}
        </p>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <Users className="h-3.5 w-3.5" /> Up to {property.maxGuests} guests · {property.bedrooms} bd · {property.bathrooms} ba
        </p>
        <p className="pt-1 text-sm">
          <span className="text-base font-bold">{formatCurrency(property.pricePerNight)}</span>
          <span className="text-slate-500"> / night</span>
          {property.quote && (
            <span className="ml-2 text-slate-500">· {formatCurrency(property.quote.total)} total</span>
          )}
        </p>
      </div>
    </Link>
  );
}
