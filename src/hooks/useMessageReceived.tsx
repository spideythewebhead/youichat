import React, { createContext, useContext, useMemo } from 'react';

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

interface UserNameAndMessageCount {
  name: string;
  count: number;
}

class MessageReceivedHandler {
  private _meta = new Map<String, UserNameAndMessageCount | undefined>();
  private _ids: string[] = [];

  private _thottlerId: number | null = null;

  private _intervalTitleChangerId: number | null = null;

  notify(userId: string, name: string) {
    const data = this._meta.get(userId) ?? {
      count: 0,
      name: name,
    };

    if (data.count === 0) {
      this._ids.push(userId);
    }

    data.count++;

    this._meta.set(userId, data);

    this._playSound();
    this._setTitleChangeInterval();
  }

  remove(userId: string) {
    this._meta.delete(userId);
    this._ids = this._ids.filter((id) => id !== userId);

    if (this._meta.size === 0) {
      this._removeTitleChangeInterval();
      document.title = '';
    }
  }

  private _setTitleChangeInterval() {
    if (this._intervalTitleChangerId) {
      return;
    }

    let i = 0;
    this._intervalTitleChangerId = window.setInterval(() => {
      let data: UserNameAndMessageCount | undefined;

      while (!data && this._ids.length > 0) {
        const nextId = this._ids[i];
        i = (1 + i) % this._ids.length;
        data = this._meta.get(nextId);
      }

      if (data) {
        document.title = `(${data.count}) ${data.name}`;
      }
    }, 1500);
  }

  private _removeTitleChangeInterval() {
    if (this._intervalTitleChangerId) {
      window.clearInterval(this._intervalTitleChangerId);
      this._intervalTitleChangerId = null;
    }
  }

  private _playSound() {
    if (this._thottlerId != null) return;

    messageNotificationPlayer.play();

    this._thottlerId = window.setTimeout(() => {
      this._thottlerId = null;
    }, 30000);
  }
}

const MessageReceivedHandlerContext =
  createContext<MessageReceivedHandler | null>(null);

export function MessageReceivedProvider({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}) {
  const handler = useMemo(() => new MessageReceivedHandler(), []);

  return (
    <MessageReceivedHandlerContext.Provider value={handler}>
      {children}
    </MessageReceivedHandlerContext.Provider>
  );
}

export function useMessageReceived() {
  return useContext(MessageReceivedHandlerContext)!;
}
