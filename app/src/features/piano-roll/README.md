# Piano Roll Feature

## Purpose

The main note editing surface.

## Entry Point

`PianoRollEditor` is the feature's root component. It lays out the track list, the `PianoRoll` canvas, the event list, and the toolbar in split panes, and mounts the piano roll dialogs and edit menu.

## Responsibilities

- Draw the note grid, notes, and keyboard.
- Create, select, move, resize, and delete notes.
- Show other tracks' notes as ghost notes.
- During playback, piano keys light on the actual scheduled Note On and release on Note Off. Simultaneous tracks share color stripes on the key. Stop clears pending highlights; seek and loop resets follow the same channel resets as audio.
- Per-track eye buttons hide notes, playback key colors and the selected track's instrument/velocity/controller visuals without changing MIDI playback. Hidden tracks are excluded from vertical fitting. A new document starts with all tracks shown.
- Draw shared notes as stacked color stripes over their overlapping sections, including overlaps between ghost tracks. Hit areas still belong to the selected track.
- Fit horizontal shows the entire song; Fit vertical frames the pitches of the selected and visible ghost tracks; Fit all combines both.
- Quantize, transpose, copy, and paste notes. Preview notes while editing.
- Coordinate nearby panes, such as the control pane and event list.

## Design Notes

- Note editing uses the piano roll editor package. The feature holds only UI state, such as selected track, selection, and tool.
- Selection state is part of undo and redo.
- Drawing is GPU-accelerated to stay smooth with many notes.
