# Arrange Feature

## Purpose

The arrangement view: all tracks on one timeline, for editing sections and tracks.

## Entry Point

`ArrangeEditor` is the feature's root component. It provides the arrange editor and the timeline scope, and renders the toolbar, the `ArrangeView` timeline, and the transpose and velocity dialogs.

## Responsibilities

- Draw every track's notes on a shared timeline.
- Select ranges across tracks. Move, duplicate, delete, copy, and paste them.
- Transpose a selection and change its velocity.
- Track actions, such as inserting and duplicating tracks.
- Notes and track headers share the track colors used in the piano roll.
- Fit horizontal frames the entire song; Fit vertical frames all displayed tracks; Fit all combines both.

## Design Notes

- Event editing uses the arrange editor package. The feature holds only UI state, such as selection and open dialogs.
- Selection state is part of undo and redo.
- Scrolling, quantization, and beat display are shared with other timeline features.
