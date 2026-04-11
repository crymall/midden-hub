import { useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import {
  fetchFollowers,
  fetchFollowing,
  fetchRelationshipCounts,
  followUser,
  unfollowUser,
} from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import CanteenUserList from "../components/CanteenUserList";

const FollowerFollowingLists = () => {
  const { user } = useAuth();
  const { id } = useParams();

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "following" ? "following" : "followers";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const followersLimit = activeTab === "followers" ? limit : 50;
  const followersOffset = activeTab === "followers" ? (page - 1) * limit : 0;
  const followingLimit = activeTab === "following" ? limit : 50;
  const followingOffset = activeTab === "following" ? (page - 1) * limit : 0;

  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ["followers", user?.canteenId, { limit: followersLimit, offset: followersOffset }],
    queryFn: () => fetchFollowers(user.canteenId, followersLimit, followersOffset),
    enabled: !!user,
  });

  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following", user?.canteenId, { limit: followingLimit, offset: followingOffset }],
    queryFn: () => fetchFollowing(user.canteenId, followingLimit, followingOffset),
    enabled: !!user,
  });

  const { data: relationshipCounts } = useQuery({
    queryKey: ["relationshipCounts", user?.canteenId],
    queryFn: () => fetchRelationshipCounts(user.canteenId),
    enabled: !!user,
  });

  const loading = followersLoading || followingLoading;

  const { mutate: mutateToggleFollow } = useMutation({
    mutationFn: async ({ targetUserId, isFollowing }) => {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["following", user?.canteenId],
      });
      queryClient.invalidateQueries({
        queryKey: ["followers", user?.canteenId],
      });
      queryClient.invalidateQueries({
        queryKey: ["relationshipCounts", user?.canteenId],
      });
    },
  });

  const handleFollowToggle = (targetUserId, isFollowing) => {
    mutateToggleFollow({ targetUserId, isFollowing });
  };

  const switchTab = (tab) => {
    setSearchParams({ tab });
    setPage(1);
  };

  if (!user) {
    return null;
  }

  if (String(user.canteenId) !== String(id)) {
    return <Navigate to={`/user/${id}`} replace />;
  }

  return (
    <MiddenCard>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/user/${user.canteenId}`}
            className="text-white hover:text-accent text-3xl leading-none font-icons icon transition-colors focus:outline-none"
            aria-label="Go back to profile"
          >
            D
          </Link>
          <h2 className="font-gothic text-4xl font-bold text-white">My Network</h2>
        </div>
      </div>

      <div className="border-grey mb-6 flex border-b">
        <button
          onClick={() => switchTab("followers")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${activeTab === "followers" ? "border-accent text-accent border-b-2" : "text-lightGrey hover:text-white"}`}
        >
          Followers ({relationshipCounts?.followers || 0})
        </button>
        <button
          onClick={() => switchTab("following")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${activeTab === "following" ? "border-accent text-accent border-b-2" : "text-lightGrey hover:text-white"}`}
        >
          Following ({relationshipCounts?.following || 0})
        </button>
      </div>

      {activeTab === "followers" ? (
        <CanteenUserList
          users={followers}
          followingList={following}
          followersList={followers}
          loading={loading}
          onToggleFollow={handleFollowToggle}
          emptyMessage="You don't have any followers yet."
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          isNextDisabled={followers.length < limit}
        />
      ) : (
        <CanteenUserList
          users={following}
          followingList={following}
          followersList={followers}
          loading={loading}
          onToggleFollow={handleFollowToggle}
          emptyMessage="You aren't following anyone yet."
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          isNextDisabled={following.length < limit}
        />
      )}
    </MiddenCard>
  );
};

export default FollowerFollowingLists;
