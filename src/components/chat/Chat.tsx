import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { client } from '../../db';
import { useProfileNotifier } from '../../hooks/useAuth';
import { useFetchMessages } from '../../hooks/useFetchMessages';
import { AppChat } from '../../models/chat';
import { AppUser } from '../../models/user';
import { Column, Row } from '../Flex';
import { IconButton } from '../IconButton';
import { Avatar } from '../Avatar';
import { AppMessage, DBReaction, EmojiType } from '../../models/message';
import { ProfileNotifier } from '../../models/profile';
import { emojis, emojiName } from '../../models/emojis';
import { EmojiHappyIcon } from '@heroicons/react/outline';
import ReactDOM from 'react-dom';
import { useMemo } from 'react';
import { MessageCreator } from './MessageCreator';
import { Modal } from '../../hooks/useModal';
import { useCacheDb } from '../../utils/web_db';
import { emojiMatchReplace, emojiRegExp } from './emojified';

export function Chat({
  chat,
  remoteUser,
}: {
  chat: AppChat;
  remoteUser: AppUser;
}) {
  const cacheDb = useCacheDb();
  const profile = useProfileNotifier();

  const uid = profile.uid!;

  const onSendMessage = useCallback(
    async (body: AppMessage['body']) => {
      const data = { ...body };

      if (data.type === 'text') {
        data.value = data.value.trim().substr(0, 200);

        if (!data.value) {
          return;
        }
      }

      if (data.type === 'audio') {
        if (data.value instanceof Blob) {
          const blob = data.value;

          const { data: response, error } = await client.storage
            .from('chats')
            .upload(`${chat.id}/${Date.now()}.mp3`, blob, {
              upsert: true,
            });

          if (error) {
            return;
          }

          if (response) {
            const key = response.Key.replace('chats/', '');

            cacheDb?.put(key, blob);
            data.value = key;
          }
        }
      }

      if (data.type === 'image' || data.type === 'video') {
        if (data.value instanceof File) {
          const file = data.value;

          if (data.value.size / 1024 / 1024 >= 5) {
            return;
          }

          const [, ext] = data.value.name.split('.');

          const { data: response, error } = await client.storage
            .from('chats')
            .upload(`${chat.id}/${Date.now()}.${ext}`, file, {
              upsert: true,
            });

          if (error) {
            return;
          }

          if (response) {
            const key = response.Key.replace('chats/', '');

            cacheDb?.put(key, file);
            data.value = key;
          }
        }
      }

      await client.from<AppMessage>('messages').insert({
        discussion_id: chat.id,
        sender_id: uid,
        body: data,
      });
    },
    [chat.id, uid, cacheDb]
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
  const listRef = useRef<HTMLDivElement | null>(null);
  const profile = useProfileNotifier();

  const {
    loading: loadingMessages,
    messages,
    onLoadMore,
  } = useFetchMessages({
    uid: profile.uid!,
    discussionId: chat.id,
  });

  const messagesLength = messages?.length ?? 0;
  useLayoutEffect(() => {
    if (listRef.current && listRef.current.scrollTop >= -150) {
      listRef.current.scrollTo({ top: 0 });
    }
  }, [messagesLength]);

  const onFetchMoreMessages = useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      if (
        event.currentTarget.scrollHeight -
        (-event.currentTarget.scrollTop + event.currentTarget.offsetHeight) <
        300
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
    <div
      ref={listRef}
      className="flex flex-col-reverse overflow-y-auto h-full"
      onScroll={onFetchMoreMessages}
    >
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
  const [emojiParent, setEmojiParent] = useState<HTMLElement | null>(null);

  let messageWidget: React.ReactElement | undefined;

  switch (message.body.type) {
    case 'text':
      messageWidget = (
        <div className=" text-base overflow-hidden break-all max-w-xs md:max-w-full whitespace-pre-line leading-5">
          <TextMessage text={message.body.value} />
        </div>
      );
      break;
    case 'audio':
      messageWidget = <AudioMessage path={message.body.value as string} />;
      break;
    case 'image':
      messageWidget = <ImageMessage path={message.body.value as string} />;
      break;
    case 'video':
      messageWidget = <VideoMessage path={message.body.value as string} />;
      break;
  }

  return (
    <Row>
      <Column
        axisSize="min"
        crossAxis="items-start"
        className="hover:bg-primary bg-opacity-75 text-start rounded-md p-1 flex-grow"
      >
        <Row className="gap-2" crossAxis="items-end">
          <Avatar
            key={message.sender_id}
            size="md"
            imageUrl={getAvatar(message.sender_id)}
            className="flex-none"
          />
          {messageWidget}
        </Row>
        <span className="text-xs text-gray-400">
          {message.createdAt.toLocaleString()} •{' '}
          {getUserNickname(message.sender_id)}
        </span>

        {message.anyReactions() && (
          <div className="my-2 mb-1 text-xs">
            <Row className="gap-1" wrap="flex-wrap">
              {emojiName
                // .filter((name) => message.hasAnyReaction(name))
                .map((emoji, i) => {
                  if (!message.hasAnyReaction(emoji)) return;

                  return (
                    <span
                      key={`${emoji}_${message.id}`}
                      className={`text-gray-50 text-xs text-start px-2 py-1 rounded-full
                        ${message.hasReactionFromUser(profile.uid!, emoji)
                          ? 'border-purple-400 bg-secondary bg-opacity-75'
                          : 'border-purple-400 border'
                        }`}
                    >
                      {message.reactions[emoji].length} • {emojis[i]}
                    </span>
                  );
                })}
            </Row>
          </div>
        )}
      </Column>

      <IconButton
        onMouseUp={(e) => {
          e.stopPropagation();

          if (emojiParent) {
            setEmojiParent(null);
            return;
          }
          setEmojiParent(e.currentTarget);
        }}
        className="group"
        title="react"
      >
        <EmojiHappyIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-100" />
      </IconButton>

      {emojiParent && (
        <EmojisReactions
          onClose={async (emoji?: EmojiType) => {
            setEmojiParent(null);

            if (emoji) {
              const uid = profile.uid;

              if (!uid) return;

              if (message.hasReactionFromUser(profile.uid!, emoji)) {
                const reaction = message.reactions[emoji].find(
                  (r) => r.user_id === profile.uid!
                );

                if (reaction) {
                  await client
                    .from<DBReaction>('reactions')
                    .delete()
                    .eq('id', reaction.id);
                  return;
                }
              }

              await client.from<DBReaction>('reactions').insert({
                reaction: emoji,
                message_id: message.id,
                user_id: uid,
                discussion_id: message.discussion_id,
              });
            }
          }}
          parent={emojiParent}
        />
      )}
    </Row>
  );
}

function TextMessage({ text }: { text: string }) {
  const emojified = useMemo(() => {
    return text.replaceAll(emojiRegExp, emojiMatchReplace);
  }, [text]);

  const hasLink = useMemo(() => {
    return /(https?|([\d\w]*\.\w{2,}))/.test(emojified);
  }, [emojified]);

  return useMemo(() => {
    if (hasLink) {
      const s = emojified.replaceAll(
        /((https?:\/\/)?(([\d\w_-]*\.[\d\w_-]*){1,}|localhost)(:\d{0,5})?[\d\w@_?=/#%&.-]*)/gim,
        '<a>$1</a>'
      );

      const parts = [];

      let nextSubStartPosition = 0;

      for (let i = 0; i < s.length; ++i) {
        if (s[i] === '<' && s[1 + i] === 'a') {
          const closingAt = s.indexOf('</a>', i);

          parts.push(s.substring(nextSubStartPosition, i));
          nextSubStartPosition = closingAt + 4;

          const url = s.substring(3 + i, closingAt);

          parts.push(
            <a
              className="text-blue-400 filter hover:brightness-110 hover:underline "
              href={url.startsWith('http') ? url : `https://${url}`}
              target="_blank"
            >
              {url}
            </a>
          );

          i = closingAt - 1;
        }
      }

      if (nextSubStartPosition !== s.length) {
        parts.push(s.substr(nextSubStartPosition));
      }

      return <>{parts}</>;
    }

    return <>{emojified}</>;
  }, [hasLink, emojified]);
}

function EmojisReactions({
  parent,
  onClose,
}: {
  parent: HTMLElement;
  onClose: (emoji?: EmojiType) => void;
}) {
  const rect = parent.getBoundingClientRect();
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    setSize(node.getBoundingClientRect());
  }, []);

  const position = useMemo(() => {
    const y = rect.top + rect.height + 4.0;
    let x = 0;

    if (rect.left + size.width >= document.body.clientWidth) {
      x = document.body.clientWidth - 8 - size.width;
    } else {
      x = rect.left - size.width / 2 + rect.width / 2;
    }

    return {
      transform: `translate3d(${x}px, ${y}px, 0)`,
    };
  }, [size, rect]);

  useEffect(() => {
    function onFocus() {
      onClose();
    }

    document.body.addEventListener('mouseup', onFocus);

    return () => {
      document.body.removeEventListener('mouseup', onFocus);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 overflow-hidden"
      onClick={() => onClose()}
    >
      <div
        ref={ref}
        className="absolute p-1 rounded-md bg-secondary filter drop-shadow-md z-20 top-0 left-0 max-w-max"
        style={position}
      >
        <Row axisSize="min">
          {emojis.map((emoji, index) => (
            <button
              key={emoji}
              className="hover:bg-black hover:bg-opacity-20 rounded-md p-2"
              onMouseUp={(e) => {
                onClose(emojiName[index]);
              }}
              title={emojiName[index]}
            >
              <div className="text-sm text-center">{emoji}</div>
            </button>
          ))}
        </Row>
      </div>
    </div>,
    document.body
  );
}

function AudioMessage({ path }: { path: string }) {
  const download = useDownloadChatFile(path);

  if (download.error) return <div>Failed..</div>;
  if (!download.data) return <div>..</div>;

  return <audio src={download.data} controls></audio>;
}

function ImageMessage({ path }: { path: string }) {
  const [openInModal, setOpenInModal] = useState(false);

  const download = useDownloadChatFile(path);

  if (download.error) return <div>Failed..</div>;
  if (!download.data) return <div>..</div>;

  return (
    <>
      <Column
        mainAxis="justify-center"
        crossAxis="items-stretch"
        className="min-w-12"
      >
        <img
          key={download.data}
          className="max-h-80 w-full overflow-hidden rounded-md cursor-pointer min-h-image"
          src={download.data}
          onClick={() => setOpenInModal(true)}
        />
      </Column>
      <Modal
        open={openInModal}
        dismissableOnClick={true}
        onClick={() => setOpenInModal(false)}
      >
        <Column mainAxis="justify-center" className="py-8 px-8">
          <img
            key={download.data}
            className="oveflow-hidden rounded-md"
            src={download.data}
          />
        </Column>
      </Modal>
    </>
  );
}

function VideoMessage({ path }: { path: string }) {
  const download = useDownloadChatFile(path);

  if (download.error) return <div>Failed..</div>;
  if (!download.data) return <div>..</div>;

  return (
    <>
      <Column
        mainAxis="justify-center"
        crossAxis="items-stretch"
        className="min-w-12"
      >
        <video
          key={download.data}
          className="max-h-80 w-full overflow-hidden rounded-md cursor-pointer min-h-image"
          src={download.data}
          controls
        />
      </Column>
    </>
  );
}

function useDownloadChatFile(id: string) {
  const db = useCacheDb();
  const [state, setState] = useState<{
    data?: string;
    error?: any;
  }>({});

  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await db?.get<{
        id: string;
        value: Blob;
      }>(id);

      if (result && result.data) {
        if (mounted) {
          setState({
            data: window.URL.createObjectURL(result.data.value),
          });
        }

        return;
      }

      const { data } = await client.storage.from('chats').download(id);

      if (data) {
        if (mounted) {
          setState({
            data: window.URL.createObjectURL(data),
          });
        }

        await db?.put(id, data);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, db]);

  useEffect(() => {
    if (state.data) {
      return () => {
        window.URL.revokeObjectURL(state.data!);
      };
    }
  }, [state.data]);

  return state;
}
