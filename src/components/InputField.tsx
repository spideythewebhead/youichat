import React, { forwardRef } from 'react';
import { Column } from './Flex';

export const InputField = forwardRef<
  HTMLInputElement,
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & {
    background?: string;
    error?: string | null;
  }
>(
  (
    props: {
      background?: string;
      error?: string | null;
    } & React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    ref
  ) => {
    return (
      <Column crossAxis="items-stretch">
        <input
          {...props}
          className={`
        px-2 py-1
        border-0
        rounded-md
        outline-none
        ${props.background ?? 'bg-scaffold'}
        `}
          ref={ref}
        />

        {props.error && (
          <span className="text-red-500 text-sm">{props.error}</span>
        )}
      </Column>
    );
  }
);

InputField.displayName = 'InputField';
