import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8080/ws';

export function useChatSocket(conversationId, onMessage) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!conversationId) return undefined;

    const token = localStorage.getItem('token');
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
          try {
            handlerRef.current?.(JSON.parse(frame.body));
          } catch {
            // bo qua frame khong hop le
          }
        });
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [conversationId]);
}
