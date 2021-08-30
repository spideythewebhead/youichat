import Peer from 'peerjs';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useProfileNotifier } from '../hooks/useAuth';
import { usePromise } from '../hooks/usePromise';
import { Completer } from './completer';

export interface CallEndedEvent {
  (call: Peer.MediaConnection): void;
}

export interface OutgoingCallEvent {
  (call: Peer.MediaConnection, localStream: MediaStream): void;
}

export interface IncomingCallEvent {
  (call: Peer.MediaConnection): void;
}

type ListenerEvents = 'call_ended' | 'incoming_call' | 'outgoing_call';

class CallbackHolder<T extends string> {
  private _callbacks: Record<string, Function[]> = {};

  add(event: T, fn: Function) {
    (this._callbacks[event] ??= []).push(fn);
  }

  remove(event: T, fn: Function) {
    if (this._callbacks[event]) {
      this._callbacks[event] = this._callbacks[event].filter((e) => e !== fn);
    }
  }

  get<F extends Function>(event: T): F[] {
    return this._callbacks[event] as F[];
  }
}

export class CallsManager {
  constructor() {}

  private _connection?: Peer;

  private _pendingConnection!: Completer<boolean>;
  get pendingConnection() {
    return this._pendingConnection.promise;
  }

  // private _calls: Peer.MediaConnection[] = [];

  private _callbacksHolder = new CallbackHolder<ListenerEvents>();

  addEventListener(event: 'call_ended', cb: CallEndedEvent): void;
  addEventListener(event: 'outgoing_call', cb: OutgoingCallEvent): void;
  addEventListener(event: 'incoming_call', cb: IncomingCallEvent): void;

  addEventListener(event: ListenerEvents, cb: any) {
    this._callbacksHolder.add(event, cb);
  }

  removeEventListener(event: 'call_ended', cb: CallEndedEvent): void;
  removeEventListener(event: 'outgoing_call', cb: OutgoingCallEvent): void;
  removeEventListener(event: 'incoming_call', cb: IncomingCallEvent): void;

  removeEventListener(
    event: ListenerEvents,
    cb: CallEndedEvent | IncomingCallEvent
  ) {
    this._callbacksHolder.remove(event, cb);
  }

  setConnectionId(id: string) {
    if (this._connection) {
      this._connection.destroy();
    }

    this._pendingConnection = new Completer<boolean>();

    const connection = new Peer(`${id}`);
    this._connection = connection;

    connection.on('open', () => {
      this._pendingConnection.complete(true);
    });

    connection.on('error', (error) => {
      this._pendingConnection.completeError(error);
    });

    connection.on('call', (call) => {
      this._callbacksHolder
        .get<IncomingCallEvent>('incoming_call')
        ?.forEach((fn) => fn(call));

      const close = call.close;
      call.close = () => {
        this._removeCall(call);
        close.apply(call);
      };

      call.on('error', () => {
        this._removeCall(call);
      });

      call.on('close', () => {
        this._removeCall(call);
      });
    });

    connection.connect(`${id}`);

    return this._pendingConnection.promise;
  }

  private _removeCall(call: Peer.MediaConnection) {
    this._callbacksHolder
      .get<CallEndedEvent>('call_ended')
      ?.forEach((fn) => fn(call));

    // this._calls = this._calls.filter((c) => c.peer !== call.peer);
  }

  async call(id: string, stream: MediaStream) {
    const completer = new Completer<MediaStream | null>();

    if (await this.pendingConnection) {
      const call = this._connection?.call(`${id}`, stream, {
        metadata: {
          type: stream.getVideoTracks().length > 0 ? 'video' : 'audio',
        },
      });

      if (call) {
        this._callbacksHolder
          .get<OutgoingCallEvent>('outgoing_call')
          ?.forEach((fn) => {
            fn(call, stream);
          });

        const close = call.close;

        call.close = () => {
          this._removeCall(call);
          stream.getTracks().forEach((track) => track.stop());
          close.apply(call);
        };

        call.on('stream', (stream) => {
          completer.complete(stream);
        });

        call.on('error', () => {
          this._removeCall(call);
          stream.getTracks().forEach((track) => track.stop());
        });

        call.on('close', () => {
          this._removeCall(call);
          stream.getTracks().forEach((track) => track.stop());
        });

        // this._calls.push(call);

        return;
      }

      completer.complete(null);
    }

    return completer.promise;
  }

  disconnect() {
    this._connection?.disconnect();
  }
}

const CallsManagerContext = React.createContext<CallsManager | null>(null);

export function useCallsManager() {
  return useContext(CallsManagerContext);
}

export function CallsManagerProvider({
  children,
}: {
  children: React.ReactElement;
}) {
  const profile = useProfileNotifier();
  const manager = useMemo(() => new CallsManager(), []);

  useEffect(() => {
    if (profile.uid) {
      manager.setConnectionId(profile.uid);

      return () => {
        manager.disconnect();
      };
    }
  }, [profile.uid, manager]);

  return (
    <CallsManagerContext.Provider value={manager}>
      {children}
    </CallsManagerContext.Provider>
  );
}
