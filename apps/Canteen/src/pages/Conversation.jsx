import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Field, Textarea } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import {
  fetchConversation,
  fetchRecipes,
  fetchUser,
  markMessagesAsRead,
  sendMessage,
} from "@shared/core/services/canteenApi";

import RecipeCard from "../components/RecipeCard";

const Conversation = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = useState("");
  const scrollContainerRef = useRef(null);

  const { data: conversationPartner } = useQuery({
    queryKey: ["conversationPartner", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });

  const { data: currentConversation = [], isLoading: conversationLoading } = useQuery({
    queryKey: ["conversations", id],
    queryFn: async () => {
      const conversation = await fetchConversation(id);
      const recipeIds = [...new Set(conversation.map((msg) => msg.recipe_id).filter(Boolean))];

      if (recipeIds.length > 0) {
        const fetchedRecipes = await fetchRecipes(
          recipeIds.length,
          0,
          undefined,
          undefined,
          undefined,
          recipeIds,
        );
        const recipesMap = {};
        for (const recipe of fetchedRecipes) {
          recipesMap[String(recipe.id)] = recipe;
        }
        for (const msg of conversation) {
          if (msg.recipe_id && recipesMap[String(msg.recipe_id)]) {
            msg.recipe = recipesMap[String(msg.recipe_id)];
          }
        }
      }
      return conversation;
    },
    enabled: !!id,
  });

  const { mutate: mutateMarkMessagesAsRead } = useMutation({
    mutationFn: (unreadIds) => markMessagesAsRead(unreadIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", id] }),
  });

  const handleSendMutation = useMutation({
    mutationFn: ({ id, newMessage }) => sendMessage(id, newMessage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", id] }),
  });

  useEffect(() => {
    if (currentConversation.length > 0 && user) {
      const unreadIds = currentConversation
        .filter((msg) => String(msg.receiver_id) === String(user.canteenId) && !msg.is_read)
        .map((msg) => msg.id);

      if (unreadIds.length > 0) {
        mutateMarkMessagesAsRead(unreadIds);
      }
    }
  }, [currentConversation, user, mutateMarkMessagesAsRead]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [currentConversation, conversationLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    try {
      await handleSendMutation.mutateAsync({ id, newMessage });
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
          className="text-white hover:text-accent font-icons icon text-2xl transition-colors"
        >
          D
        </Link>
        <h3 className="font-mono text-lg font-bold text-white">
          {conversationPartner?.username || "Chat"}
        </h3>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-scroll p-4"
      >
        {conversationLoading && (
          <div className="text-lightGrey animate-pulse text-center text-sm">Loading...</div>
        )}
        {displayConversation.map((msg) => {
          const isMe = String(msg.sender_id) === String(user.canteenId);
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] p-3 ${isMe ? "bg-accent text-dark" : "bg-grey text-dark"}`}
              >
                {msg.recipe && (
                  <div className="mb-2 max-w-sm sm:min-w-64">
                    <RecipeCard recipe={msg.recipe} inverse={true} />
                  </div>
                )}
                {msg.content && (
                  <p className="font-mono text-sm whitespace-pre-wrap">{msg.content}</p>
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

      <form onSubmit={handleSend} className="border-grey bg-primary/10 border-t p-4">
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
            className="bg-accent hover:bg-accent/80 h-12 px-4 font-bold text-dark transition-colors disabled:opacity-50"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Conversation;
