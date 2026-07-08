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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.jsx";

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
