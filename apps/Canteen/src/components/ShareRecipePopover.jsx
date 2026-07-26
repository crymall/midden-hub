import { useEffect, useRef, useState } from "react";
import {
  Button,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
  Popover,
  PopoverButton,
  PopoverPanel,
  Textarea,
} from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import { fetchFriends, sendMessage } from "@shared/core/services/canteenApi";

import MiddenModal from "@shared/ui/components/MiddenModal";

const ShareRecipePopover = ({
  recipe,
  className = "",
  buttonClassName = "",
  panelClassName = "",
  label = "Share",
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy Link");
  const copyTimeoutRef = useRef(null);

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", user?.canteenId],
    queryFn: () => fetchFriends(user.canteenId, 500, 0),
    enabled: !!user,
  });

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const filteredFriends =
    query === ""
      ? friends
      : friends.filter((friend) => friend.username.toLowerCase().includes(query.toLowerCase()));

  const handleComboboxChange = (friend, close) => {
    if (friend) {
      setSelectedFriend(friend);
      setMessage("");
      setIsModalOpen(true);
      if (close) close();
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, content, recipeId }) => sendMessage(receiverId, content, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      setIsModalOpen(false);
      setSelectedFriend(null);
      setMessage("");
    },
    onError: (error) => console.error(error),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!selectedFriend || !recipe) return;

    sendMessageMutation.mutate({
      receiverId: selectedFriend.id,
      content: message,
      recipeId: recipe.id,
    });
  };

  const handleCopyLink = () => {
    if (!recipe) return;
    const url = `${window.location.origin}/recipes/${recipe.id}`;
    const textToCopy = `${recipe.title} recipe\n${url}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyStatus("Copied!");
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopyStatus("Copy Link"), 2000);
    });
  };

  return (
    <>
      <Popover className={className}>
        {({ close }) => (
          <>
            <PopoverButton className={`focus:outline-none ${buttonClassName}`}>
              {label}
            </PopoverButton>
            <PopoverPanel
              className={`bg-dark border-grey absolute z-50 w-64 border p-2 shadow-xl ${panelClassName}`}
            >
              <div className="flex items-center gap-2">
                <Combobox
                  as="div"
                  onChange={(value) => handleComboboxChange(value, close)}
                  immediate
                  className="relative flex-1"
                >
                  <ComboboxInput
                    className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-1 text-sm focus:outline-none"
                    placeholder="Search friends..."
                    displayValue={() => ""}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    type="search"
                    autoFocus
                  />
                  {filteredFriends.length > 0 && (
                    <ComboboxOptions className="bg-dark border-grey absolute left-0 right-0 z-50 mt-1 max-h-40 w-full overflow-auto border shadow-lg">
                      {filteredFriends.map((friend) => (
                        <ComboboxOption
                          key={friend.id}
                          value={friend}
                          className="data-focus:bg-accent text-lightestGrey cursor-pointer px-2 py-1 text-sm select-none data-focus:text-dark"
                        >
                          {friend.username}
                        </ComboboxOption>
                      ))}
                    </ComboboxOptions>
                  )}
                </Combobox>
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-lightestGrey hover:text-white p-1 text-lg"
                  title={copyStatus}
                >
                  {copyStatus === "Copied!" ? "✅" : "🔗"}
                </Button>
              </div>
              {filteredFriends.length === 0 && query !== "" && (
                <div className="text-lightGrey pt-2 text-center text-sm italic">
                  No friends found.
                </div>
              )}
            </PopoverPanel>
          </>
        )}
      </Popover>

      <MiddenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Share with ${selectedFriend?.username}`}
      >
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <div className="bg-primary/20 border-accent/50 border border-dashed p-3">
            <h4 className="font-mono font-bold text-white mb-1">{recipe?.title}</h4>
            <p className="text-lightGrey truncate font-mono text-sm">{recipe?.description}</p>
          </div>
          <Field>
            <Label className="text-lightestGrey mb-1 block text-sm font-bold">
              Message (optional)
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full resize-none border p-2 focus:outline-none"
              rows={3}
              placeholder="Check out this recipe!"
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-lightGrey px-4 py-2 font-bold hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-dark disabled:opacity-50"
            >
              {sendMessageMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </MiddenModal>
    </>
  );
};

export default ShareRecipePopover;
