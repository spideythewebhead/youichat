import { useEffect, useLayoutEffect, useMemo } from 'react';
import { client } from '../db';
import { AppMessage, DBMessage, DBReaction } from '../models/message';
import { ValueNotifier } from '../utils/value_notifier';
import { useUpdateState } from './updateState';

class NotificationPlayer {
  private _player: HTMLAudioElement;

  constructor(public readonly sound: string) {
    this._player = new Audio(sound);
  }

  play() {
    this._player.play();
  }
}

const messageNotificationPlayer = new NotificationPlayer('/assets/message.mp3');

class Fetcher extends ValueNotifier<AppMessage[]> {
  constructor(
    public uid: string,
    public discussionId: number,
    public limit: number
  ) {
    super([]);

    this._setNewMessageListener();
    this._setReactionChangedListener();
    this.onFetchMore();
  }

  get messages() {
    return this.value;
  }

  private _loading = false;
  get loading() {
    return this._loading;
  }

  private _done = false;

  private _disposables: VoidFunction[] = [];

  dispose() {
    for (const disposable of this._disposables) {
      disposable();
    }
    super.dispose();
  }

  private _setNewMessageListener() {
    const subscription = client
      .from<DBMessage>(`messages:discussion_id=eq.${this.discussionId}`)
      .on('INSERT', (payload) => {
        const message = new AppMessage(payload.new);

        if (this.hasListeners && this.uid !== message.sender_id) {
          messageNotificationPlayer.play();
        }

        this.value = [message, ...this.value!];
      })
      .subscribe();

    this._disposables.push(() => {
      client.removeSubscription(subscription);
    });
  }

  private _setReactionChangedListener() {
    const subscription = client
      .from<DBReaction>(`reactions:discussion_id=eq.${this.discussionId}`)
      .on('*', (payload) => {
        let update = payload.new;

        if (!update.id) {
          update = payload.old;
        }

        const message = this.value?.find((m) => m.id === update.message_id);

        if (message) {
          switch (payload.eventType) {
            case 'INSERT': {
              message.addReaction(update);
              this.notifyListeners();
              break;
            }
            case 'DELETE':
              message.removeReaction(update);
              this.notifyListeners();
              break;
          }
        }
      })
      .subscribe();

    this._disposables.push(() => {
      client.removeSubscription(subscription);
    });
  }

  async onFetchMore() {
    if (this._done || this._loading) return;

    this._loading = true;

    const response = await client
      .from<DBMessage>('messages')
      .select(
        `
          id,sender_id,body,created_at,discussion_id,
          reactions(*)
        `
      )
      .eq('discussion_id', this.discussionId)
      .range(this.value!.length, this.value!.length + this.limit - 1)
      .order('created_at', { ascending: false })
      .limit(this.limit);

    if (response.data) {
      const messages = response.data.map((m) => {
        return new AppMessage(m);
      });

      this.value = [...this.value!, ...messages];
      this._done = messages.length < this.limit;
    }

    this._loading = false;
  }
}

const cache: Record<string, Fetcher> = {};

export function useFetchMessages({
  uid,
  discussionId,
}: {
  uid: string;
  discussionId: number;
}) {
  const updateState = useUpdateState();

  const fetcher = useMemo<Fetcher>(() => {
    if (cache[discussionId]) {
      cache[discussionId].addListener(updateState);
      return cache[discussionId];
    }

    const fetcher = new Fetcher(uid, discussionId, 25);
    fetcher.addListener(updateState);

    return (cache[discussionId] = fetcher);
  }, [uid, discussionId, updateState]);

  useLayoutEffect(() => {
    return () => {
      fetcher.removeListener(updateState);
    };
  }, [fetcher, updateState]);

  return {
    messages: fetcher.messages,
    loading: fetcher.loading,
    onLoadMore: () => fetcher.onFetchMore(),
  };
}
