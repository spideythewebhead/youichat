export interface Listenable {
  addListener: (fn: VoidFunction) => void;
  removeListener: (fn: VoidFunction) => void;
  hasListeners: boolean;
  dispose: VoidFunction;
}

export class ValueNotifier<T> implements Listenable {
  constructor(value: T | null) {
    this._value = value;
  }

  private listeners: VoidFunction[] = [];

  private _value: T | null = null;
  get value(): T | null {
    return this._value;
  }
  set value(v: T | null) {
    // if (this._value !== v) {
    this._value = v;
    this.notifyListeners();
    // }
  }

  addListener(listener: VoidFunction) {
    this.listeners.push(listener);
  }

  removeListener(listener: VoidFunction) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  get hasListeners(): boolean {
    return this.listeners.length !== 0;
  }

  dispose() {
    this.listeners = [];
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
