# Tempo Editor Feature

## Purpose

Edit the song's tempo as a graph over time.

## Entry Point

`TempoEditor` is the feature's root component. It sets up the timeline scope and renders the toolbar and the `TempoGraph`.

## Responsibilities

- Draw tempo changes on the timeline.
- Separate Fit horizontal, Fit vertical and Fit all controls frame the entire song, the current tempo range, or both. Fitting only changes the viewport.
- Draw, select, move, delete, copy, and paste tempo points.
- Scale Tempo references the original MIDI tempo map at the selected playhead, captured when opening a document. Percentage (1–200%) and BPM inputs are linked; a large touch dial follows circular finger/mouse movement: clockwise increases, counterclockwise decreases. A 270-degree turn spans the full range with 100% centred at the top; each side has a 135-degree arc. Grabbing does not jump the value; crossing the angular seam stays continuous, and movement near the centre is ignored. Wheel and arrow keys also work. Repeated adjustments are absolute relative to the original, never compounded. Changes apply automatically after 500 ms without further edits, only after all fingers or mouse buttons are released. Each settled adjustment is one undo step. Reset automatically restores 100%; the dialog stays open, and Close preserves applied changes while cancelling any pending timer. Only a successful local MIDI save or browser MIDI download handoff rebases the original; cloud saves and audio exports do not. Undo/redo and autosave recovery preserve the document's baseline.

## Design Notes

- Tempo editing uses the tempo editor package. The feature holds only UI state, such as tool and selection.
- Selection state is part of undo and redo.
- Scrolling, quantization, and beat display are shared with other timeline features.

The compact dialog orders its controls as Original BPM with Reset, linked percentage/BPM inputs, then a graduated rotary knob without a centre readout. A close icon sits beside the title; explanatory paragraphs and footer buttons are omitted.

Each editable value has accessible minus/plus buttons: one percentage point per tap for %, one BPM per tap for BPM, clamped to the 1–200% range. The same 500 ms release/debounce rule applies.
