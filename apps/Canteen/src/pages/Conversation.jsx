import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Textarea, Field } from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import RecipeCard from "../components/RecipeCard";

const Conversation = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    currentConversation,
    getConversation,
    sendMessage,
    markMessagesAsRead,
    messagesLoading,
    canteenApi,
  } = useData();

  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (id) {
      getConversation(id);
      canteenApi.fetchUser(id).then(setOtherUser).catch(console.error);
    }
  }, [id, getConversation, canteenApi]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [currentConversation, messagesLoading]);

  useEffect(() => {
    if (currentConversation.length > 0 && user) {
      const unreadIds = currentConversation
        .filter(
          (msg) => String(msg.receiver_id) === String(user.canteenId) && !msg.is_read,
        )
        .map((msg) => msg.id);

      if (unreadIds.length > 0) {
        markMessagesAsRead(unreadIds);
      }
    }
  }, [currentConversation, user, markMessagesAsRead]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    try {
      await sendMessage(id, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const displayConversation = [...currentConversation].reverse();

  return (
    <div className="flex flex-col p-0 w-full h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] md:w-4/5">
      <div className="border-grey bg-primary/10 flex items-center gap-4 border-b p-4">
        <Link
          to="/messages"
          className="text-white hover:text-accent text-xl transition-colors"
        >
          ←
        </Link>
        <h3 className="font-mono text-lg font-bold text-white">
          {otherUser?.username || "Chat"}
        </h3>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-scroll p-4"
      >
        {messagesLoading && (
          <div className="text-lightGrey animate-pulse text-center text-sm">
            Loading...
          </div>
        )}
        {displayConversation.map((msg) => {
          const isMe = String(msg.sender_id) === String(user.canteenId);
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] p-3 ${
                  isMe ? "bg-accent text-white" : "bg-grey text-dark"
                }`}
              >
                {msg.recipe && (
                  <div className="mb-2 max-w-sm sm:min-w-64">
                    <RecipeCard recipe={msg.recipe} inverse={true} />
                  </div>
                )}
                {msg.content && (
                  <p className="font-mono text-sm whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
                <span
                  className={`mt-1 block text-[10px] ${isMe ? "text-white/70" : "text-dark/70"}`}
                >
                  {formatDate(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="border-grey bg-primary/10 border-t p-4"
      >
        <div className="flex gap-2">
          <Field className="w-full">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-dark border-grey focus:border-accent h-12 w-full resize-none border p-2 text-white focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </Field>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-accent hover:bg-accent/80 h-12 px-4 font-bold text-white transition-colors disabled:opacity-50"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Conversation;
