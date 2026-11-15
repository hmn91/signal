import * as fs from "fs"
import * as path from "path"
import { describe, expect, it, vi } from "vitest"
import { songFromMidi, songToMidi, timeSignatureMidiEvent } from "../../midi"
import { toTrackEvents } from "../../midi/toTrackEvents"
import {
  getPan,
  getProgramChangeEvent,
  getTempo,
  getVolume,
} from "../event/selectors"
import { emptyTrack } from "../track"
import { Song } from "./Song"
import { emptySong } from "./SongFactory"

describe("Song", () => {
  const song = songFromMidi(
    new DataView(
      fs.readFileSync(path.join(__dirname, "../../../testdata/tracks.mid"))
        .buffer,
    ),
  )

  it("fromMidi", () => {
    expect(song).not.toBeNull()
    const { tracks } = song
    expect(tracks.length).toBe(18)

    expect(tracks[0].isConductorTrack).toBeTruthy()
    expect(!tracks[1].isConductorTrack).toBeTruthy()
    expect(tracks[1].channel).toBe(0)
    expect(tracks[2].channel).toBe(0)
    expect(tracks[3].channel).toBe(1)
    expect(tracks[17].channel).toBe(15)

    expect(getTempo(240)(tracks[0].events)).toBe(128)
    expect(getVolume(193)(tracks[2].events)?.value).toBe(100)
    expect(getPan(192)(tracks[2].events)?.value).toBe(1)
    expect(getProgramChangeEvent(189)(tracks[2].events)?.value).toBe(29)
  })

  it("should be serializable", () => {
    const song = emptySong()
    song.filepath = "abc"
    const x = song.serialize()
    const s = Song.deserialize(x)
    expect(s.filepath).toBe("abc")
    expect(s.tracks.length).toBe(song.tracks.length)
  })

  it("should deserialize from its own serialized POJO", () => {
    const song = emptySong()
    song.filepath = "abc"
    song.name = "test"

    const restored = Song.deserialize(song.serialize())

    expect(restored.serialize()).toStrictEqual(song.serialize())
  })

  it("should serialize to a POJO", () => {
    const song = emptySong()
    song.filepath = "abc"
    song.name = "test"

    const serialized = song.serialize()

    expect(serialized).toMatchObject({
      tracks: song.tracks.map((track) => track.serialize()),
      name: "test",
      filepath: "abc",
      timebase: song.timebase,
      isSaved: song.isSaved,
    })
    expect(serialized.lastTrackId).toBeGreaterThanOrEqual(song.tracks.length)
  })

  it("should use Track.serialize when serializing song", () => {
    const song = emptySong()
    const spy = vi.spyOn(song.tracks[0], "serialize")

    song.serialize()

    expect(spy).toHaveBeenCalled()
  })

  it("should assign id to track", () => {
    const song = emptySong()
    song.addTrack(emptyTrack(0))
    song.addTrack(emptyTrack(2))
    song.addTrack(emptyTrack(4))
    expect(song.tracks[0].id).toBe(0)
    expect(song.tracks[1].id).toBe(1)
    expect(song.tracks[2].id).toBe(2)
    song.removeTrack(song.tracks[1].id)
    song.addTrack(emptyTrack(8))
    expect(song.tracks[2].id).toBe(3)
  })

  it("addNewTrack and insertNewTrack add empty tracks", () => {
    const song = emptySong()
    const count = song.tracks.length

    song.addNewTrack()
    song.insertNewTrack(1)

    expect(song.tracks.length).toBe(count + 2)
    expect(song.tracks[1].isConductorTrack).toBe(false)
  })

  it("duplicateTrack inserts a copy after the track", () => {
    const song = emptySong()
    const source = song.tracks[1]

    song.duplicateTrack(source.id)

    expect(song.tracks[2].id).not.toBe(source.id)
    expect(song.tracks[2].events.length).toBe(source.events.length)
  })

  it("moveTrack moves a track to the position of another", () => {
    const song = emptySong()
    song.addNewTrack()
    const [, first, second] = song.tracks

    song.moveTrack(second.id, first.id)

    expect(song.tracks[1]).toBe(second)
    expect(song.tracks[2]).toBe(first)
  })

  it("reorders tracks in one change and keeps identities and MIDI channels", () => {
    const song = emptySong()
    song.addNewTrack()
    const [conductor, first, second] = song.tracks
    const channels = song.tracks.map((track) => track.channel)
    const changed = vi.fn()
    song.onTracksChanged.subscribe(changed)
    song.isSaved = true

    song.reorderTracks([conductor.id, second.id, first.id])

    expect(song.tracks).toEqual([conductor, second, first])
    expect(song.tracks.map((track) => track.channel)).toEqual([
      channels[0],
      channels[2],
      channels[1],
    ])
    expect(changed).toHaveBeenCalledTimes(1)
    expect(song.isSaved).toBe(false)
    expect(
      Song.deserialize(song.serialize()).tracks.map((track) => track.id),
    ).toEqual([conductor.id, second.id, first.id])
  })

  it("rejects incomplete, duplicate and stale track orders without dirtying the song", () => {
    const song = emptySong()
    const ids = song.tracks.map((track) => track.id)
    const changed = vi.fn()
    song.onTracksChanged.subscribe(changed)
    song.isSaved = true

    song.reorderTracks(ids.slice(1))
    song.reorderTracks(ids.map(() => ids[0]))
    song.reorderTracks(ids)
    song.reorderTracks([...ids.slice(1), 999 as (typeof ids)[number]])

    expect(song.tracks.map((track) => track.id)).toEqual(ids)
    expect(changed).not.toHaveBeenCalled()
    expect(song.isSaved).toBe(true)
  })

  it("should restore measures when opening midi", () => {
    const song = emptySong()
    song.timebase = 960
    song.conductorTrack?.addEvents(
      toTrackEvents([timeSignatureMidiEvent(3840, 3, 4)]),
    )

    const reopenedSong = songFromMidi(songToMidi(song))

    expect(reopenedSong.measures).toStrictEqual([
      {
        tick: 0,
        measure: 0,
        numerator: 4,
        denominator: 4,
      },
      {
        tick: 3840,
        measure: 1,
        numerator: 3,
        denominator: 4,
      },
    ])
  })

  it("should notify endOfSong changes when track endOfTrack changes", () => {
    const song = emptySong()
    const notifications: number[] = []

    song.onEndOfSongChanged.subscribe(() => {
      notifications.push(song.endOfSong)
    })

    song.tracks[1].addEvents(
      toTrackEvents([
        {
          type: "channel",
          subtype: "noteOn",
          channel: 0,
          noteNumber: 60,
          velocity: 100,
          deltaTime: 0,
        },
        {
          type: "channel",
          subtype: "noteOff",
          channel: 0,
          noteNumber: 60,
          velocity: 0,
          deltaTime: 960,
        },
      ]),
    )

    expect(notifications.length).toBeGreaterThan(0)
  })
})
