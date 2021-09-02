import Peer from 'peerjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../../hooks/useModal';
import {
  useCameraPermission,
  useMicrophonePermission,
} from '../../hooks/useRecordAudio';
import {
  CallEndedEvent,
  IncomingCallEvent,
  OutgoingCallEvent,
  useCallsManager,
} from '../../utils/calls_manager';
import { ElevatedButton, TextButton } from '../Button';
import { Card, CardTitle } from '../Card';
import { Column, Row } from '../Flex';
import { IconButton } from '../IconButton';
import { MicrophoneIcon, VolumeUpIcon } from '@heroicons/react/solid';

interface CallStateWrapper {
  call: Peer.MediaConnection;
  isOutgoing: boolean;
}

export function CallWidget() {
  const requestMicrophonePermission = useMicrophonePermission();
  const requestCameraPermission = useCameraPermission();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [call, setCall] = useState<CallStateWrapper | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const callsManager = useCallsManager();

  const onIncomingCall: IncomingCallEvent = useCallback((call) => {
    setCall({ call, isOutgoing: false });

    call.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      }, 0);
    });

    call.on('close', () => {
      setCall(null);
      setRemoteStream(null);
    });
  }, []);

  const onOutgoingCall: OutgoingCallEvent = useCallback((call, localStream) => {
    setCall({ call, isOutgoing: true });
    setLocalStream(localStream);

    call.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
    });

    call.on('close', () => {
      setCall(null);
      setRemoteStream(null);
    });
  }, []);

  const onCallEnded: CallEndedEvent = useCallback(() => {
    setCall(null);
    setRemoteStream(null);
    setLocalStream(null);
  }, []);

  useEffect(() => {
    if (localStream) {
      return () => {
        localStream.getTracks().forEach((t) => t.stop());
      };
    }
  }, [localStream]);

  useEffect(() => {
    if (callsManager) {
      callsManager.addEventListener('incoming_call', onIncomingCall);
      callsManager.addEventListener('outgoing_call', onOutgoingCall);
      callsManager.addEventListener('call_ended', onCallEnded);

      return () => {
        callsManager.removeEventListener('incoming_call', onIncomingCall);
        callsManager.removeEventListener('outgoing_call', onOutgoingCall);
        callsManager.removeEventListener('call_ended', onCallEnded);
      };
    }
  }, [callsManager, onCallEnded, onIncomingCall, onOutgoingCall]);

  return (
    <Modal open={!!call || !!remoteStream} dismissableOnClick={false}>
      {call && !call.isOutgoing && !remoteStream && (
        <Column mainAxis="justify-center" className="text-white">
          <Card>
            <CardTitle title="Incoming Call" />

            <Row mainAxis="justify-center" className="gap-1">
              <TextButton onClick={() => call.call.close()}>Decline</TextButton>

              <ElevatedButton
                onClick={() => {
                  if (call.call.metadata['type'] === 'audio') {
                    requestMicrophonePermission().then((stream) => {
                      call.call.answer(stream);
                      setLocalStream(stream);
                    });
                  } else {
                    requestCameraPermission().then((stream) => {
                      call.call.answer(stream);
                      setLocalStream(stream);
                    });
                  }
                }}
              >
                Answer
              </ElevatedButton>
            </Row>
          </Card>
        </Column>
      )}

      {call && call.isOutgoing && !remoteStream && (
        <Column mainAxis="justify-center" className="text-white">
          <Card>
            <CardTitle title="Outgoing Call" />

            <Row mainAxis="justify-center" className="gap-1">
              <TextButton
                onClick={() => {
                  call.call.close();
                }}
              >
                Terminate
              </TextButton>
            </Row>
          </Card>
        </Column>
      )}

      {remoteStream && call && call.call.metadata['type'] === 'audio' && (
        <AudioCall
          localStream={localStream!}
          remoteStream={remoteStream}
          call={call}
        />
      )}

      {remoteStream && call && call.call.metadata['type'] === 'video' && (
        <VideoCall
          localStream={localStream!}
          remoteStream={remoteStream}
          call={call}
        />
      )}
    </Modal>
  );
}

function AudioCall({
  localStream,
  remoteStream,
  call,
}: {
  localStream: MediaStream;
  remoteStream: MediaStream;
  call: CallStateWrapper;
}) {
  const audioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      if (node) {
        node.srcObject = remoteStream;
      }
    },
    [remoteStream]
  );

  return (
    <Column mainAxis="justify-center" className="text-white">
      <Card>
        <CardTitle title="In Call" />

        <Row mainAxis="justify-center">
          <audio ref={audioRef} autoPlay></audio>

          <TextButton onClick={() => call?.call?.close()}>Terminate</TextButton>
        </Row>
      </Card>
    </Column>
  );
}

function VideoCall({
  localStream,
  remoteStream,
  call,
}: {
  localStream: MediaStream;
  remoteStream: MediaStream;
  call: CallStateWrapper;
}) {
  const [mutedAudio, setMutedAudio] = useState(false);
  const [mutedMic, setMutedMic] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const videoRefCb = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && !node.srcObject) {
        node.srcObject = remoteStream;
      }

      setVideoRef(node);
    },
    [remoteStream]
  );

  return (
    <Column mainAxis="justify-center" className="text-white">
      <Card>
        <CardTitle title="In Call" />

        <Column className="gap-2">
          <div className="relative max-h-96">
            <div className="overflow-hidden h-full rounded-md">
              <video
                className="object-fill h-full"
                ref={videoRefCb}
                autoPlay
                // playsInline
              ></video>
            </div>

            <div className="absolute bottom-2 left-0 right-2">
              <Row mainAxis="justify-end" className="gap-1">
                <IconButton
                  className={`${mutedMic ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  onClick={() => {
                    localStream.getAudioTracks().forEach((track) => {
                      console.log(track);
                      track.enabled = mutedMic;
                    });

                    setMutedMic(!mutedMic);
                  }}
                >
                  <MicrophoneIcon className="h-6 w-6 p-1" />
                </IconButton>

                <IconButton
                  className={`${
                    mutedAudio ? 'bg-red-500 hover:bg-red-600' : ''
                  }`}
                  onClick={() => {
                    if (videoRef) {
                      videoRef.muted = !mutedAudio;
                      setMutedAudio(!mutedAudio);
                    }
                  }}
                >
                  <VolumeUpIcon className="h-6 w-6 p-1" />
                </IconButton>
              </Row>
            </div>
          </div>

          <TextButton onClick={() => call?.call?.close()}>Terminate</TextButton>
        </Column>
      </Card>
    </Column>
  );
}
