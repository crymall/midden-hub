export const ROLES = {
  Admin: 1,
  Editor: 2,
  Viewer: 3,
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
    symbol: "🍔",
    to: import.meta.env.VITE_CANTEEN_URL,
  },
  {
    label: "Experiments",
    symbol: "🧪",
    to: "/experiments",
  },
];

export const experimentLinkList = [
  {
    label: "Back",
    symbol: "⬅️",
    to: "/",
  },
  {
    label: "Yesterday's Paper",
    symbol: "📰",
    to: "https://bsky.app/profile/todaylastcentury.bsky.social",
    description:
      "A Bluesky bot that, every day, posts a newspaper headline from exactly 100 years ago. This is an experiment with the NYT Articles API.",
  },
  {
    label: "Chutes Resolver",
    symbol: "🛝",
    to: "https://crymall.github.io/chutes-resolver/",
    description:
      "Chutes and Ladders is a game for children that robs them of any agency at all. There is no player choice, and the outcome is entirely left to chance. What a lesson to teach! It and its spawn (Candy Land, The Game of Life) are insipid and evil. If a friend ever asks you to play, save an hour, use this app, and figure out who would have won.",
  },
  {
    label: "Revolutionary Date",
    symbol: "📅",
    to: "https://crymall.github.io/revolutionary-date/",
    description:
      "Converts bourgeois Gregorian dates to a more structured, poetic, and woke system—the French Republican Calendar, the official datekeeping device of the French Revolution, since 1793.",
  },
  {
    label: "Midnight Info",
    symbol: "📞",
    to: "https://crymall.github.io/midnight_info/",
    description:
      "I made this one forever ago! An experiment with NYC OpenData's 311 API. Displays textual interpretations of 311 calls placed at midnight.",
  },
];
