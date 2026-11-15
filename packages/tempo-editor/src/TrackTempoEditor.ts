import { isSetTempoEvent, type Track } from "@signal-app/core"
import type { Unsubscribe } from "@signal-app/observable"
import type { TempoItem } from "./entities"
import { scaleTempoSnapshot, type TempoSnapshot } from "./TempoSnapshot"
import { addTempoItem, updateTempoItems } from "./trackMutations/tempo"
import { getTempoItemById, getTempoItems } from "./trackQueries/tempo"

export class TrackTempoEditor {
  constructor(private readonly conductorTrack: Track) {}

  getItems = (): readonly TempoItem[] => getTempoItems(this.conductorTrack)

  getTempoSnapshot = (): TempoSnapshot =>
    this.conductorTrack.events.filter(isSetTempoEvent).map((event) => ({
      tick: event.tick,
      microsecondsPerBeat: event.microsecondsPerBeat,
    }))

  applyTempoSnapshot = (snapshot: TempoSnapshot, percent: number): void => {
    const source = scaleTempoSnapshot(snapshot, percent)
    const existing = this.conductorTrack.events.filter(isSetTempoEvent)
    const byTick = new Map<number, typeof existing>()
    existing.forEach((event) => {
      const events = byTick.get(event.tick) ?? []
      events.push(event)
      byTick.set(event.tick, events)
    })
    source.forEach((event) => {
      const current = byTick.get(event.tick)?.shift()
      const value = {
        type: "meta" as const,
        subtype: "setTempo" as const,
        tick: event.tick,
        microsecondsPerBeat: event.microsecondsPerBeat,
      }
      if (current) {
        this.conductorTrack.updateEvent(current.id, value)
      } else {
        this.conductorTrack.addEvent(value)
      }
    })
    byTick.forEach((events) =>
      events.forEach((event) => this.removeItem(event.id)),
    )
  }

  getById = (id: number): TempoItem | undefined =>
    getTempoItemById(id)(this.conductorTrack)

  addItem = (item: Omit<TempoItem, "id">): TempoItem =>
    addTempoItem(item)(this.conductorTrack)

  removeItem = (id: number): void => {
    this.conductorTrack.removeEvent(id)
  }

  updateItem = (item: TempoItem): void =>
    updateTempoItems([item])(this.conductorTrack)

  observeItems = (listener: () => void): Unsubscribe =>
    this.conductorTrack.subscribeEventsChanged(isSetTempoEvent, listener)
}
