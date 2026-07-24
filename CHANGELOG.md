## [0.6.0] - 2026-07-24

Requires **bg3-hud-core 0.6.0**.

Housekeeping release, plus a fix for players not seeing their settings menu.

### Fixed
- **Players can open the Display menu**: The Display settings menu was locked to GMs, so players couldn't set their own preferences (item names, item uses, portrait source). It's now available to everyone, and each player's choices apply only to their own view.

### Changed
- **Quieter console**: Routine console messages are now hidden unless you turn on the new Debug Logging setting in the Core module. Warnings and errors still show.
- **Under-the-hood cleanup**: Consolidated a little duplicated logic. No visible change.

## [0.4.1] - 2026-06-17

Requires **bg3-hud-core 0.4.1**.

### Added
- **Initial Crucible adapter**: BG3 Inspired HUD support for the Crucible system — action-based hotbar, portrait resources, filters, and live action tooltips.
- **Portrait resource badges**: Health, morale, action points, focus, and physical defence shown on the portrait at a glance.
- **Action hotbar cells**: Hotbar slots built from `actor.actions`, including drag-and-drop from the Crucible character sheet.
- **Shift-click actions**: Hold Shift when clicking a hotbar action to skip the configuration dialog and use it immediately.
- **Action filters**: Filter buttons for action cost, strikes, spells, movement, and favourites; action-point pips refresh when resources change.
- **Auto-populate and auto-sort**: Populate grids from action categories (all, favourites, strikes, spells, movement) with adapter-aware sorting.
- **Crucible tooltips**: Action cells use system tooltip cards on hover; middle-click pins tooltips on HUD elements (core tooltip handling stays out of the way).

### Known limitations
- No BG3 HUD target-selector integration (Crucible handles targeting).
- No resource-depletion overlays on cells.
- Passives and weapon-set panels not implemented.
- Group actors are excluded.
