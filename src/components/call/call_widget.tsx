import Peer from 'peerjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../../hooks/useModal';
import { useMicrophonePermission } from '../../hooks/useRecordAudio';
import {
  CallEndedEvent,
  IncomingCallEvent,
  OutgoingCallEvent,
  useCallsManager,
} from '../../utils/calls_manager';
import { ElevatedButton, TextButton } from '../Button';
import { Card, CardTitle } from '../Card';
import { Column, Row } from '../Flex';

export function CallWidget() {
  const requestMicrophonePermission = useMicrophonePermission();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [call, setCall] = useState<{
    call: Peer.MediaConnection;
    isOutgoing: boolean;
  } | null>(null);

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

  const onOutgoingCall: OutgoingCallEvent = useCallback((call) => {
    setCall({ call, isOutgoing: true });

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
            <CardTitle title="INCOMING CALL" />

            <Row mainAxis="justify-center">
              <TextButton onClick={() => call.call.close()}>Decline</TextButton>

              <ElevatedButton
                onClick={() => {
                  requestMicrophonePermission().then((stream) => {
                    call.call.answer(stream);
                    setLocalStream(stream);
                  });
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
            <CardTitle title="OUTGOING CALL" />

            <Row mainAxis="justify-center">
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

      {remoteStream && (
        <Column mainAxis="justify-center" className="text-white">
          <Card>
            <CardTitle title="In Call" />

            <Row mainAxis="justify-center">
              <audio ref={audioRef} autoPlay></audio>

              <TextButton onClick={() => call?.call?.close()}>
                Terminate
              </TextButton>
            </Row>
          </Card>
        </Column>
      )}
    </Modal>
  );
}
