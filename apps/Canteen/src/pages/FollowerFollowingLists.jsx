import { useEffect, useEffectEvent, useState } from "react";
import { useSearchParams, Link, useParams, Navigate } from "react-router-dom";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";
import CanteenUserList from "../components/CanteenUserList";

const FollowerFollowingLists = () => {
  const { user } = useAuth();
  const { 
    followers, 
    following, 
    getFollowers, 
    getFollowing, 
    relationshipCounts,
    getRelationshipCounts,
    followUser, 
    unfollowUser 
  } = useData();
  
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "following" ? "following" : "followers";
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const setLoadingEffect = useEffectEvent(() => {
    setLoading(true);
  });

  useEffect(() => {
    if (user) {
      setLoadingEffect();
      
      const followersLimit = activeTab === "followers" ? limit : 50;
      const followersOffset = activeTab === "followers" ? (page - 1) * limit : 0;
      const followingLimit = activeTab === "following" ? limit : 50;
      const followingOffset = activeTab === "following" ? (page - 1) * limit : 0;

      Promise.all([
        getFollowers(user.canteenId, followersLimit, followersOffset),
        getFollowing(user.canteenId, followingLimit, followingOffset),
        getRelationshipCounts(user.canteenId)
      ]).finally(() => setLoading(false));
    }
  }, [user, activeTab, page, limit, getFollowers, getFollowing, getRelationshipCounts]);

  const handleFollowToggle = async (targetUserId, isFollowing) => {
    if (isFollowing) {
      await unfollowUser(targetUserId);
    } else {
      await followUser(targetUserId);
    }
    
    if (user) {
      getFollowing(user.canteenId, limit, 0);
      getFollowers(user.canteenId, limit, 0);
      getRelationshipCounts(user.canteenId);
    }
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
            className="text-white hover:text-accent text-3xl leading-none transition-colors focus:outline-none"
            aria-label="Go back to profile"
          >
            ←
          </Link>
          <h2 className="font-gothic text-4xl font-bold text-white">My Network</h2>
        </div>
      </div>

      <div className="border-grey mb-6 flex border-b">
        <button
          onClick={() => switchTab("followers")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${
            activeTab === "followers"
              ? "border-accent text-accent border-b-2"
              : "text-lightGrey hover:text-white"
          }`}
        >
          Followers ({relationshipCounts?.followers || 0})
        </button>
        <button
          onClick={() => switchTab("following")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${
            activeTab === "following"
              ? "border-accent text-accent border-b-2"
              : "text-lightGrey hover:text-white"
          }`}
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