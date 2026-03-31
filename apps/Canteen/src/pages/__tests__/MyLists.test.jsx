import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MyLists from "../MyLists";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("MyLists", () => {
  const mockGetUserLists = vi.fn();
  const mockDeleteList = vi.fn();
  const mockCreateList = vi.fn();

  const mockCanteenApi = {
    deleteList: mockDeleteList,
    createList: mockCreateList,
  };

  const defaultUser = { id: "user1" };
  const defaultLists = [
    { id: "l1", name: "Favorites" },
    { id: "l2", name: "Weekly" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ user: defaultUser });
    useData.mockReturnValue({
      userLists: defaultLists,
      getUserLists: mockGetUserLists.mockResolvedValue([]),
      canteenApi: mockCanteenApi,
    });
  });

  it("renders lists", async () => {
    render(
      <MemoryRouter>
        <MyLists />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("does not fetch lists on mount if cache exists", async () => {
    render(
      <MemoryRouter>
        <MyLists />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(mockGetUserLists).not.toHaveBeenCalled();
  });

  it("fetches lists on mount if cache is empty", async () => {
    useData.mockReturnValue({
      userLists: [],
      getUserLists: mockGetUserLists.mockResolvedValue([]),
      canteenApi: mockCanteenApi,
    });
    render(
      <MemoryRouter>
        <MyLists />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetUserLists).toHaveBeenCalledWith("user1", 20, 0);
    });
  });

  it("opens delete modal and deletes list", async () => {
    render(
      <MemoryRouter>
        <MyLists />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Weekly")).toBeInTheDocument());

    const deleteBtn = screen.getByLabelText("Delete Weekly");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Delete List")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this list/)).toBeInTheDocument();

    const confirmBtn = screen.getByText("Delete");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteList).toHaveBeenCalledWith("l2");
      expect(mockGetUserLists).toHaveBeenCalled();
    });
  });

  it("opens create modal and creates list", async () => {
    render(
      <MemoryRouter>
        <MyLists />
      </MemoryRouter>
    );

    const createBtn = screen.getByText("+ List");
    fireEvent.click(createBtn);

    expect(screen.getByText("Create New List")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("e.g. Weeknight Dinners");
    fireEvent.change(input, { target: { value: "New List" } });

    const submitBtn = screen.getByText("Create List");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateList).toHaveBeenCalledWith("New List");
      expect(mockGetUserLists).toHaveBeenCalled();
    });
  });

  it("renders back button if history exists and navigates back", async () => {
    render(
      <MemoryRouter initialEntries={["/", "/my-lists"]} initialIndex={1}>
        <MyLists />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());

    const backBtn = screen.getByRole("button", { name: "Go back" });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("does not render back button if no history exists", async () => {
    render(
      <MemoryRouter initialEntries={["/my-lists"]} initialIndex={0}>
        <MyLists />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
  });
});