import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PageTitle } from "../pageTitle";

// Mock Next.js Head component
jest.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

describe("PageTitle", () => {
  it("should render title tag with provided title", () => {
    render(<PageTitle title="Test Page Title" />);

    // Check if title element exists in the document
    const titleElement = document.querySelector("title");
    expect(titleElement).toBeInTheDocument();
    expect(titleElement?.textContent).toBe("Test Page Title");
  });

  it("should update title when prop changes", () => {
    const { rerender } = render(<PageTitle title="Initial Title" />);

    let titleElement = document.querySelector("title");
    expect(titleElement?.textContent).toBe("Initial Title");

    rerender(<PageTitle title="Updated Title" />);

    titleElement = document.querySelector("title");
    expect(titleElement?.textContent).toBe("Updated Title");
  });

  it("should handle empty title", () => {
    render(<PageTitle title="" />);

    const titleElement = document.querySelector("title");
    expect(titleElement).toBeInTheDocument();
    expect(titleElement?.textContent).toBe("");
  });

  it("should handle special characters in title", () => {
    const specialTitle = "Chess & Strategy | Game Analysis";
    render(<PageTitle title={specialTitle} />);

    const titleElement = document.querySelector("title");
    expect(titleElement?.textContent).toBe(specialTitle);
  });
});
