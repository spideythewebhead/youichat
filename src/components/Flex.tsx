import React from 'react';

interface Flex {
  mainAxis?:
    | 'justify-start'
    | 'justify-end'
    | 'justify-between'
    | 'justify-evenly'
    | 'justify-center';
  crossAxis?: 'items-start' | 'items-end' | 'items-center' | 'items-stretch';
  axisSize?: 'max' | 'min';
  gap?: string;
}

export function Row({
  mainAxis = 'justify-start',
  crossAxis = 'items-center',
  axisSize = 'max',
  children,
  ...props
}: Flex &
  React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >) {
  return (
    <div
      {...props}
      className={`flex flex-row ${mainAxis} ${crossAxis}
    ${axisSize === 'max' ? 'w-full' : 'w-auto'}
    ${props.className ?? ''}
    `}
    >
      {children}
    </div>
  );
}

export function Column({
  mainAxis = 'justify-start',
  crossAxis = 'items-center',
  axisSize = 'max',
  children,
  ...props
}: Flex &
  React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >) {
  return (
    <div
      {...props}
      className={`flex flex-col ${mainAxis} ${crossAxis}
    ${axisSize === 'max' ? 'h-full' : 'h-auto'}
    ${props.className ?? ''}
    `}
    >
      {children}
    </div>
  );
}
