import { useTheme } from "@emotion/react"
import { type TrackId, trackColorToVec4 } from "@signal-app/core"
import Color from "color"
import { vec4 } from "gl-matrix"
import { colorToVec4 } from "../../../gl/color"
import { useTrackColor } from "../../../hooks/useTrackColor"

interface NoteStyle {
  inactiveColor: vec4
  activeColor: vec4
  selectedColor: vec4
  strokeColor: vec4
}

export const useGhostNoteColor = (trackId: TrackId): NoteStyle => {
  const theme = useTheme()
  const color = useTrackColor(trackId)

  const ghostNoteColor = colorToVec4(Color(theme.ghostNoteColor))
  const transparentColor = vec4.zero(vec4.create())
  const trackColor = trackColorToVec4(color)
  const ghostedColor = vec4.lerp(
    vec4.create(),
    trackColor,
    ghostNoteColor,
    0.18,
  )

  return {
    inactiveColor: transparentColor,
    activeColor: ghostedColor,
    selectedColor: ghostedColor,
    strokeColor: transparentColor,
  }
}
