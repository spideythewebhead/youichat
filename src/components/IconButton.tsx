import React from 'react';

export function IconButton(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) {
  return (
    <button
      {...props}
      className={`
    rounded-full
    p-1
    ${
      props.disabled
        ? 'opacity-50 cursor-default'
        : 'hover:bg-button cursor-pointer hover:brightness-105 hover:shadow-md'
    }
    ${props.className}
    `}
    >
      {props.children}
    </button>
  );
}
