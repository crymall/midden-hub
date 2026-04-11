import { Field, Input, Label, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { PERMISSIONS } from "@shared/core/utils/constants";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import { fetchUser, fetchUsers } from "@shared/core/services/iamApi";

import Can from "@shared/core/gateways/Can";

import MiddenCard from "@shared/ui/components/MiddenCard";
import UserList from "../components/UserList";

const Settings = () => {
  const { user } = useAuth();
  const { writeUsers } = PERMISSIONS;

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    enabled: !!user && user.permissions?.includes(writeUsers),
  });

  const { data: userEmail } = useQuery({
    queryKey: ["userEmail", user?.id],
    queryFn: async () => {
      const { user: completeLoggedInUser } = await fetchUser(user.id);
      return completeLoggedInUser.email;
    },
    enabled: !!user?.id,
  });

  return (
    <MiddenCard>
      <h2 className="mb-4 font-gothic text-4xl font-bold text-white">Settings</h2>
      <TabGroup>
        <TabList className="border-grey mb-6 flex space-x-4 border-b">
          <Tab className="data-selected:border-lightestGrey data-selected:text-lightestGrey text-grey hover:text-lightGrey cursor-pointer px-4 py-2 text-sm font-bold transition-colors focus:outline-none data-selected:border-b-2">
            Profile
          </Tab>
          <Can perform={writeUsers}>
            <Tab className="data-selected:border-lightestGrey data-selected:text-lightestGrey text-grey hover:text-lightGrey cursor-pointer px-4 py-2 text-sm font-bold transition-colors focus:outline-none data-selected:border-b-2">
              Admin Panel
            </Tab>
          </Can>
        </TabList>

        <TabPanels>
          <TabPanel>
            <h2 className="mb-4 font-mono text-xl font-bold text-white">User Information</h2>
            <div className="max-w-md space-y-4">
              <Field>
                <Label className="text-lightestGrey mb-1 block text-sm font-bold">Username</Label>
                <Input
                  value={user.username}
                  readOnly
                  className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
                />
              </Field>
              <Field>
                <Label className="text-lightestGrey mb-1 block text-sm font-bold">Email</Label>
                <Input
                  value={userEmail || ""}
                  readOnly
                  className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
                />
              </Field>
            </div>
          </TabPanel>

          <Can perform={writeUsers}>
            <TabPanel>
              <h2 className="mb-4 font-mono text-xl font-bold text-white">User Admin</h2>
              <UserList users={users} isLoading={usersLoading} />
            </TabPanel>
          </Can>
        </TabPanels>
      </TabGroup>
    </MiddenCard>
  );
};

export default Settings;
