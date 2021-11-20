import { useEffect, useMemo, useState } from 'react';
import { client } from '../db';
import { AppChat } from '../models/chat';
import { AppMessage, DBMessage, DBReaction } from '../models/message';
import { ValueNotifier } from '../utils/value_notifier';
import { useUpdateState } from './useUpdateState';

interface NewMessageListener {
  (message: AppMessage): void;
}

class MessagesFetcher extends ValueNotifier<AppMessage[]> {
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

  private _onNewMessageListeners: NewMessageListener[] = [];

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

        this.value = [message, ...this.value!];

        for (const listener of this._onNewMessageListeners) {
          listener(message);
        }
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

  addNewMessageReceivedListener(listener: NewMessageListener) {
    this._onNewMessageListeners.push(listener);
  }

  removeNewMessageReceivedListener(listener: NewMessageListener) {
    this._onNewMessageListeners = this._onNewMessageListeners.filter(
      (fn) => fn !== listener
    );
  }
}

const cache: Record<string, MessagesFetcher> = {};

export function createOrGetMessagesFetcher(uid: string, discussionId: number) {
  if (cache[discussionId]) {
    return cache[discussionId];
  }

  const fetcher = new MessagesFetcher(uid, discussionId, 25);

  cache[discussionId] = fetcher;

  return fetcher;
}

export function useFetchMessages({
  uid,
  discussionId,
}: {
  uid: string;
  discussionId: number;
}) {
  const updateState = useUpdateState();

  // this hook crashes on dev mode
  // because its called twice and adds the same listener twice
  const fetcher = useMemo<MessagesFetcher>(() => {
    const fetcher = createOrGetMessagesFetcher(uid, discussionId);
    fetcher.addListener(updateState);

    return fetcher;
  }, [uid, discussionId, updateState]);

  useEffect(() => {
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

export function useMyDiscussions(uid: string) {
  const [state, setState] = useState<number[]>([]);

  useEffect(() => {
    const subscription = client
      .from<AppChat>(`discussions:participants=cs.${uid}`)
      .on('*', (payload) => {
        console.log(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid]);

  useEffect(() => {
    let active = true;

    client
      .from<AppChat>('discussions')
      .select('*')
      .contains('participants', [uid])
      .then((response) => {
        if (active) {
          const chats = (response.body ?? []).map((chat) => chat.id);

          setState(chats);
        }
      });

    return () => {
      active = false;
    };
  }, [uid]);

  return state;
}
