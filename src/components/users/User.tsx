import React from 'react';
import { AppUser } from '../../models/user';
import { Avatar } from '../Avatar';
import { Row } from '../Flex';
import { IconButton } from '../IconButton';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/solid';

export function UserWidgetMobile({
  user,
  onClick,
  active,
}: {
  user: AppUser;
  onClick?: VoidFunction;
  active?: boolean;
}) {
  return (
    <button
      className={`
      px-2 py-1
      rounded-md
      text-left text-sm text-gray-50
      filter
      min-w-user-mobile
      ${active ? 'bg-button' : ''}
      ${active ? 'hover:brightness-110' : 'hover:bg-scaffold'}
      flex flex-col gap-1 items-center
      `}
      onClick={onClick}
    >
      <Avatar size="md" imageUrl={user.image_url} />
      {user.nickname}
    </button>
  );
}

export function UserWidgetDesktop({
  user,
  onClick,
  onAudioButtonClick,
  onVideoButtonClick,
  active,
}: {
  user: AppUser;
  onClick?: VoidFunction;
  onAudioButtonClick?: VoidFunction;
  onVideoButtonClick?: VoidFunction;
  active?: boolean;
}) {
  return (
    <Row className="gap-1">
      <button
        className={`
        flex-grow
        px-2 py-1
        rounded-md
        text-left
        filter
        ${active ? 'bg-button' : ''}
        ${active ? 'hover:brightness-110' : 'hover:bg-scaffold'}
        flex flex-row gap-2 items-center
        `}
        onClick={onClick}
      >
        <Avatar imageUrl={user.image_url} />
        {user.nickname}
      </button>

      <IconButton title="audio call" onClick={onAudioButtonClick}>
        <PhoneIcon className="h-6 w-6 p-1" />
      </IconButton>

      <IconButton title="video call" onClick={onVideoButtonClick}>
        <VideoCameraIcon className="h-6 w-6 p-1" />
      </IconButton>
    </Row>
  );
}
