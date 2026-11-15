import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FitViewButtons } from "./FitViewButtons"

afterEach(cleanup)

describe("Fit view buttons", () => {
  it("fits each axis independently and combines them for Fit all", () => {
    const horizontal = vi.fn()
    const vertical = vi.fn()
    render(
      <FitViewButtons onFitHorizontal={horizontal} onFitVertical={vertical} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Fit horizontal" }))
    expect(horizontal).toHaveBeenCalledTimes(1)
    expect(vertical).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Fit vertical" }))
    expect(horizontal).toHaveBeenCalledTimes(1)
    expect(vertical).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: "Fit all" }))
    expect(horizontal).toHaveBeenCalledTimes(2)
    expect(vertical).toHaveBeenCalledTimes(2)
  })
})
