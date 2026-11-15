# Track List Feature

## Purpose

The track list and per-track controls.

## Entry Point

`TrackList` renders one `TrackListItem` per track, plus an add-track button. Rows can only be dragged after enabling Re-order. Save applies the draft order as one undoable edit; Cancel discards it. The conductor stays in its original position. Opening another song or changing the track collection invalidates the draft.

## Responsibilities

- Show each track's name, instrument, and activity.
- Mute, solo, and show a track as ghost notes.
- Add, reorder, rename, and remove tracks.

## Design Notes

- Track changes are song-level edits and are part of undo and redo.
- Add Track and Re-order share a normal row after the tracks, with a 2:1 width ratio. During reordering, Save and Cancel replace that row. The controls do not use a sticky layer above menus.
- Track icons and notes use the MIDI track color when present, otherwise an automatic color derived from the track ID. Reordering does not change the color.
