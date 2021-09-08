import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Chat } from '../components/chat/Chat';
import { Column, Row } from '../components/Flex';
import {
  UsersListDesktop,
  UsersListMobile,
} from '../components/users/UsersList';
import { useProfileNotifier } from '../hooks/useAuth';
import { useFetchChat } from '../hooks/useFetchChat';
import { useFetchUsers } from '../hooks/useFetchUsers';
import { AppUser } from '../models/user';
import MediaQuery from 'react-responsive';
import { useCallsManager } from '../utils/calls_manager';
import { CallWidget } from '../components/call/call_widget';
import { messaging } from '../firebase';
import { client } from '../db';

export function MainPage() {
  const history = useHistory();
  const { search: urlParams } = useLocation();
  const profile = useProfileNotifier();

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const { users } = useFetchUsers(profile.uid!);

  const { chat, loading: fetchingChat } = useFetchChat({
    uid: profile.uid!,
    remoteUid: selectedUser?.id,
  });

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
  }, [urlParams, users]);

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

  useEffect(() => {
    if (profile.uid && users) {
      const id = setTimeout(async () => {
        try {
          const token = await messaging.getToken();

          const { data } = await client
            .from<{ id: number; user_id: string; token: string }>('push_tokens')
            .insert({
              user_id: profile.uid!,
              token,
            });

          if (data) {
            window.localStorage.setItem('push_id', data[0].id.toString());
          }
        } catch (e) {
          console.log(e);
        }
      }, 1000);

      const onMessageFromServiceWorker = (event: MessageEvent) => {
        if (event.data.type === 'focus-chat') {
          setSelectedUser(
            users.find((user) => user.id === event.data.senderId) ?? null
          );
        }
      };

      window.navigator.serviceWorker.addEventListener(
        'message',
        onMessageFromServiceWorker
      );

      return () => {
        clearTimeout(id);
        window.navigator.serviceWorker.removeEventListener(
          'message',
          onMessageFromServiceWorker
        );
      };
    }
  }, [profile.uid, users]);

  return (
    <>
      <MediaQuery maxWidth={600}>
        <div className="overflow-hidden h-full p-2">
          <Column
            crossAxis="items-stretch"
            mainAxis="justify-start"
            className="h-full gap-2"
          >
            <UsersListMobile
              users={users}
              onUserSelected={setSelectedUser}
              selectedUser={selectedUser}
              key="users-list"
            />

            <div className="overflow-hidden h-full flex-grow">
              {!selectedUser && (
                <div className="text-center p-2 font-bold">
                  Select someone to talk!
                </div>
              )}
              {fetchingChat && (
                <Column mainAxis="justify-center">Loading chat..</Column>
              )}
              {chat && selectedUser && (
                <Chat key={chat.id} chat={chat} remoteUser={selectedUser!} />
              )}
            </div>
          </Column>
        </div>
      </MediaQuery>

      <MediaQuery minWidth={600}>
        <Row crossAxis="items-stretch" className="h-full overflow-y-hidden">
          <div className="flex-grow py-2 pl-2">
            {!selectedUser && (
              <div className="text-center font-bold">
                Select someone to talk!
              </div>
            )}
            {fetchingChat && (
              <Column mainAxis="justify-center">Loading chat..</Column>
            )}
            {chat && selectedUser && (
              <Chat key={chat.id} chat={chat} remoteUser={selectedUser!} />
            )}
          </div>

          <UsersListDesktop
            key="users-list"
            users={users}
            onUserSelected={setSelectedUser}
            selectedUser={selectedUser}
          />
        </Row>
      </MediaQuery>

      <CallWidget />
    </>
  );
}
