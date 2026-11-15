import { FitViewButtons } from "../../../components/Toolbar/FitViewButtons"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useControlEditor } from "../hooks/useControlEditor"
import { useControlRange } from "../hooks/useControlRange"
import { useVelocityEditor } from "../hooks/useVelocityEditor"

export function VelocityFitButtons() {
  const { fitHorizontal } = useTickScroll()
  const { fitVertical } = useControlRange()
  const editor = useVelocityEditor()
  return (
    <FitViewButtons
      onFitHorizontal={fitHorizontal}
      onFitVertical={() =>
        fitVertical(
          editor.getNotesInRange([0, Infinity]).map((note) => note.velocity),
        )
      }
    />
  )
}

export function ControlFitButtons() {
  const { fitHorizontal } = useTickScroll()
  const { fitVertical } = useControlRange()
  const editor = useControlEditor()
  return (
    <FitViewButtons
      onFitHorizontal={fitHorizontal}
      onFitVertical={() =>
        fitVertical(
          editor
            .getItemsInRangeWithPrevious([0, Infinity])
            .map((item) => item.value),
        )
      }
    />
  )
}
