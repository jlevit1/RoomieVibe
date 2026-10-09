import ConversationList from '../components/ConversationList';

export default function Messages() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem-1px)] max-w-7xl">
      <aside className="w-full flex-shrink-0 border-gray-200 lg:w-[22rem] lg:border-x">
        <ConversationList />
      </aside>
      <section className="hidden flex-1 flex-col items-center justify-center border-r border-gray-200 bg-gray-50 px-6 text-center lg:flex">
        <p className="font-semibold text-gray-900">Chọn một cuộc trò chuyện</p>
        <p className="mt-1 max-w-sm text-sm text-gray-600">
          Tin nhắn với chủ nhà và bạn ở ghép hiện ở đây. Yêu cầu đặt cọc cũng được gửi và thanh toán ngay trong cuộc trò
          chuyện.
        </p>
      </section>
    </div>
  );
}
