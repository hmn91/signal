# Control Pane Feature

## Purpose

The pane below the piano roll. Edits note velocity and continuous values, such as pitch bend and controllers.

## Entry Point

`ControlPane` is the feature's root component. It shows the velocity lane or a value lane for the selected mode, and provides the matching editor to it.

## Responsibilities

- Switch between the velocity lane and value lanes.
- Draw and edit values with pencil, curve, and selection tools.
- Copy, paste, and delete selected points.
- Separate horizontal, vertical and combined Fit buttons are available for velocity and every value lane. Horizontal fitting shares the piano roll timeline and covers the entire song; vertical fitting uses the current track and lane, with independent ranges per lane.

## Design Notes

- Value lanes use the control editor package. The velocity lane uses the velocity editor package. Neither uses the piano roll's editor.
- Chosen lanes persist across sessions.
- Selection state is part of undo and redo.
