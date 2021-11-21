export interface Listenable {
  addListener: (fn: VoidFunction) => void;
  removeListener: (fn: VoidFunction) => void;
  hasListeners: boolean;
  dispose: VoidFunction;
}

export class ChangeNotifier implements Listenable {
  private listeners: VoidFunction[] = [];

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

export class ValueNotifier<T> extends ChangeNotifier {
  constructor(value: T) {
    super();
    this._value = value;
  }

  private _value: T;
  get value(): T {
    return this._value;
  }

  set value(v: T) {
    this._value = v;
    this.notifyListeners();
  }
}
