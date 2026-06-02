import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Showcase from "../Showcase";

describe("ProfessionalWork Component", () => {
  it("renders the main heading and introductory text", () => {
    render(<Showcase />);

    expect(screen.getByRole("heading", { name: "Professional Showcase" })).toBeInTheDocument();
    expect(screen.getByText(/I've been a professional developer since 2017/i)).toBeInTheDocument();
  });

  it("renders the Squarespace Help Center section with the image", () => {
    render(<Showcase />);

    expect(screen.getByRole("heading", { name: "Squarespace Help Center" })).toBeInTheDocument();
    expect(screen.getByText("2021 – 2024")).toBeInTheDocument();
    expect(screen.getByAltText("Squarespace Help Center")).toBeInTheDocument();
    expect(screen.getByText(/AI-Powered Support Chatbot:/i)).toBeInTheDocument();
  });

  it("renders the MotorTrend section with the image", () => {
    render(<Showcase />);

    expect(screen.getByRole("heading", { name: "MotorTrend" })).toBeInTheDocument();
    expect(screen.getByText("2019 - 2020")).toBeInTheDocument();
    expect(screen.getByAltText("MotorTrend")).toBeInTheDocument();
    expect(screen.getByText(/Article Page & Buyer's Guide:/i)).toBeInTheDocument();
  });
});
