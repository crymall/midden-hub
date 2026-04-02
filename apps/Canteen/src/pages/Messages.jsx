import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Popover, PopoverButton, PopoverPanel, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";

const Messages = () => {
  const { user } = useAuth();
  const { threads, getThreads, friends, getFriends } = useData();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const hasFetchedFriends = useRef(false);

  useEffect(() => {
    getThreads();
  }, [getThreads]);

  const handleInteraction = () => {
    if (!hasFetchedFriends.current && user) {
      getFriends(user.canteenId, 50, 0, searchQuery);
      hasFetchedFriends.current = true;
    }
  };

  useEffect(() => {
    if (hasFetchedFriends.current && user) {
      getFriends(user.canteenId, 50, 0, searchQuery);
    }
  }, [searchQuery, user, getFriends]);

  return (
    <MiddenCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-gothic text-4xl font-bold text-white">
          Messages
        </h2>
        <Popover>
          <PopoverButton
            onMouseEnter={handleInteraction}
            onClick={handleInteraction}
            className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors focus:outline-none"
          >
            + Message
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: "bottom end", gap: 8, padding: 8 }}
            className="bg-dark border-grey z-50 flex w-[calc(100vw-2rem)] sm:w-72 max-w-[calc(100vw-2rem)] flex-col border p-2 shadow-lg"
          >
            {({ close }) => (
              <Combobox
                onChange={(friend) => {
                  if (friend) {
                    close();
                    navigate(`/messages/${friend.id}`);
                  }
                }}
              >
                <ComboboxInput
                  className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 font-mono focus:outline-none"
                  placeholder="Search friends..."
                  displayValue={(friend) => friend?.username || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <ComboboxOptions static className="mt-2 max-h-60 w-full overflow-auto">
                  {friends?.length === 0 ? (
                    <div className="text-lightGrey p-2 font-mono text-sm">
                      No friends found.
                    </div>
                  ) : (
                    friends?.map((friend) => (
                      <ComboboxOption
                        key={friend.id}
                        value={friend}
                        className="data-focus:bg-accent text-lightestGrey cursor-pointer px-3 py-2 font-mono select-none data-focus:text-white"
                      >
                        {friend.username}
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </Combobox>
            )}
          </PopoverPanel>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        {threads.length === 0 ? (
          <div className="text-lightGrey font-mono text-sm">
            No conversations yet.
          </div>
        ) : (
          threads.map((thread) => {
            const isUnread =
              String(thread.sender_id) !== String(user?.canteenId) && !thread.is_read;

            let threadContent = thread.content;
            if (thread.recipe_id) {
              const senderName =
                String(thread.sender_id) === String(user?.canteenId)
                  ? "You"
                  : thread.other_username;
              threadContent = `${senderName} shared a recipe${
                thread.content ? `: ${thread.content}` : ""
              }`;
            }

            return (
              <Link
                key={thread.other_user_id}
                to={`/messages/${thread.other_user_id}`}
                className={`border-grey hover:border-accent group block border-2 border-dashed p-4 transition-colors ${
                  isUnread ? "bg-accent/10" : ""
                }`}
              >
                <div className="mb-1 flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="group-hover:text-accent font-mono text-lg font-bold text-white transition-colors">
                      {thread.other_username}
                    </span>
                    {isUnread && (
                      <span className="bg-accent h-2 w-2 rounded-full" />
                    )}
                  </div>
                  <span className="text-grey text-xs">
                    {new Date(thread.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p
                  className={`${isUnread ? "text-white font-bold" : "text-lightGrey"} truncate font-mono text-sm`}
                >
                  {threadContent}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </MiddenCard>
  );
};

export default Messages;