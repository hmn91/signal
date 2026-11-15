import { SongStore } from "@signal-app/core"
import { createTempoEditor } from "@signal-app/tempo-editor"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "jotai"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { useHistory } from "../../../../hooks/useHistory"
import { StoreContext } from "../../../../hooks/useStores"
import {
  captureTempoSnapshot,
  commitTempoBaseline,
} from "../../../../services/TempoBaseline"
import type RootStore from "../../../../stores/RootStore"
import { TempoEditorProvider } from "../../context/TempoEditorProvider"
import { ScaleTempoButton } from "./ScaleTempoButton"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
})

const advance = (milliseconds: number) =>
  act(() => vi.advanceTimersByTime(milliseconds))

function finishAdjustment() {
  advance(500)
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
}

function HistoryControls() {
  const { undo, redo, hasUndo } = useHistory()
  return (
    <>
      <button type="button" disabled={!hasUndo} onClick={undo}>
        Undo
      </button>
      <button type="button" onClick={redo}>
        Redo
      </button>
    </>
  )
}

function setup() {
  const songStore = new SongStore()
  const track = songStore.song.conductorTrack
  if (!track) {
    throw new Error("Missing conductor track")
  }
  const editor = createTempoEditor(track)
  editor.createOrUpdateItem(0, 120)
  editor.createOrUpdateItem(480, 96)
  editor.createOrUpdateItem(960, 72)
  const player = { position: 600, currentTempo: 96 }

  render(
    <Provider>
      <StoreContext.Provider value={{ songStore, player } as RootStore}>
        <TempoEditorProvider>
          <ScaleTempoButton />
          <HistoryControls />
        </TempoEditorProvider>
      </StoreContext.Provider>
    </Provider>,
  )
  return { songStore, player, editor }
}

function applyPercent(percent: number) {
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
    target: { value: String(percent) },
  })
  finishAdjustment()
}

it("uses the selected position as reference and scales the whole song in one undo step", () => {
  const { songStore, player, editor } = setup()
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  expect(screen.getByLabelText("BPM")).toHaveValue(96)
  // Playback moving while the dialog is open must not change its reference.
  player.position = 1000
  fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
    target: { value: "50" },
  })
  expect(screen.getByLabelText("BPM")).toHaveValue(48)
  expect(editor.listItems()[0].bpm).toBe(120)
  advance(499)
  expect(editor.listItems()[0].bpm).toBe(120)
  advance(1)
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
  editor
    .listItems()
    .forEach((item, i) => expect(item.bpm).toBeCloseTo([60, 48, 36][i], 3))
  expect(player.currentTempo).toBeCloseTo(36, 3)

  act(() => fireEvent.click(screen.getByRole("button", { name: "Undo" })))
  expect(songStore.song.conductorTrack?.getTempo(0)).toBe(120)
  expect(songStore.song.conductorTrack?.getTempo(480)).toBe(96)
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
  act(() => fireEvent.click(screen.getByRole("button", { name: "Redo" })))
  expect(songStore.song.conductorTrack?.getTempo(0)).toBe(60)
  expect(songStore.song.conductorTrack?.getTempo(960)).toBeCloseTo(36, 3)
})

it("uses absolute percentages on reopening and resets the original tempo map", () => {
  const { songStore } = setup()
  applyPercent(50)
  // A second adjustment is absolute relative to the file, never compounded.
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  expect(screen.getByLabelText("BPM")).toHaveValue(48)
  expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(50)
  fireEvent.change(screen.getByLabelText("Tempo scale (%)"), {
    target: { value: "60" },
  })
  finishAdjustment()
  expect(songStore.song.conductorTrack?.getTempo(0)).toBeCloseTo(72, 3)

  // Reopen and restore the entire original map through automatic Reset.
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  fireEvent.click(screen.getByRole("button", { name: "Reset" }))
  finishAdjustment()
  expect(songStore.song.conductorTrack?.getTempo(0)).toBe(120)
  expect(songStore.song.conductorTrack?.getTempo(480)).toBe(96)
})

it("keeps a saved baseline after undo and resets to that saved map", () => {
  const { songStore } = setup()
  // A successful MIDI save defines the new 100%; undoing must not undo that save.
  applyPercent(50)
  commitTempoBaseline(songStore.song, captureTempoSnapshot(songStore.song))
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(100)
  expect(screen.getByLabelText("BPM")).toHaveValue(48)
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
  fireEvent.click(screen.getByRole("button", { name: "Undo" }))
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  expect(screen.getByLabelText("Tempo scale (%)")).toHaveValue(200)
  fireEvent.click(screen.getByRole("button", { name: "Reset" }))
  finishAdjustment()
  expect(songStore.song.conductorTrack?.getTempo(480)).toBe(48)
})

it("applies repeated adjustments in the same dialog with one undo step per settled value", () => {
  const { songStore } = setup()
  fireEvent.click(screen.getByRole("button", { name: "Scale Tempo" }))
  const input = screen.getByLabelText("Tempo scale (%)")
  fireEvent.change(input, { target: { value: "40" } })
  advance(500)
  expect(songStore.song.conductorTrack?.getTempo(0)).toBe(48)
  fireEvent.change(input, { target: { value: "80" } })
  advance(300)
  fireEvent.change(input, { target: { value: "60" } })
  advance(500)
  expect(songStore.song.conductorTrack?.getTempo(0)).toBeCloseTo(72, 3)
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
  fireEvent.click(screen.getByRole("button", { name: "Undo" }))
  expect(songStore.song.conductorTrack?.getTempo(0)).toBe(48)
  fireEvent.click(screen.getByRole("button", { name: "Undo" }))
  expect(songStore.song.conductorTrack?.getTempo(0)).toBe(120)
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
})
