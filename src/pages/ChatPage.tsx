import ChatAssistant from "@/components/ChatAssistant";

const ChatPage = () => {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pb-20 md:pb-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Travel Chat</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Ask your AI travel assistant anything about your trip
        </p>
      </div>
      <ChatAssistant />
    </div>
  );
};

export default ChatPage;
