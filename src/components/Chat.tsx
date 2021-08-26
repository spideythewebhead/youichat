import React, { useCallback, useState } from 'react';
import { client } from '../db';
import { useLogState, useProfileNotifier } from '../hooks/useAuth';
import { useFetchMessages } from '../hooks/useFetchMessages';
import { AppChat } from '../models/chat';
import { AppUser } from '../models/user';
import { Column, Row } from './Flex';
import { ReplyIcon } from '@heroicons/react/solid';
import { IconButton } from './IconButton';
import { Avatar } from './Avatar';
import { AppMessage, DBReaction } from '../models/message';
import { TextButton } from './Button';
import { ProfileNotifier } from '../models/profile';
import { emoji, emojiName } from '../models/emojis';
import { EmojiHappyIcon } from '@heroicons/react/outline';

export function Chat({
  chat,
  remoteUser,
}: {
  chat: AppChat;
  remoteUser: AppUser;
}) {
  const logState = useLogState();

  const uid = logState.session!.user!.id;

  const onSendMessage = useCallback(
    async (message: string) => {
      const body = message.trim();

      if (!body) return;

      await client.from<AppMessage>('messages').insert({
        discussion_id: chat.id,
        sender_id: uid,
        body,
      });
    },
    [chat.id, uid]
  );

  return (
    <Column crossAxis="items-stretch" mainAxis="justify-start">
      <div className="overflow-hidden flex-grow">
        <ChatList chat={chat} remoteUser={remoteUser} />
      </div>

      <MessageCreator onSendMessage={onSendMessage} />
    </Column>
  );
}

export function ChatList({
  chat,
  remoteUser,
}: {
  chat: AppChat;
  remoteUser: AppUser;
}) {
  const profile = useProfileNotifier();

  const {
    loading: loadingMessages,
    messages,
    onLoadMore,
  } = useFetchMessages({
    uid: profile.uid!,
    discussionId: chat.id,
  });

  const onFetchMoreMessages = useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      if (
        event.currentTarget.scrollHeight -
          (event.currentTarget.scrollTop + event.currentTarget.offsetHeight) <
        200
      ) {
        onLoadMore();
      }
    },
    [onLoadMore]
  );

  const getUserNickname = useCallback(
    (id: string) => {
      if (id === remoteUser.id) return remoteUser.nickname;

      return profile.publicData?.user?.nickname ?? null;
    },
    [remoteUser, profile]
  );

  const getAvatar = useCallback(
    (id: string) => {
      if (id === remoteUser.id) return remoteUser.image_url;

      return profile.publicData?.user?.image_url ?? null;
    },
    [remoteUser, profile]
  );

  return (
    <div className="overflow-y-auto h-full" onScroll={onFetchMoreMessages}>
      {messages?.map((message) => (
        <Message
          key={message.id}
          getAvatar={getAvatar}
          getUserNickname={getUserNickname}
          message={message}
          profile={profile}
        />
      ))}
    </div>
  );
}

export function MessageCreator({
  onSendMessage,
}: {
  onSendMessage: (message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState<string>('');

  const clearMessage = useCallback(() => setMessage(''), []);

  return (
    <Row className="space-x-2 shadow-md rounded-md bg-primary px-2 flex-shrink-0 mt-2">
      <textarea
        placeholder="Your message.."
        className="flex-grow resize-none bg-transparent outline-none"
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (!message) return;

          if (e.key === 'Escape') {
            clearMessage();
          }

          if (!e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            onSendMessage(message);
            clearMessage();
          }
        }}
      ></textarea>

      <IconButton
        disabled={!message}
        onClick={() => {
          onSendMessage(message);
          clearMessage();
        }}
        title="reply"
      >
        <ReplyIcon className="h-6 w-6 p-1" />
      </IconButton>
    </Row>
  );
}

export function Message({
  message,
  profile,
  getUserNickname,
  getAvatar,
}: {
  message: AppMessage;
  profile: ProfileNotifier;
  getUserNickname: (uid: string) => string | null;
  getAvatar: (uid: string) => string | null;
}) {
  return (
    <Row>
      <Column
        axisSize="min"
        crossAxis="items-start"
        className="hover:bg-primary bg-opacity-75 text-start rounded-md p-1 flex-grow"
      >
        <Row className="gap-2">
          <Avatar
            key={message.sender_id}
            size="sm"
            imageUrl={getAvatar(message.sender_id)}
          />
          <div className="text-base whitespace-pre-wrap leading-5">
            {message.body}
          </div>
        </Row>
        <span className="text-xs text-gray-400">
          {message.createdAt.toLocaleString()} •{' '}
          {getUserNickname(message.sender_id)}
        </span>

        {message.anyReactions() && (
          <Column
            crossAxis="items-start"
            axisSize="min"
            className="my-2 mb-1 text-xs"
          >
            <span className="text-gray-400">Reactions</span>

            {emojiName
              .filter((name) => message.hasAnyReaction(name))
              .map((name, i) => (
                <span
                  key={`${name}_${message.id}`}
                  className={`text-gray-50 text-xs text-start px-2 py-1 rounded-full
                      ${
                        message.hasReactionFromUser(profile.uid!)
                          ? 'border-purple-400 bg-purple-400 bg-opacity-75 '
                          : ''
                      }`}
                >
                  {message.reactions[name].length} • {emoji[i]}
                </span>
              ))}
          </Column>
        )}
      </Column>

      <IconButton
        onClick={async () => {
          const uid = profile.uid;

          if (!uid) return;

          if (message.hasReactionFromUser(profile.uid!)) {
            await client
              .from<DBReaction>('reactions')
              .delete()
              .eq(
                'id',
                message.reactions['smiley'].find(
                  (r) => r.user_id === profile.uid!
                )!.id
              );
            return;
          }

          await client.from<DBReaction>('reactions').insert({
            reaction: 'smiley',
            message_id: message.id,
            user_id: uid,
            discussion_id: message.discussion_id,
          });
        }}
        className="group"
      >
        <EmojiHappyIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-100" />
      </IconButton>
    </Row>
  );
}
