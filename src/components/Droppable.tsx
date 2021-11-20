import React, { useCallback, useState } from 'react';
import { ValueChanged } from '../interfaces/value_changed';

export function Droppable({
  children,
  onFileReceived,
}: {
  children: React.ReactElement;
  onFileReceived: ValueChanged<File>;
}) {
  const [hasItemToDrop, setHasItemToDrop] = useState(false);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setHasItemToDrop(false);

      for (const file of event.dataTransfer.files) {
        onFileReceived(file);
      }
    },
    [onFileReceived]
  );

  const onDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setHasItemToDrop(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setHasItemToDrop(false);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="relative w-full h-full" onDragEnter={onDragEnter}>
      {hasItemToDrop && (
        <div
          onDrop={onDrop}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragEnd={onDragLeave}
          onDragOver={onDragOver}
          className="absolute inset-0 rounded-md z-10 bg-black bg-opacity-40"
        >
          <div
            className="h-full text-white text-xl
            border border-color-white border-dashed 
            flex flex-col justify-center items-center"
          >
            <span>Drop here</span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
