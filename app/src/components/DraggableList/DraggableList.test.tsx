import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DraggableList } from "./DraggableList"

afterEach(cleanup)

describe("drag mode", () => {
  it("renders ordinary content with no sortable handles when disabled", () => {
    const { container, rerender } = render(
      <DraggableList
        items={[{ id: 1 }, { id: 2 }]}
        getItemId={(item) => item.id}
        render={(item) => <span>Track {item.id}</span>}
        onItemMoved={vi.fn()}
        enabled={false}
      />,
    )
    expect(screen.getByText("Track 1")).toBeInTheDocument()
    expect(
      container.querySelector('[aria-roledescription="sortable"]'),
    ).toBeNull()
    rerender(
      <DraggableList
        items={[{ id: 1 }, { id: 2 }]}
        getItemId={(item) => item.id}
        render={(item) => <span>Track {item.id}</span>}
        onItemMoved={vi.fn()}
        enabled
      />,
    )
    expect(
      container.querySelectorAll('[aria-roledescription="sortable"]'),
    ).toHaveLength(2)
  })
})
