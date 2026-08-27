# Changelog

## 1.3.0

- Added discoverable `CE Focus Actions` and `CE Edge Actions` system groups for Token Action HUD Core custom layouts.
- Built the groups dynamically from CWN Combat Enhancements' public `focus.availableActions(actor)` and `edge.availableActions(actor)` APIs.
- Dispatched HUD clicks through Combat Enhancements' public `focus.useAction(actor, key)` and `edge.useAction(actor, key)` APIs so CE remains authoritative for mechanics and usage state.
- Hid passive, exhausted, setup, undo, management, and reset entries from the quick-launch groups.
- Preserved the existing Foci document group and all native SWNR item and weapon routes.
- Kept Combat Enhancements optional and returned empty groups safely for unsupported actors or unavailable APIs.
- Added release validation that requires the published `v*` tag to match `module.json`.

## 1.2.1

- Added native SWNR `vehicle` Actor support.
- Added vehicle-mounted regular weapons and ship weapons to the Combat tab.
- Added sheet-opening actions for vehicle cargo, fittings, and defences.
- Reused native embedded Item actions so SWNR and compatible modules retain control of vehicle rolls and rules.
- Added focused vehicle discovery, native weapon-roll, and passive Item-sheet tests.

## 1.2.0

- Added native SWNR `drone` Actor support.
- Added mounted regular-weapon and ship-weapon actions to the Combat tab.
- Added sheet-opening actions for genuine drone cargo, fittings, and defences.
- Updated Token Action HUD Core 2.1 item rendering and multi-token actor handling.
- Added focused drone discovery and action-data tests.

## 1.1.0

- Foundry V14 and Token Action HUD Core 2.1 compatibility release.
