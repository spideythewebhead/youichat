import { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { client } from '../../db';
import { messaging } from '../../firebase';
import { useProfile } from '../../hooks/useAuth';
import { useFetchChat } from '../../hooks/useFetchChat';
import {
  useMyDiscussions,
  createOrGetMessagesFetcher,
} from '../../hooks/useFetchMessages';
import { useFetchUsers } from '../../hooks/useFetchUsers';
import { useMessageReceived } from '../../hooks/useMessageReceived';
import { ValueChanged } from '../../interfaces/value_changed';
import { AppChat } from '../../models/chat';
import { AppMessage } from '../../models/message';
import { Profile } from '../../models/profile';
import { AppUser } from '../../models/user';

interface MainPageBloc {
  users: AppUser[];
  profile: Profile;
  user: {
    remote: AppUser | null;
    setRemote: ValueChanged<AppUser | null>;
  };
  chat: {
    current: AppChat | null;
    isLoading: boolean;
  };
}

export function useMainPageBloc(): MainPageBloc {
  const { search: urlParams } = useLocation();
  const profile = useProfile();

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const { users } = useFetchUsers(profile.uid!);

  const { chat, loading: isFetchingChat } = useFetchChat({
    uid: profile.uid!,
    remoteUid: selectedUser?.id,
  });

  const onFcmReceived = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === 'focus-chat') {
        setSelectedUser(
          users.find((user) => user.id === event.data.senderId) ?? null
        );
      }
    },
    [users]
  );

  _useUrlParamsChanged({
    urlParams,
    users,
    setSelectedUser,
  });

  _useUpdateHistorySearchOnUserChange(selectedUser);

  // notifications permissions & fcm listener
  useEffect(() => {
    if (profile.uid) {
      let id: number | null;

      id = window.setTimeout(async () => {
        const accepted = await _requestNotificationsPermission(profile.uid!);

        if (accepted && id !== null) {
          window.navigator.serviceWorker.addEventListener(
            'message',
            onFcmReceived
          );
        }
      }, 1000);

      return () => {
        clearTimeout(id!);
        id = null;
        window.navigator.serviceWorker.removeEventListener(
          'message',
          onFcmReceived
        );
      };
    }
  }, [profile.uid, onFcmReceived]);

  _useNewMessagesSideEffect({
    profile,
    selectedUser,
    users,
  });

  return {
    users,
    profile,
    user: {
      remote: selectedUser,
      setRemote: setSelectedUser,
    },
    chat: {
      current: chat,
      isLoading: isFetchingChat,
    },
  };
}

async function _requestNotificationsPermission(uid: string): Promise<boolean> {
  try {
    const token = await messaging.getToken();

    const { data } = await client
      .from<{ id: number; user_id: string; token: string }>('push_tokens')
      .insert({
        user_id: uid,
        token,
      });

    if (data) {
      window.localStorage.setItem('push_id', data[0].id.toString());
    }

    return true;
  } catch (e) {
    console.log(e);
  }

  return false;
}

function _useUrlParamsChanged({
  users,
  urlParams,
  setSelectedUser,
}: {
  urlParams: string;
  users: AppUser[];
  setSelectedUser: ValueChanged<AppUser | null>;
}) {
  useEffect(() => {
    if (users && urlParams) {
      const params = new URLSearchParams(urlParams);

      if (params.has('chat-remote')) {
        const user = users.find((u) => u.id === params.get('chat-remote'));

        if (user) {
          setSelectedUser(user);
        }
      }
    }

    if (!urlParams) {
      setSelectedUser(null);
    }
  }, [urlParams, users, setSelectedUser]);
}

function _useUpdateHistorySearchOnUserChange(selectedUser: AppUser | null) {
  const history = useHistory();

  useEffect(() => {
    if (selectedUser?.id) {
      history.push({
        search: `chat-remote=${selectedUser.id}`,
      });
    }

    return () => {
      history.push({
        search: '',
      });
    };
  }, [selectedUser?.id, history]);
}

function _useNewMessagesSideEffect({
  profile,
  users,
  selectedUser,
}: {
  profile: Profile;
  users: AppUser[];
  selectedUser: AppUser | null;
}) {
  const myDiscussions = useMyDiscussions(profile.uid!);
  const messageReceivedSideEffect = useMessageReceived();

  useEffect(() => {
    function onNewMessage(message: AppMessage) {
      if (
        message.sender_id !== profile.uid &&
        (!document.hasFocus() || selectedUser?.id !== message.sender_id)
      ) {
        messageReceivedSideEffect.notify(
          message.sender_id,
          users.find((user) => user.id === message.sender_id)?.nickname ?? ''
        );
      }
    }

    for (const id of myDiscussions) {
      createOrGetMessagesFetcher(
        profile.uid!,
        id
      ).addNewMessageReceivedListener(onNewMessage);
    }

    return () => {
      for (const id of myDiscussions) {
        createOrGetMessagesFetcher(
          profile.uid!,
          id
        ).removeNewMessageReceivedListener(onNewMessage);
      }
    };
  }, [
    messageReceivedSideEffect,
    myDiscussions,
    profile.uid,
    selectedUser?.id,
    users,
  ]);
}
