import type { TrackId } from "@signal-app/core"
import { Emitter } from "@signal-app/observable"
import type { SendableEvent, SynthOutput } from "@signal-app/player"
import { METRONOME_TRACK_ID } from "../player/EventSource"

export type PlayingNote = {
  trackId: TrackId
  channel: number
  noteNumber: number
}

// Observe the same timestamps as the synth, rather than the playhead, which
// advances ahead of the sound to schedule MIDI events.
export class PlaybackNotes implements SynthOutput {
  private playing = false
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()
  private readonly notes = new Map<string, PlayingNote & { count: number }>()
  private snapshot: readonly PlayingNote[] = []
  readonly onChanged = new Emitter()

  constructor(private readonly output: SynthOutput) {}

  getSnapshot = () => this.snapshot

  activate() {
    this.output.activate()
  }

  setPlaying(playing: boolean) {
    this.playing = playing
    if (!playing) {
      this.clear()
    }
  }

  clear() {
    for (const timer of this.timers) {
      clearTimeout(timer)
    }
    this.timers.clear()
    if (this.notes.size > 0) {
      this.notes.clear()
      this.publish()
    }
  }

  sendEvent(
    event: SendableEvent,
    delayTime: number,
    timestampNow: number,
    trackId?: number,
  ) {
    // Forward audio unchanged, including events from hidden tracks.
    this.output.sendEvent(event, delayTime, timestampNow, trackId)
    if (
      !this.playing ||
      event.type !== "channel" ||
      trackId === METRONOME_TRACK_ID
    ) {
      return
    }
    const isNote = event.subtype === "noteOn" || event.subtype === "noteOff"
    const isReset =
      event.subtype === "controller" &&
      (event.controllerType === 120 || event.controllerType === 123)
    if ((!isNote || trackId === undefined) && !isReset) {
      return
    }

    const apply = () => {
      if (event.subtype === "controller") {
        let changed = false
        for (const [key, note] of this.notes) {
          if (note.channel === event.channel) {
            this.notes.delete(key)
            changed = true
          }
        }
        if (changed) {
          this.publish()
        }
      } else if (
        (event.subtype === "noteOn" || event.subtype === "noteOff") &&
        trackId !== undefined
      ) {
        const key = `${trackId}/${event.channel}/${event.noteNumber}`
        const previous = this.notes.get(key)
        if (event.subtype === "noteOn" && event.velocity > 0) {
          this.notes.set(key, {
            trackId: trackId as TrackId,
            channel: event.channel,
            noteNumber: event.noteNumber,
            count: (previous?.count ?? 0) + 1,
          })
          if (!previous) {
            this.publish()
          }
        } else if (previous) {
          if (previous.count > 1) {
            previous.count--
          } else {
            this.notes.delete(key)
            this.publish()
          }
        }
      }
    }
    const wait =
      timestampNow + Math.max(0, delayTime) * 1000 - performance.now()
    if (wait <= 0) {
      apply()
    } else {
      const timer = setTimeout(() => {
        this.timers.delete(timer)
        apply()
      }, wait)
      this.timers.add(timer)
    }
  }

  private publish() {
    this.snapshot = [...this.notes.values()].map(
      ({ trackId, channel, noteNumber }) => ({ trackId, channel, noteNumber }),
    )
    this.onChanged.emit()
  }
}
