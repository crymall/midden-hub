import { createContext, useContext } from "react";

const returnUserUnchanged = (user) => user;

export const UserEnrichmentContext = createContext(returnUserUnchanged);

export const useUserEnrichment = () => useContext(UserEnrichmentContext);
