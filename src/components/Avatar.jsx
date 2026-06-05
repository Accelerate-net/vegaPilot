import React, { useEffect, useState } from 'react';
import { getInitials } from '../lib/userStore';

/**
 * Renders a person's profile picture, falling back to their initials when there
 * is no photo OR when the image fails to load (broken/expired URL).
 *
 * Initials follow getInitials(): "Abhijith CS" -> "AC", "Navaneeth" -> "NA".
 */
export default function Avatar({
  src,
  name,
  alt,
  className,
  style,
  placeholderClassName,
  placeholderStyle,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => { setFailed(false); }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? ''}
        className={className}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={placeholderClassName ?? className} style={placeholderStyle}>
      {getInitials(name || '')}
    </div>
  );
}
