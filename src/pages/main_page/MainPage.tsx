import React from 'react';
import { Chat } from '../../components/chat/Chat';
import { Column, Row } from '../../components/Flex';
import {
  UsersListDesktop,
  UsersListMobile,
} from '../../components/users/UsersList';
import MediaQuery from 'react-responsive';
import { CallWidget } from '../../components/call/call_widget';
import { useMainPageBloc } from './useMainPageBloc';
import { Droppable } from '../../components/Droppable';

export function MainPage() {
  const state = useMainPageBloc();

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
              users={state.users}
              onUserSelected={state.user.setRemote}
              selectedUser={state.user.remote}
              key="users-list"
            />

            <div className="overflow-hidden h-full flex-grow">
              {!state.user.remote && (
                <div className="text-center p-2 font-bold">
                  Select someone to talk!
                </div>
              )}
              {state.chat.isLoading && (
                <Column mainAxis="justify-center">Loading chat..</Column>
              )}
              {state.chat.current && state.user.remote && (
                <Chat
                  key={state.chat.current.id}
                  chat={state.chat.current}
                  remoteUser={state.user.remote}
                />
              )}
            </div>
          </Column>
        </div>
      </MediaQuery>

      <MediaQuery minWidth={600}>
        <Row crossAxis="items-stretch" className="h-full overflow-y-hidden">
          <div className="flex-grow py-2 pl-2">
            {!state.user.remote && (
              <div className="text-center font-bold">
                Select someone to talk!
              </div>
            )}
            {state.chat.isLoading && (
              <Column mainAxis="justify-center">Loading chat..</Column>
            )}
            {state.chat.current && state.user.remote && (
              <Chat
                key={state.chat.current.id}
                chat={state.chat.current}
                remoteUser={state.user.remote!}
              />
            )}
          </div>

          <UsersListDesktop
            key="users-list"
            users={state.users}
            onUserSelected={state.user.setRemote}
            selectedUser={state.user.remote}
          />
        </Row>
      </MediaQuery>

      <CallWidget />
    </>
  );
}
