import styled from "@emotion/styled"
import type { Song, TrackId } from "@signal-app/core"
import SwapVerticalIcon from "mdi-react/SwapVerticalIcon"
import { type FC, useRef, useState } from "react"
import { DraggableList } from "../../../components/DraggableList/DraggableList"
import { useHistory } from "../../../hooks/useHistory"
import { useSong } from "../../../hooks/useSong"
import { useTrackList } from "../hooks/useTrackList"
import { AddTrackButton } from "./AddTrackButton"
import { TrackListItem } from "./TrackListItem"

const List = styled.div`
  overflow-y: auto;
  background: var(--color-background);
  min-width: 14rem;
  flex-grow: 1;
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 0.5rem;
  padding: 0.5rem;

  &[data-editing="true"] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Action = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.5rem 0.25rem;
  font-size: 0.75rem;
  white-space: nowrap;
  border: 1px solid var(--color-divider);
  border-radius: 0.4rem;
  background: var(--color-background-secondary);
  color: var(--color-text);
  cursor: pointer;
  &:hover { background: var(--color-highlight); }
  &:disabled { opacity: 0.4; cursor: default; }
`

type ReorderDraft = {
  song: Song
  originalIds: string
  ids: TrackId[]
}

export const TrackList: FC = () => {
  const { trackIds } = useTrackList()
  const { getSong } = useSong()
  const { pushHistory } = useHistory()
  const [draft, setDraft] = useState<ReorderDraft | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const song = getSong()
  const originalIds = trackIds.join(",")
  // Opening a file, undoing, adding or deleting a track invalidates the draft.
  const editing = draft?.song === song && draft.originalIds === originalIds

  const finish = () => {
    setDraft(null)
    // Save/Cancel disappear after editing. Keep shortcuts focused in the editor.
    listRef.current?.focus()
  }

  const save = () => {
    if (!editing) {
      return
    }
    if (draft.ids.join(",") !== originalIds) {
      let index = 0
      const ids = song.tracks.map((track) =>
        track.isConductorTrack ? track.id : draft.ids[index++],
      )
      pushHistory()
      song.reorderTracks(ids)
    }
    finish()
  }

  return (
    <List ref={listRef} tabIndex={-1}>
      <DraggableList
        enabled={editing}
        items={editing ? draft.ids : trackIds}
        getItemId={(trackId) => trackId}
        getItemLabel={(trackId) =>
          `Re-order ${song.getTrack(trackId)?.name || `Track ${Number(trackId)}`}`
        }
        onItemMoved={(id, overId) =>
          setDraft((previous) => {
            if (!previous) {
              return null
            }
            const ids = [...previous.ids]
            const from = ids.indexOf(id)
            const to = ids.indexOf(overId)
            if (from < 0 || to < 0) {
              return previous
            }
            ids.splice(to, 0, ...ids.splice(from, 1))
            return { ...previous, ids }
          })
        }
        render={(trackId) => (
          <div inert={editing}>
            <TrackListItem key={trackId} trackId={trackId} />
          </div>
        )}
      ></DraggableList>
      <Actions data-editing={editing}>
        {editing ? (
          <>
            <Action type="button" onClick={save}>
              Save
            </Action>
            <Action type="button" onClick={finish}>
              Cancel
            </Action>
          </>
        ) : (
          <>
            <AddTrackButton />
            <Action
              type="button"
              disabled={trackIds.length < 2}
              onClick={() => setDraft({ song, originalIds, ids: trackIds })}
            >
              <SwapVerticalIcon size={18} />
              Re-order
            </Action>
          </>
        )}
      </Actions>
    </List>
  )
}
