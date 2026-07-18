import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createRoutesFromChildren,
  matchRoutes,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import {
  createReactRouterV7Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
} from "@grafana/faro-react";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import App from "./App.jsx";
import { flushPendingNotes } from "./offline/flushPendingNotes";
import { pruneStaleDrafts } from "./offline/noteDrafts";
import { PENDING_NOTES_QUERY_KEY } from "./offline/pendingNotesStore";

import "@shared/ui/styles/index.css";

initializeFaro({
  // TODO: no "netbook" app is registered in Grafana yet — replace the placeholder
  // collector URL with the real one and remove `paused` once it exists.
  url: "https://faro-collector-prod-us-east-2.grafana.net/collect/netbook-placeholder",
  paused: true,
  app: {
    name: "netbook",
    version: "1.0.0",
    environment: "production",
  },
  sessionTracking: {
    samplingRate: 0.5,
  },
  instrumentations: [
    // Mandatory, omits default instrumentations otherwise.
    ...getWebInstrumentations(),

    // Tracing package to get end-to-end visibility for HTTP requests.
    new TracingInstrumentation(),

    // React integration for React applications.
    new ReactIntegration({
      router: createReactRouterV7Options({
        createRoutesFromChildren,
        matchRoutes,
        Routes,
        useLocation,
        useNavigationType,
      }),
    }),
  ],
});

window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

const queryClient = new QueryClient();
// The pending offline queue is written with setQueryData and often has no
// observer (e.g. on the splash); without this it would be garbage-collected.
queryClient.setQueryDefaults(PENDING_NOTES_QUERY_KEY, { gcTime: Infinity });

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "netbook-query-cache",
  // Default is 1s; a shorter throttle narrows the window in which closing the
  // tab right after an offline write could lose it.
  throttleTime: 100,
});

pruneStaleDrafts();

// Flush the offline queue whenever connectivity returns.
onlineManager.subscribe((isOnline) => {
  if (isOnline) {
    flushPendingNotes(queryClient);
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Default 24h maxAge would discard unsynced offline notes on restore.
        maxAge: Infinity,
        buster: "v1",
        dehydrateOptions: {
          // Notes and the offline queue only — persisting ["currentUser"]
          // (staleTime Infinity) would let a reload skip iamApi.verify().
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            (query.queryKey[0] === "pendingNotes" || query.queryKey[0] === "notes"),
        },
      }}
      onSuccess={() => flushPendingNotes(queryClient)}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
