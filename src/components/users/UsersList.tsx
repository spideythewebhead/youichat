import React from 'react';
import {
  useCameraPermission,
  useMicrophonePermission,
} from '../../hooks/useRecordAudio';
import { AppUser } from '../../models/user';
import { useCallsManager } from '../../utils/calls_manager';
import { Column, Row } from '../Flex';
import { Hint } from '../Hint';
import { UserWidgetDesktop, UserWidgetMobile } from './User';

export function UsersListMobile({
  users,
  onUserSelected,
  selectedUser,
}: {
  users: AppUser[];
  selectedUser: AppUser | null;
  onUserSelected: (user: AppUser | null) => void;
}) {
  const renderUsers = users.map((user) => {
    return (
      <UserWidgetMobile
        key={user.id}
        user={user}
        active={user === selectedUser}
        onClick={() => {
          if (user === selectedUser) {
            onUserSelected(null);
            return;
          }

          onUserSelected(user);
        }}
      />
    );
  });

  return (
    <div className="">
      <div
        className=" shadow-md
          rounded-md
          bg-primary"
      >
        <Row className={`gap-1 overflow-x-auto p-2`} mainAxis="justify-start">
          {renderUsers}
          {users.length === 0 && (
            <Column mainAxis="justify-center">
              <Hint text="No users to chat.. yet!" />
            </Column>
          )}
        </Row>
      </div>
    </div>
  );
}

export function UsersListDesktop({
  users,
  onUserSelected,
  selectedUser,
}: {
  users: AppUser[];
  selectedUser: AppUser | null;
  onUserSelected: (user: AppUser | null) => void;
}) {
  const callsManager = useCallsManager();
  const requestMicrophonePermission = useMicrophonePermission();
  const requestCameraPermission = useCameraPermission();

  const renderUsers = users.map((user) => {
    return (
      <UserWidgetDesktop
        key={user.id}
        user={user}
        active={user === selectedUser}
        onClick={() => {
          if (user === selectedUser) {
            onUserSelected(null);
            return;
          }

          onUserSelected(user);
        }}
        onAudioButtonClick={() => {
          requestMicrophonePermission().then((stream) => {
            callsManager?.call(user.id, stream);
          });
        }}
        onVideoButtonClick={() => {
          requestCameraPermission().then((stream) => {
            callsManager?.call(user.id, stream);
          });
        }}
      />
    );
  });

  return (
    <div className="p-2">
      <Column
        className={`
      p-2 space-y-1
      w-48
      shadow-md
      rounded-md
      bg-primary
      overflow-y-auto
      min-w-users-list
      `}
        crossAxis="items-stretch"
      >
        {renderUsers}

        {users.length === 0 && (
          <Column mainAxis="justify-center">
            <Hint text="No users to chat.. yet!" />
          </Column>
        )}
      </Column>
    </div>
  );
}
