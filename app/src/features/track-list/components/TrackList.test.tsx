import { emptySong, type Song, type TrackId } from "@signal-app/core"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TrackList } from "./TrackList"

const state = vi.hoisted(() => ({
  song: null as unknown as Song,
  pushHistory: vi.fn(),
}))
vi.mock("../../../hooks/useSong", () => ({
  useSong: () => ({ getSong: () => state.song }),
}))
vi.mock("../../../hooks/useHistory", () => ({
  useHistory: () => ({ pushHistory: state.pushHistory }),
}))
vi.mock("../hooks/useTrackList", () => ({
  useTrackList: () => ({
    trackIds: state.song.tracks
      .filter((track) => !track.isConductorTrack)
      .map((track) => track.id),
  }),
}))
vi.mock("./TrackListItem", () => ({
  TrackListItem: ({ trackId }: { trackId: TrackId }) => (
    <span>Track {trackId}</span>
  ),
}))
vi.mock("./AddTrackButton", () => ({
  AddTrackButton: () => <button type="button">Add track</button>,
}))
vi.mock("../../../components/DraggableList/DraggableList", () => ({
  DraggableList: ({
    items,
    enabled,
    onItemMoved,
    render,
  }: {
    items: TrackId[]
    enabled: boolean
    onItemMoved: (from: TrackId, to: TrackId) => void
    render: (id: TrackId) => ReactNode
  }) => (
    <div data-testid="tracks" data-enabled={enabled}>
      {items.map((id) => (
        <div key={id}>{render(id)}</div>
      ))}
      <button
        type="button"
        disabled={!enabled}
        onClick={() => onItemMoved(items[0], items[1])}
      >
        Move track
      </button>
    </div>
  ),
}))

beforeEach(() => {
  state.song = emptySong()
  state.song.addNewTrack()
  state.song.isSaved = true
  state.pushHistory.mockClear()
})
afterEach(cleanup)

describe("Track re-order", () => {
  it("disables dragging until Re-order is enabled and Cancel discards the draft", () => {
    const before = state.song.serialize()
    render(<TrackList />)
    expect(screen.getByRole("button", { name: "Move track" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Re-order" }))
    fireEvent.click(screen.getByRole("button", { name: "Move track" }))
    expect(screen.getByTestId("tracks").textContent).toMatch(/Track 2Track 1/)
    expect(state.song.serialize()).toEqual(before)
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByTestId("tracks").textContent).toMatch(/Track 1Track 2/)
    expect(state.song.serialize()).toEqual(before)
    expect(state.pushHistory).not.toHaveBeenCalled()
    expect(
      screen.getByRole("button", { name: "Re-order" }).parentElement
        ?.parentElement,
    ).toHaveFocus()
  })

  it("Save applies the order once, keeps the conductor pinned and exits drag mode", () => {
    render(<TrackList />)
    fireEvent.click(screen.getByRole("button", { name: "Re-order" }))
    fireEvent.click(screen.getByRole("button", { name: "Move track" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(state.song.tracks.map((track) => track.id)).toEqual([0, 2, 1])
    expect(state.song.isSaved).toBe(false)
    expect(state.pushHistory).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole("button", { name: "Re-order" }).parentElement
        ?.parentElement,
    ).toHaveFocus()
    expect(screen.getByRole("button", { name: "Move track" })).toBeDisabled()
  })

  it("does not create an undo entry for an unchanged order", () => {
    render(<TrackList />)
    fireEvent.click(screen.getByRole("button", { name: "Re-order" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(state.pushHistory).not.toHaveBeenCalled()
    expect(state.song.isSaved).toBe(true)
  })

  it("drops stale drafts when opening another song", () => {
    const { rerender } = render(<TrackList />)
    fireEvent.click(screen.getByRole("button", { name: "Re-order" }))
    fireEvent.click(screen.getByRole("button", { name: "Move track" }))
    state.song = emptySong()
    rerender(<TrackList />)
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("tracks").textContent).toMatch(/Track 1/)
    expect(state.pushHistory).not.toHaveBeenCalled()
  })
})
