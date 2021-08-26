import React from 'react';

export function TextArea(
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >
) {
  return (
    <textarea
      {...props}
      className={`resize-none bg-primary outline-none px-2 py-1 text-sm h-16 rounded-md ${
        props.className ?? ''
      }`}
    ></textarea>
  );
}
