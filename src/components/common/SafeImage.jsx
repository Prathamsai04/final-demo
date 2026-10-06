import { useState } from 'react';

const PLACEHOLDER = '/placeholder.svg';

/** Image that falls back to a local placeholder when the remote URL fails to load. */
export default function SafeImage({ src, alt, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!src || failed ? PLACEHOLDER : src}
      alt={alt}
      loading="lazy"
      className={`bg-slate-200 object-cover dark:bg-slate-800 ${className}`}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
