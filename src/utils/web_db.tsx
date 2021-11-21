import React, { useContext } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { Completer } from './completer';

interface CacheDbResult<T> {
  data?: T;
  error?: any;
}

export class CacheDb {
  static _dbName = 'caches';
  static _storeName = 'files_cache';

  constructor() {
    this._init();
  }

  private _initCompleter = new Completer<void>();

  private _db!: IDBDatabase;

  private _init() {
    const initDbRequest = indexedDB.open(CacheDb._dbName, 1);

    initDbRequest.onupgradeneeded = (ev) => {
      this._db = initDbRequest.result;

      this._db.createObjectStore(CacheDb._storeName, { keyPath: 'id' });
    };

    initDbRequest.onsuccess = (ev) => {
      this._db = initDbRequest.result;
      this._initCompleter.complete();
    };
  }

  doneInit() {
    return this._initCompleter.promise;
  }

  put<T>(key: IDBValidKey, value: T) {
    const completer = new Completer<CacheDbResult<IDBValidKey>>();

    const tx = this._db
      .transaction(CacheDb._storeName, 'readwrite')
      .objectStore(CacheDb._storeName)
      .put({
        id: key,
        value,
      });

    tx.onsuccess = () => {
      completer.complete({
        data: tx.result,
      });
    };

    tx.onerror = () => {
      completer.complete({
        error: tx.error,
      });
    };

    return completer.promise;
  }

  get<T>(key: IDBValidKey) {
    const completer = new Completer<CacheDbResult<T>>();

    const tx = this._db
      .transaction(CacheDb._storeName, 'readonly')
      .objectStore(CacheDb._storeName)
      .get(key);

    tx.onsuccess = (ev) => {
      if (!tx.result) {
        completer.complete({});
        return;
      }

      completer.complete({
        data: tx.result,
      });
    };

    tx.onerror = () => {
      completer.complete({
        error: tx.error,
      });
    };

    return completer.promise;
  }

  clear() {
    const completer = new Completer<CacheDbResult<boolean>>();

    const tx = this._db
      .transaction(CacheDb._storeName, 'readwrite')
      .objectStore(CacheDb._storeName)
      .clear();

    tx.onsuccess = () => {
      completer.complete({
        data: true,
      });
    };

    tx.onerror = () => {
      completer.completeError({
        error: tx.error,
      });
    };

    return completer.promise;
  }
}

const CacheDbContext = React.createContext<CacheDb | null>(null);

export function CacheDbProvider({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}) {
  const [db, setDb] = useState<CacheDb | null>(null);

  useEffect(() => {
    (async () => {
      const db = new CacheDb();
      await db.doneInit();

      setDb(db);
    })();
  }, []);

  return (
    <CacheDbContext.Provider value={db}>{children}</CacheDbContext.Provider>
  );
}

export function useCacheDb() {
  return useContext(CacheDbContext);
}
