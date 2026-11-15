import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ScaleTempoDialog } from "./ScaleTempoDialog"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
})

const advance = (milliseconds: number) =>
  act(() => vi.advanceTimersByTime(milliseconds))

const setup = () => {
  const onApply = vi.fn()
  const onClose = vi.fn()
  const view = render(
    <ScaleTempoDialog referenceBpm={120} onApply={onApply} onClose={onClose} />,
  )
  return { onApply, onClose, ...view }
}

const setupCircularDial = () => {
  const callbacks = setup()
  const dial = screen.getByRole("slider")
  dial.setPointerCapture = vi.fn()
  dial.releasePointerCapture = vi.fn()
  // Use an offset dial to test client coordinates relative to its centre.
  vi.spyOn(dial, "getBoundingClientRect").mockReturnValue(
    new DOMRect(40, 60, 200, 200),
  )
  const point = (degrees: number) => ({
    clientX: 140 + Math.cos((degrees * Math.PI) / 180) * 80,
    clientY: 160 + Math.sin((degrees * Math.PI) / 180) * 80,
  })
  return {
    ...callbacks,
    dial,
    down: (degrees: number) =>
      fireEvent.pointerDown(dial, {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        button: 0,
        ...point(degrees),
      }),
    move: (degrees: number) =>
      fireEvent.pointerMove(dial, {
        pointerId: 1,
        pointerType: "touch",
        ...point(degrees),
      }),
  }
}

describe("ScaleTempoDialog", () => {
  it("centres 100 percent at 12 o'clock with symmetric endpoint angles", () => {
    setup()
    const dial = screen.getByRole("slider")
    const marker = dial.querySelector("line")
    expect(marker).toHaveAttribute("transform", "rotate(0 100 100)")
    expect(dial).toHaveAttribute("aria-valuemax", "200")
    fireEvent.keyDown(dial, { key: "Home" })
    expect(marker).toHaveAttribute("transform", "rotate(-135 100 100)")
    fireEvent.keyDown(dial, { key: "End" })
    expect(marker).toHaveAttribute("transform", "rotate(135 100 100)")
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(marker).toHaveAttribute("transform", "rotate(0 100 100)")
  })

  it("links percentage and BPM and automatically applies after 500ms", () => {
    const { onApply, onClose } = setup()
    advance(1000)
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
      target: { value: "80" },
    })
    expect(screen.getByLabelText("BPM")).toHaveValue(96)
    fireEvent.change(screen.getByLabelText("BPM"), { target: { value: "60" } })
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(50)
    expect(onApply).not.toHaveBeenCalled()
    advance(499)
    expect(onApply).not.toHaveBeenCalled()
    advance(1)
    expect(onApply).toHaveBeenCalledWith(50)
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument()
  })

  it("updates BPM while dragging and wheeling with limits at 1 and 200 percent", () => {
    setup()
    const slider = screen.getByRole("slider")
    fireEvent.keyDown(slider, { key: "End" })
    expect(screen.getByLabelText("BPM")).toHaveValue(240)
    fireEvent.wheel(slider, { deltaY: -100 })
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(200)
    fireEvent.wheel(slider, { deltaY: 100 })
    expect(screen.getByLabelText("BPM")).toHaveValue(238.8)
    fireEvent.keyDown(slider, { key: "Home" })
    fireEvent.wheel(slider, { deltaY: 100 })
    expect(screen.getByLabelText("BPM")).toHaveValue(1.2)
    expect(screen.getByRole("status")).toHaveTextContent("below 3.58 BPM")
  })

  it.each([
    "",
    "0",
    "201",
    "-10",
  ])("prevents applying invalid input %s", (value) => {
    const { onApply } = setup()
    fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
      target: { value },
    })
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    fireEvent.keyDown(screen.getByLabelText("Tempo scale (%)"), {
      key: "Enter",
    })
    advance(1000)
    expect(onApply).not.toHaveBeenCalled()
  })

  it("cancels a pending change when the dialog is closed", () => {
    const { onApply, onClose, unmount } = setup()
    fireEvent.change(screen.getByLabelText("BPM"), { target: { value: "60" } })
    advance(200)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    unmount()
    advance(1000)
    expect(onApply).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("starts at the applied percentage and can apply Reset at 100 percent", () => {
    const onApply = vi.fn()
    render(
      <ScaleTempoDialog
        referenceBpm={120}
        initialPercent={60}
        onApply={onApply}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByLabelText("BPM")).toHaveValue(72)
    advance(1000)
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    advance(500)
    expect(onApply).toHaveBeenCalledWith(100)
  })

  it("waits for touch release even when the finger stops moving for longer than 500ms", () => {
    const { dial, down, move, onApply } = setupCircularDial()
    down(-90)
    move(0)
    advance(2000)
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.pointerUp(dial, { pointerId: 1 })
    advance(499)
    expect(onApply).not.toHaveBeenCalled()
    advance(1)
    expect(onApply).toHaveBeenCalledExactlyOnceWith(166.7)
  })

  it("cancels an old deadline when the user grabs the dial again", () => {
    const { dial, down, move, onApply } = setupCircularDial()
    fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
      target: { value: "80" },
    })
    advance(400)
    down(0)
    advance(1000)
    expect(onApply).not.toHaveBeenCalled()
    move(30)
    fireEvent.pointerUp(dial, { pointerId: 1 })
    const latest = Number(
      (screen.getByLabelText("Tempo scale (%)") as HTMLInputElement).value,
    )
    advance(500)
    expect(onApply).toHaveBeenCalledExactlyOnceWith(latest)
  })

  it("does not treat losing pointer capture as releasing a held finger", () => {
    const { dial, down, move, onApply } = setupCircularDial()
    down(-90)
    move(0)
    fireEvent.lostPointerCapture(dial, { pointerId: 1, buttons: 1 })
    advance(2000)
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.pointerUp(window, { pointerId: 1 })
    advance(500)
    expect(onApply).toHaveBeenCalledExactlyOnceWith(166.7)
  })

  it("debounces typing, cancels invalid input and resets automatically", () => {
    const { onApply } = setup()
    const input = screen.getByLabelText("Tempo scale (%)")
    fireEvent.change(input, { target: { value: "80" } })
    advance(300)
    fireEvent.change(input, { target: { value: "60" } })
    advance(499)
    expect(onApply).not.toHaveBeenCalled()
    advance(1)
    expect(onApply).toHaveBeenCalledExactlyOnceWith(60)
    fireEvent.change(input, { target: { value: "50" } })
    advance(400)
    fireEvent.change(input, { target: { value: "" } })
    advance(1000)
    expect(onApply).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    advance(500)
    expect(onApply).toHaveBeenLastCalledWith(100)
    expect(onApply).toHaveBeenCalledTimes(2)
  })

  it("waits for a held mouse input spinner to release outside the dialog", () => {
    const { onApply } = setup()
    const input = screen.getByLabelText("Tempo scale (%)")
    fireEvent.pointerDown(input, {
      pointerId: 7,
      pointerType: "mouse",
      button: 0,
    })
    fireEvent.change(input, { target: { value: "80" } })
    advance(1000)
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.pointerUp(window, { pointerId: 7 })
    advance(500)
    expect(onApply).toHaveBeenCalledExactlyOnceWith(80)
  })

  it("uses the latest callback without restarting the deadline or applying twice", () => {
    const { onApply, rerender } = setup()
    fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
      target: { value: "80" },
    })
    advance(400)
    const latestApply = vi.fn()
    rerender(
      <ScaleTempoDialog
        referenceBpm={120}
        onApply={latestApply}
        onClose={vi.fn()}
      />,
    )
    advance(100)
    expect(onApply).not.toHaveBeenCalled()
    expect(latestApply).toHaveBeenCalledExactlyOnceWith(80)
    advance(1000)
    expect(latestApply).toHaveBeenCalledTimes(1)
  })

  it("turns clockwise and counterclockwise with a finger, without jumping on grab", () => {
    const { dial, down, move } = setupCircularDial()
    down(-90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
    move(0)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(166.7)
    expect(screen.getByLabelText("BPM")).toHaveValue(200.04)
    move(-90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
    expect(dial.setPointerCapture).toHaveBeenCalledWith(1)
    fireEvent.pointerCancel(dial, { pointerId: 1 })
    move(0)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
  })

  it("stays continuous across the -180/180 seam in both directions", () => {
    const { dial, down, move } = setupCircularDial()
    down(170)
    move(-170)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(114.8)
    move(170)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
    fireEvent.pointerUp(dial, { pointerId: 1 })
    expect(dial.releasePointerCapture).toHaveBeenCalledWith(1)
    move(90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
  })

  it("ignores centre jitter and re-anchors when returning to the ring", () => {
    const { dial, down, move } = setupCircularDial()
    down(0)
    fireEvent.pointerMove(dial, { pointerId: 1, clientX: 141, clientY: 159 })
    move(90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
    move(180)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(166.7)
  })

  it("stops at the limits and immediately responds when turning back", () => {
    const { dial, down, move } = setupCircularDial()
    fireEvent.keyDown(dial, { key: "End" })
    down(0)
    move(90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(200)
    move(80)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(192.6)
    fireEvent.pointerUp(dial, { pointerId: 1 })
    fireEvent.keyDown(dial, { key: "Home" })
    down(0)
    move(-90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(1)
    move(-80)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(8.3)
  })

  it("accumulates slow circular motion and ignores a second finger", () => {
    const { dial, down, move } = setupCircularDial()
    down(0)
    for (let i = 1; i <= 10; i++) {
      move(i * 0.01)
    }
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100.1)
    fireEvent.pointerDown(dial, {
      pointerId: 2,
      isPrimary: false,
      button: 0,
      clientX: 60,
      clientY: 160,
    })
    fireEvent.pointerMove(dial, { pointerId: 2, clientX: 140, clientY: 80 })
    fireEvent.pointerCancel(dial, { pointerId: 2 })
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100.1)
    move(90)
    expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(166.7)
  })
})
