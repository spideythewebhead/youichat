import {
  MicrophoneIcon,
  ReplyIcon,
  PhotographIcon,
} from '@heroicons/react/solid';
import React, { useCallback, useState } from 'react';
import { useFilePicker } from '../../hooks/useFilePicker';
import { Modal } from '../../hooks/useModal';
import { AppMessage } from '../../models/message';
import { ElevatedButton, TextButton } from '../Button';
import { Card, CardTitle } from '../Card';
import { Column, Row } from '../Flex';
import { IconButton } from '../IconButton';

export function MessageCreator({
  onSendMessage,
}: {
  onSendMessage: (body: AppMessage['body']) => Promise<void>;
}) {
  const [message, setMessage] = useState<string>('');

  const clearMessage = useCallback(() => setMessage(''), []);

  return (
    <>
      <Row className="space-x-2 shadow-md rounded-md bg-primary px-2 flex-shrink-0 mt-2">
        <textarea
          placeholder="Your message.."
          className="flex-grow resize-none bg-transparent outline-none"
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (!message) return;

            if (e.key === 'Escape') {
              clearMessage();
            }

            if (!e.shiftKey && e.key === 'Enter') {
              e.preventDefault();

              onSendMessage({
                type: 'text',
                value: message,
              });
              clearMessage();
            }
          }}
        ></textarea>

        <AudioRecord onSendMessage={onSendMessage} />

        <ImagePicker onSendMessage={onSendMessage} />

        <IconButton
          disabled={!message}
          onClick={() => {
            onSendMessage({
              type: 'text',
              value: message,
            });
            clearMessage();
          }}
          title="reply"
        >
          <ReplyIcon className="h-6 w-6 p-1" />
        </IconButton>
      </Row>
    </>
  );
}

class AudioRecord extends React.Component<
  {
    onSendMessage: (body: AppMessage['body']) => void;
  },
  {
    mediaRecorder: MediaRecorder | null;
    onSendRecord: ((body: AppMessage['body']) => void) | null;
  }
> {
  constructor(props: AudioRecord['props']) {
    super(props);

    this.state = {
      mediaRecorder: null,
      onSendRecord: null,
    };
  }

  onCreateMediaRecorder() {
    navigator.getUserMedia(
      {
        audio: true,
        video: false,
      },
      (stream) => {
        const recorder = new MediaRecorder(stream);

        recorder.start();

        this.setState({
          mediaRecorder: recorder,
        });

        const chunks: Blob[] = [];

        recorder.addEventListener('dataavailable', (e) => {
          chunks.push(e.data);
        });

        recorder.addEventListener('stop', (e) => {
          recorder.stream.getTracks().forEach((t) => t.stop());

          const blob = new Blob(chunks, {});

          if (this.state.onSendRecord) {
            this.state.onSendRecord({
              type: 'audio',
              value: blob,
            });
          }
        });
      },
      (error) => {}
    );
  }

  render() {
    return (
      <>
        <IconButton
          disabled={!!this.state.mediaRecorder}
          onClick={() => this.onCreateMediaRecorder()}
          title="record audio"
        >
          <MicrophoneIcon className="h-6 w-6 p-1" />
        </IconButton>

        <Modal dismissableOnClick={false}>
          {this.state.mediaRecorder && (
            <Column
              crossAxis="items-center"
              mainAxis="justify-center"
              className="text-white"
            >
              <Card>
                <CardTitle title="Recording audio..." />
                <Row className="gap-1" mainAxis="justify-center">
                  <TextButton
                    onClick={() => {
                      this.state.mediaRecorder?.stop();
                      this.setState({
                        mediaRecorder: null,
                        onSendRecord: null,
                      });
                    }}
                  >
                    Cancel
                  </TextButton>
                  <ElevatedButton
                    onClick={() => {
                      this.setState({
                        mediaRecorder: null,
                        onSendRecord: (body) => this.props.onSendMessage(body),
                      });

                      this.state.mediaRecorder?.stop();
                    }}
                  >
                    Send
                  </ElevatedButton>
                </Row>
              </Card>
            </Column>
          )}
        </Modal>
      </>
    );
  }
}

function ImagePicker({
  onSendMessage,
}: {
  onSendMessage: (body: AppMessage['body']) => void;
}) {
  const filePicker = useFilePicker();

  return (
    <IconButton
      onClick={async () => {
        const file = await filePicker(/\.(png|jpe?g|webp)$/);

        if (file) {
          onSendMessage({
            type: 'image',
            value: file,
          });
        }
      }}
      title="pick image"
    >
      <PhotographIcon className="h-6 w-6 p-1" />
    </IconButton>
  );
}
