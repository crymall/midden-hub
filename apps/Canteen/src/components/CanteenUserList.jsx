import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@headlessui/react";
import MiddenModal from "@shared/ui/components/MiddenModal";
import PaginationControls from "./PaginationControls";

const CanteenUserList = ({ 
  users, 
  followingList, 
  followersList = [], 
  loading, 
  onToggleFollow, 
  emptyMessage,
  page,
  limit,
  onPageChange,
  onLimitChange,
  isNextDisabled
}) => {
  const [userToUnfriend, setUserToUnfriend] = useState(null);

  if (loading && (!users || users.length === 0)) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-lightestGrey animate-pulse font-mono text-xl">
          Loading users...
        </p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-grey p-12 text-center">
        <p className="text-lightGrey font-mono">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const isFollowing = followingList.some((f) => String(f.id) === String(user.id));
          const isFollower = followersList.some((f) => String(f.id) === String(user.id));
          const isFriend = isFollowing && isFollower;

          return (
            <div
              key={user.id}
              className="group border-grey hover:border-accent relative flex flex-col border-2 border-dashed p-4 transition-colors"
            >
              <Link
                to={`/user/${user.id}`}
                className="absolute inset-0 z-0"
              >
                <span className="sr-only">View {user.username}</span>
              </Link>
              <div className="pointer-events-none relative z-10 flex items-start justify-between">
                <h3 className="text-accent group-hover:text-white font-mono text-xl font-bold transition-colors truncate pr-2">
                  {user.username}
                </h3>
                <div className="pointer-events-auto z-20 shrink-0">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isFriend) {
                        setUserToUnfriend(user);
                      } else {
                        onToggleFollow(user.id, isFollowing);
                      }
                    }}
                    className={`group/btn w-24 px-3 py-1 text-sm font-bold transition-colors focus:outline-none ${
                      isFriend
                        ? "border-accent text-accent hover:bg-accent hover:text-white border bg-transparent"
                        : isFollowing
                        ? "border-grey text-lightGrey hover:border-lightestGrey hover:text-white border bg-transparent"
                        : "bg-accent hover:bg-accent/80 text-white"
                    }`}
                  >
                    {isFriend ? (
                      <>
                        <span className="group-hover/btn:hidden">Friends</span>
                        <span className="hidden group-hover/btn:inline">Unfriend</span>
                      </>
                    ) : isFollowing ? (
                      "Unfollow"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {page !== undefined && onPageChange && (
        <PaginationControls
          page={page}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          loading={loading}
          isNextDisabled={isNextDisabled}
        />
      )}

      <MiddenModal
        isOpen={!!userToUnfriend}
        onClose={() => setUserToUnfriend(null)}
        title="Unfriend User"
      >
        <p className="text-lightestGrey mb-6 font-mono">
          Are you sure you want to unfollow{" "}
          <strong className="text-white">{userToUnfriend?.username}</strong>? You will no longer be friends.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setUserToUnfriend(null)}
            className="text-lightGrey px-4 py-2 font-bold hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (userToUnfriend) {
                onToggleFollow(userToUnfriend.id, true);
                setUserToUnfriend(null);
              }
            }}
            className="bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
          >
            Unfriend
          </Button>
        </div>
      </MiddenModal>
    </>
  );
};

export default CanteenUserList;