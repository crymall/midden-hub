export const serverMessageOr = (error, fallback) => error?.response?.data?.error || fallback;
