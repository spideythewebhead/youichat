export class Completer<T> {
  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this._complete = resolve;
      this._completeError = reject;
    });
  }

  private _promise: Promise<T>;
  get promise() {
    return this._promise;
  }

  private _complete!: (value: T) => void;
  private _completeError!: (error?: any) => void;

  private _done = false;

  complete(value: T): void {
    if (!this._done) {
      this._done = true;
      this._complete(value);
    }
  }

  completeError(error?: any): void {
    if (!this._done) {
      this._done = true;
      this._completeError(error);
    }
  }
}
