import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

vi.mock("@grafana/faro-react", () => ({
  initializeFaro: vi.fn(),
  ReactIntegration: vi.fn(),
  getWebInstrumentations: vi.fn(() => []),
  createReactRouterV7Options: vi.fn(),
}));

vi.mock("@grafana/faro-web-tracing", () => ({
  TracingInstrumentation: vi.fn(),
}));

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({ render: renderMock }));

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
}));

vi.mock("../App", () => ({
  default: () => <div>App Component</div>,
}));

vi.mock("../index.css", () => ({}));

describe("main.jsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("renders App component into root element", async () => {
    vi.resetModules();

    await import("../main.jsx");

    // Both modules are project source, so vi.resetModules gave main.jsx fresh copies;
    // re-importing here is what makes the element types compare equal.
    const { UserEnrichmentContext } = await import("@shared/core/hooks/userEnrichment");
    const { attachCanteenId } = await import("../auth/attachCanteenId");

    const rootElement = document.getElementById("root");
    expect(createRootMock).toHaveBeenCalledWith(rootElement);
    expect(renderMock).toHaveBeenCalledWith(
      <StrictMode>
        <QueryClientProvider client={expect.any(QueryClient)}>
          <UserEnrichmentContext.Provider value={attachCanteenId}>
            <App />
          </UserEnrichmentContext.Provider>
        </QueryClientProvider>
      </StrictMode>,
    );
  });
});
