import React from 'react';

export function Card({
  children,
}: {
  children?: React.ReactNode | React.ReactNode[];
}) {
  return (
    <div
      className={`
      rounded-md
      shadow-md
      dark:bg-card
      p-2
      m-2
      min-w-card
    `}
    >
      {children}
    </div>
  );
}

export function CardTitle({ title }: { title: string }) {
  return <div className="text-lg font-bold text-center pb-2">{title}</div>;
}
