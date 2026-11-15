import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useSong } from "../../../hooks/useSong"

export function useTrackList() {
  const { tracks, addNewTrack } = useSong()
  const trackIds = tracks
    .filter((track) => !track.isConductorTrack)
    .map((track) => track.id)
  const { pushHistory } = useHistory()

  return {
    get isOpen() {
      return useAtomValue(isOpenAtom)
    },
    setOpen: useSetAtom(isOpenAtom),
    trackIds,
    addTrack: useCallback(() => {
      pushHistory()
      addNewTrack()
    }, [pushHistory, addNewTrack]),
  }
}

// atoms
const isOpenAtom = atom(false)
