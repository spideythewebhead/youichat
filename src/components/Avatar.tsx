import React from 'react';

export function Avatar({
  imageUrl,
  onClick,
  size = 'md',
}: {
  imageUrl?: string | null;
  onClick?: VoidFunction;
  size?: 'sm' | 'md';
}) {
  let s = 'h-6 w-6';

  if (size === 'sm') {
    s = 'h-4 w-4';
  }

  return (
    <img
      src={imageUrl ?? '/assets/default-avatar.jpeg'}
      onClick={onClick}
      className={`rounded-full overflow-hidden inline-block object-cover ${s}
        ${onClick ? 'cursor-pointer' : 'cursor-default'} object-contain
    `}
    />
  );
}
