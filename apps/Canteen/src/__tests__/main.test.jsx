import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

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

    const rootElement = document.getElementById("root");
    expect(createRootMock).toHaveBeenCalledWith(rootElement);
    expect(renderMock).toHaveBeenCalledWith(
      <StrictMode>
        <QueryClientProvider client={expect.any(QueryClient)}>
          <App />
        </QueryClientProvider>
      </StrictMode>,
    );
  });
});
