export const ROLES = {
  Admin: 1,
  Editor: 2,
};

export const PERMISSIONS = {
  writeUsers: "write:users",
  writeData: "write:data",
};

export const navMeta = {
  midden: {
    title: "Midden",
    titleLink: "/",
    navLinks: [{ to: "/about", label: "About", ariaLabel: "about" }],
  },
  canteen: {
    title: "Canteen",
    titleLink: "/",
    navLinks: [
      {
        to: "/recipes",
        label: "Recipe Search",
        ariaLabel: "recipe-search",
      },
      {
        to: "/user/:userId",
        label: "My Profile",
        ariaLabel: "my-profile",
        requiredPermission: PERMISSIONS.writeData,
      },
      {
        to: "/messages",
        label: "Messages",
        ariaLabel: "messages",
        requiredPermission: PERMISSIONS.writeData,
      },
    ],
  },
};

export const explorerLinkList = [
  {
    label: "Canteen",
    symbol: "f",
    to: import.meta.env.VITE_CANTEEN_URL,
  },
  {
    label: "Experiments",
    symbol: "t",
    to: "/experiments",
  },
];

export const experimentLinkList = [
  {
    label: "Back",
    symbol: "D",
    to: "/",
  },
  {
    label: "Yesterday's Paper",
    symbol: "k",
    to: "https://bsky.app/profile/todaylastcentury.bsky.social",
    description:
      "A Bluesky bot that, every day, posts a newspaper headline from exactly 100 years ago. This is an experiment with the NYT Articles API.",
  },
  {
    label: "Chutes Resolver",
    symbol: "s",
    to: "https://crymall.github.io/chutes-resolver/",
    description:
      "Chutes and Ladders is a game for children that robs them of any agency at all. There is no player choice, and the outcome is entirely left to chance. What a lesson to teach! It and its spawn (Candy Land, The Game of Life) are insipid and evil. If a friend ever asks you to play, save an hour, use this app, and figure out who would have won.",
  },
  {
    label: "Revolutionary Date",
    symbol: "n",
    to: "https://crymall.github.io/revolutionary-date/",
    description:
      "Converts bourgeois Gregorian dates to a more structured, poetic, and woke system—the French Republican Calendar, the official datekeeping device of the French Revolution, since 1793.",
  },
  {
    label: "Midnight Info",
    symbol: "b",
    to: "https://crymall.github.io/midnight_info/",
    description:
      "An experiment with NYC OpenData's 311 API. Displays textual interpretations of 311 calls placed at midnight.",
  },
];
