import { Button, Select } from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import { ROLES } from "@shared/core/utils/constants";

const UserList = () => {
  const { users, usersLoading, deleteUser, updateUserRole } = useData();
  const { user: currentUser } = useAuth();
  const roleOptions = Object.entries(ROLES).map(([key, value]) => ({
    value: String(value),
    label: String(key),
  }));

  if (usersLoading) {
    return <div className="text-lightestGrey p-4">Loading...</div>;
  }

  if (!users || users.length === 0) {
    return <p className="text-lightGrey p-4">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="divide-grey/30 min-w-full divide-y">
        <thead className="bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-white uppercase">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-white uppercase">
              Username
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-white uppercase">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-white uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-grey/30 divide-y">
          {users.map((user) => {
            const isCurrentUser = currentUser && currentUser.id === user.id;
            const isAdmin = user.role === "Admin";
            const isDisabled = isCurrentUser || isAdmin;

            return (
              <tr key={user.id} className="transition-colors hover:bg-white/5">
                <td className="text-lightestGrey px-4 py-3 text-sm whitespace-nowrap">
                  {user.id}
                </td>
                <td className="text-lightestGrey px-4 py-3 text-sm font-bold whitespace-nowrap">
                  {user.username}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <Select
                    className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full min-w-25 border p-1 text-sm focus:outline-none"
                    value={ROLES[user.role] ? String(ROLES[user.role]) : ""}
                    onChange={(e) =>
                      updateUserRole(user.id, Number(e.target.value))
                    }
                    disabled={isDisabled}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <Button
                    className="border border-red-800 bg-red-950 px-2 py-1 text-base transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDisabled}
                    aria-label="Delete User"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete ${user.username}?`,
                        )
                      ) {
                        deleteUser(user.id);
                      }
                    }}
                  >
                    ❌
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
