# BG3 Inspired HUD - Crucible

A [Crucible](https://foundryvtt.com/packages/crucible) system adapter for the BG3 Inspired HUD.

## Requirements

- Foundry VTT v14
- [bg3-hud-core](https://github.com/BragginRites/bg3-hud-core) v0.4.1+
- The Crucible game system v0.9.0+

## Features (MVP)

- Portrait resource badges (health, morale, action points, focus, physical defence)
- Action-based hotbar cells from `actor.actions`
- Drag actions from the Crucible character sheet onto the hotbar
- Shift-click to skip the action configuration dialog
- Filters by action cost, strikes, spells, movement, and favourites
- Auto-populate and auto-sort
- Tooltips from live action data

## Known limitations

- No BG3 HUD target-selector integration (Crucible handles targeting)
- No resource-depletion overlays on cells
- Passives and weapon-set panels not implemented
- Group actors are excluded
