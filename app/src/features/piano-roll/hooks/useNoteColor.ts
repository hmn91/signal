import { useTheme } from "@emotion/react"
import { trackColorToCSSColor } from "@signal-app/core"
import Color from "color"
import { colorToVec4, enhanceContrast } from "../../../gl/color"
import { useTrackColor } from "../../../hooks/useTrackColor"
import { usePianoRoll } from "./usePianoRoll"

export function useNoteColor() {
  const { selectedTrackId } = usePianoRoll()
  const trackColor = useTrackColor(selectedTrackId)
  const theme = useTheme()

  const baseColor = Color(trackColorToCSSColor(trackColor))

  return {
    baseColor, // for LegacyNotes
    backgroundColor: Color(theme.backgroundColor), // for LegacyNotes
    selectedColor: colorToVec4(baseColor.lighten(0.7)),
    borderColor: colorToVec4(
      enhanceContrast(baseColor, theme.isLightContent, 0.3),
    ),
    inactiveColor: colorToVec4(Color(theme.backgroundColor)),
    activeColor: colorToVec4(baseColor),
  }
}
