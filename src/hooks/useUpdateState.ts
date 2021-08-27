import React, { useCallback, useState } from 'react';

export function useUpdateState() {
  const [, setState] = useState(0);
  const updateState = useCallback(() => setState((s) => 1 + s), []);

  return updateState;
}
