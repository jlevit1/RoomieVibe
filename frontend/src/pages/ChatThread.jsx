import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatConversation from '../components/ChatConversation';
import ConversationList from '../components/ConversationList';

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(null);

  const handleActivity = useCallback((count) => setMessageCount(count), []);

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem-1px)] max-w-7xl">
      <aside className="hidden w-[22rem] flex-shrink-0 border-x border-gray-200 lg:block">
        <ConversationList activeId={Number(id)} refreshKey={`${id}-${messageCount}`} />
      </aside>

      <section className="min-w-0 flex-1 lg:border-r lg:border-gray-200">
        <ChatConversation
          key={id}
          conversationId={id}
          onBack={() => navigate('/messages')}
          onActivity={handleActivity}
        />
      </section>
    </div>
  );
}
