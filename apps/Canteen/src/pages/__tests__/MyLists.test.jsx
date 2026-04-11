import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MyLists from "../MyLists";
import { useAuth } from "@shared/core/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as canteenApi from "@shared/core/services/canteenApi";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/hooks/useAuth");
vi.mock("@shared/core/services/canteenApi");

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("MyLists", () => {
  const defaultUser = { id: "iam1", canteenId: "user1" };
  let queryClient;
  const defaultLists = [
    { id: "l1", name: "Favorites" },
    { id: "l2", name: "Weekly" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    useAuth.mockReturnValue({ user: defaultUser });
    canteenApi.fetchUserLists.mockResolvedValue(defaultLists);
  });

  const renderComponent = (ui) => render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );

  it("renders lists", async () => {
    renderComponent(<MyLists />);
    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("does not fetch lists on mount if cache exists", async () => {
    canteenApi.createList.mockResolvedValue({});
    renderComponent(<MyLists />);
    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(canteenApi.fetchUserLists).toHaveBeenCalledTimes(1); // Once on mount by useQuery
  });

  it("fetches lists on mount if cache is empty", async () => {
    canteenApi.fetchUserLists.mockResolvedValue([]);
    renderComponent(<MyLists />);
    
    await waitFor(() => {
      expect(canteenApi.fetchUserLists).toHaveBeenCalledWith("user1", 20, 0, "", "created_at", "DESC");
    });
  });

  it("opens delete modal and deletes list", async () => {
    canteenApi.deleteList.mockResolvedValue({});
    renderComponent(<MyLists />);

    await waitFor(() => expect(screen.getByText("Weekly")).toBeInTheDocument());

    const deleteBtn = screen.getByLabelText("Delete Weekly");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Delete List")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this list/)).toBeInTheDocument();

    const confirmBtn = screen.getByText("Delete");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(canteenApi.deleteList).toHaveBeenCalledWith("l2");
    });
  });

  it("opens create modal and creates list", async () => {
    renderComponent(<MyLists />);
    

    const createBtn = screen.getByText("+ List");
    fireEvent.click(createBtn);

    expect(screen.getByText("Create New List")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("e.g. Weeknight Dinners");
    fireEvent.change(input, { target: { value: "New List" } });

    const submitBtn = screen.getByText("Create List");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(canteenApi.createList).toHaveBeenCalledWith("New List");
    });
  });

  it("renders back button if history exists and navigates back", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/", "/my-lists"]} initialIndex={1}><MyLists /></MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());

    const backBtn = screen.getByRole("button", { name: "Go back" });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("does not render back button if no history exists", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/my-lists"]} initialIndex={0}><MyLists /></MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
  });

  it("does not render back button if navigated with hideBack state", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/lists/1", { pathname: "/my-lists", state: { hideBack: true } }]} initialIndex={1}><MyLists /></MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
  });
});