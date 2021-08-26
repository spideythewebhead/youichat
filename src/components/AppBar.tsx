import React from 'react';

export function AppBar({
  children,
}: {
  children?: React.ReactNode[] | React.ReactNode;
}) {
  return (
    <div className={`min-h-appbar shadow-md p-2 dark:bg-primary`}>
      {children}
    </div>
  );
}
