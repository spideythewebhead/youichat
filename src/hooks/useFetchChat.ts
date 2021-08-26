import React, { useEffect, useState } from 'react';
import { client } from '../db';
import { AppChat } from '../models/chat';

const cache: Record<string, AppChat> = {};

export function useFetchChat({
  uid,
  remoteUid,
}: {
  uid: string;
  remoteUid?: string;
}) {
  const [chat, setChat] = useState<AppChat | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!remoteUid || !uid) {
      setChat(null);
      setLoading(false);
      return;
    }

    if (cache[remoteUid]) {
      setChat(cache[remoteUid]);
      return;
    }

    setChat(null);

    let mounted = true;

    async function go() {
      setLoading(true);

      try {
        const getDiscussionResponse = await client
          .from<AppChat>('discussions')
          .select('*')
          .contains('participants', [uid, remoteUid]);

        if (!mounted) return;

        if (getDiscussionResponse.error) {
          return;
        }

        if (getDiscussionResponse.data.length === 0) {
          const createDiscussionResponse = await client
            .from<AppChat>('discussions')
            .insert({
              participants: [uid, remoteUid!],
            });

          if (createDiscussionResponse.error) {
            return;
          }

          if (createDiscussionResponse.data) {
            const chat = createDiscussionResponse.data[0] as AppChat;

            setChat(chat);
            cache[remoteUid!] = chat;
          }

          return;
        }

        const chat = getDiscussionResponse.data[0] as AppChat;

        setChat(chat);
        cache[remoteUid!] = chat;
      } catch (e) {
        console.log(e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    go();

    return () => {
      mounted = false;
    };
  }, [uid, remoteUid]);

  return {
    chat,
    loading,
  };
}
