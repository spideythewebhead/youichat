import React from 'react';

export function ElevatedButton({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...props}
      className={`
      px-4 py-1 m-0 bg-button
      rounded-md
      font-bold
      ${!props.disabled ? 'cursor-pointer' : 'cursor-none'}
      ${props.disabled ? 'opacity-75' : ''}
    `}
    >
      {children}
    </button>
  );
}

export function TextButton({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...props}
      className={`
      px-4 py-1 m-0
      rounded-md
      ${!props.disabled ? 'cursor-pointer' : 'cursor-none'}
      ${props.disabled ? 'opacity-75' : ''}
      hover:brightness-125 filter hover:bg-primary
    `}
    >
      {children}
    </button>
  );
}
