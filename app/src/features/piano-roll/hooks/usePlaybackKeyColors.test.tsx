import {
  noteOnMidiEvent,
  SongStore,
  trackColorToCSSColor,
} from "@signal-app/core"
import { act, cleanup, renderHook } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { defaultTrackColor } from "../../../helpers/trackColor"
import { useTrackMute } from "../../../hooks/useTrackMute"
import { PlaybackNotes } from "../../../services/PlaybackNotes"
import { usePianoRoll } from "./usePianoRoll"
import { usePlaybackKeyColors } from "./usePlaybackKeyColors"

const state = vi.hoisted(() => ({
  stores: {} as { songStore: SongStore; playbackNotes: PlaybackNotes },
}))
vi.mock("../../../hooks/useStores", () => ({
  useStores: () => ({ ...state.stores, player: {} }),
}))

const createOutput = () => ({ activate: vi.fn(), sendEvent: vi.fn() })
let output: ReturnType<typeof createOutput>
beforeEach(() => {
  output = createOutput()
  const songStore = new SongStore()
  songStore.song.addNewTrack()
  songStore.song.isSaved = true
  const playbackNotes = new PlaybackNotes(output)
  playbackNotes.setPlaying(true)
  state.stores = { songStore, playbackNotes }
})
afterEach(() => {
  state.stores.playbackNotes.clear()
  cleanup()
})

function setup() {
  const store = createStore()
  return renderHook(
    () => {
      const {
        hiddenTrackIds,
        ghostTrackIds,
        setSelectedTrackId,
        toggleTrackVisibility,
        setNotGhostTrackIds,
        setSelection,
        setSelectedNoteIds,
        selectedNoteIds,
      } = usePianoRoll()
      const { mute, solo } = useTrackMute()
      return {
        colors: usePlaybackKeyColors(),
        hiddenTrackIds,
        ghostTrackIds,
        setSelectedTrackId,
        toggleTrackVisibility,
        setNotGhostTrackIds,
        setSelection,
        setSelectedNoteIds,
        selectedNoteIds,
        mute,
        solo,
      }
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    },
  )
}

describe("playback key colors and track visibility", () => {
  it("shows every track color for a shared key, including black keys", () => {
    const { result } = setup()
    const [, first, second] = state.stores.songStore.song.tracks
    act(() => result.current.setSelectedTrackId(first.id))
    act(() => {
      state.stores.playbackNotes.sendEvent(
        noteOnMidiEvent(0, 1, 61, 100),
        0,
        performance.now(),
        second.id,
      )
      state.stores.playbackNotes.sendEvent(
        noteOnMidiEvent(0, 0, 61, 100),
        0,
        performance.now(),
        first.id,
      )
    })
    expect(result.current.colors.get(61)).toEqual(
      [first, second].map((track) =>
        trackColorToCSSColor(defaultTrackColor(track.id)),
      ),
    )
    act(() => first.setColor({ red: 0, green: 0, blue: 255, alpha: 255 }))
    expect(result.current.colors.get(61)?.[0]).toBe("rgba(0, 0, 255, 1)")
    act(() => state.stores.playbackNotes.setPlaying(false))
    expect(result.current.colors.size).toBe(0)
  })

  it("hides selected and ghost tracks without changing audio, MIDI or selection of the track", () => {
    const { result } = setup()
    const song = state.stores.songStore.song
    const [, first, second] = song.tracks
    const before = song.serialize()
    act(() => result.current.setSelectedTrackId(first.id))
    act(() => {
      state.stores.playbackNotes.sendEvent(
        noteOnMidiEvent(0, 0, 60, 100),
        0,
        performance.now(),
        first.id,
      )
      state.stores.playbackNotes.sendEvent(
        noteOnMidiEvent(0, 1, 60, 100),
        0,
        performance.now(),
        second.id,
      )
    })
    const sounds = output.sendEvent.mock.calls.length
    act(() => result.current.toggleTrackVisibility(first.id))
    expect(result.current.colors.get(60)).toHaveLength(1)
    act(() => result.current.toggleTrackVisibility(second.id))
    expect(result.current.colors.size).toBe(0)
    expect(result.current.ghostTrackIds).not.toContain(second.id)
    expect(song.serialize()).toEqual(before)
    expect(output.sendEvent).toHaveBeenCalledTimes(sounds)
    act(() => result.current.toggleTrackVisibility(first.id))
    expect(result.current.colors.get(60)).toHaveLength(1)
  })

  it("Show restores tracks hidden by the ghost filter and mute/solo still control key lights", () => {
    const { result } = setup()
    const [, first, second] = state.stores.songStore.song.tracks
    act(() => {
      result.current.setSelectedTrackId(first.id)
      result.current.setNotGhostTrackIds(new Set([second.id]))
      state.stores.playbackNotes.sendEvent(
        noteOnMidiEvent(0, 1, 60, 100),
        0,
        performance.now(),
        second.id,
      )
    })
    expect(result.current.colors.size).toBe(0)
    act(() => result.current.toggleTrackVisibility(second.id))
    expect(result.current.colors.get(60)).toHaveLength(1)
    act(() => result.current.mute(second.id))
    expect(result.current.colors.size).toBe(0)
    act(() => result.current.solo(second.id))
    expect(result.current.colors.get(60)).toHaveLength(1)
  })
})
