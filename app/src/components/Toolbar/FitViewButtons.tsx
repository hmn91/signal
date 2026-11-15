import { ToolbarButton, Tooltip } from "@signal-app/ui"
import ArrowExpandAllIcon from "mdi-react/ArrowExpandAllIcon"
import ArrowExpandHorizontalIcon from "mdi-react/ArrowExpandHorizontalIcon"
import ArrowExpandVerticalIcon from "mdi-react/ArrowExpandVerticalIcon"

export function FitViewButtons({
  onFitHorizontal,
  onFitVertical,
}: {
  onFitHorizontal: () => void
  onFitVertical: () => void
}) {
  return (
    <fieldset
      aria-label="Fit to screen"
      style={{
        display: "flex",
        flexShrink: 0,
        minWidth: 0,
        margin: 0,
        padding: 0,
        border: 0,
      }}
    >
      <Tooltip title="Fit horizontal — entire song">
        <ToolbarButton aria-label="Fit horizontal" onClick={onFitHorizontal}>
          <ArrowExpandHorizontalIcon size="1.2rem" aria-hidden="true" />
        </ToolbarButton>
      </Tooltip>
      <Tooltip title="Fit vertical — displayed content">
        <ToolbarButton aria-label="Fit vertical" onClick={onFitVertical}>
          <ArrowExpandVerticalIcon size="1.2rem" aria-hidden="true" />
        </ToolbarButton>
      </Tooltip>
      <Tooltip title="Fit all — both axes">
        <ToolbarButton
          aria-label="Fit all"
          onClick={() => {
            onFitHorizontal()
            onFitVertical()
          }}
        >
          <ArrowExpandAllIcon size="1.2rem" aria-hidden="true" />
        </ToolbarButton>
      </Tooltip>
    </fieldset>
  )
}
