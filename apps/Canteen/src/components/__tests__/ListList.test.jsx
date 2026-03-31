import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ListList from "../ListList";

describe("ListList", () => {
  const mockHandleDeleteList = vi.fn();
  const userLists = [
    { id: 1, name: "Favorites" },
    { id: 2, name: "Weekly Plan" },
    { id: 3, name: "Party" },
  ];

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <ListList
          fetchingLists={false}
          userLists={userLists}
          handleDeleteList={mockHandleDeleteList}
          emptyMessage="No lists found."
          {...props}
        />
      </MemoryRouter>
    );
  };

  it("renders loading state", () => {
    renderComponent({ fetchingLists: true });
    expect(screen.getByText("Loading lists...")).toBeInTheDocument();
  });

  it("renders empty message when no lists are present", () => {
    renderComponent({ userLists: [] });
    expect(screen.getByText("No lists found.")).toBeInTheDocument();
  });

  it("renders lists with Favorites first", () => {
    const unorderedLists = [
      { id: 2, name: "Weekly Plan" },
      { id: 1, name: "Favorites" },
      { id: 3, name: "Party" },
    ];
    renderComponent({ userLists: unorderedLists });

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Favorites");
    expect(headings[1]).toHaveTextContent("Weekly Plan");
    expect(headings[2]).toHaveTextContent("Party");
  });

  it("does not show delete button for Favorites list", () => {
    renderComponent();
    const favoritesHeading = screen.getByText("Favorites");
    const favoritesContainer = favoritesHeading.closest(".relative");
    
    const button = favoritesContainer.querySelector("button");
    expect(button).not.toBeInTheDocument();
  });

  it("shows delete button for other lists and calls handler on click", () => {
    renderComponent();
    const deleteBtn = screen.getByLabelText("Delete Weekly Plan");
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockHandleDeleteList).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it("renders links pointing to correct list details", () => {
    renderComponent();
    expect(screen.getByText("View Favorites").closest("a")).toHaveAttribute("href", "/my-lists/1");
  });
});