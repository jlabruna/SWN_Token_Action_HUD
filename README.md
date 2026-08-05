# Token Action HUD — Systems Without Number v14

An independent [Token Action HUD Core](https://github.com/Larkinabout/fvtt-token-action-hud-core) adapter for the [Systems Without Number Redux (`swnr`)](https://github.com/wintersleepAI/swnr) system in Foundry VTT.

It supports native SWNR **character**, **NPC**, **ship**, and **drone** Actors. The module ID is `token-action-hud-swnr-v14`.

## Requirements

| Dependency | Supported baseline |
|---|---|
| Foundry VTT | 14 |
| Systems Without Number Redux | 2.3.1 |
| Token Action HUD Core | 2.1 or newer |

## Drone support

Selecting a genuine SWNR `drone` Actor populates useful Token Action HUD actions:

- **Combat → Weapons** lists embedded `weapon` and `shipWeapon` Items, with damage and finite ammunition where SWNR supplies it.
- Clicking a drone weapon calls that embedded Item's native SWNR `roll()` method—the same roll path used by the drone sheet.
- Right-clicking a drone weapon (or using Token Action HUD Core's Render Item mode) opens the selected token Actor's embedded Item sheet.
- **Equipment** can display genuine embedded cargo (`item`), fittings (`shipFitting`), and defences (`shipDefense`). These open their Item sheets; the HUD does not invent activation mechanics for passive records.

The adapter does **not** calculate pilot statistics, Skills, attack bonuses, ammunition, or damage. SWNR owns the underlying data and roll; compatible add-ons, including CWN Combat Enhancements, can supply their own pilot-aware attack resolution without being a dependency of this module.

The Core module refreshes the HUD for controlled Actors after Actor, embedded Item, Active Effect, and token updates. This covers ammunition use, reloads, and the creation, removal, rename, or editing of embedded drone Items.

## Existing actor actions

| Tab | Groups | Available for |
|---|---|---|
| Combat | Weapons, saves, attributes, initiative, morale | As supported by each native Actor type |
| Abilities | Skills, powers, foci | Characters |
| Equipment | Armor, cyberware, cargo, fittings, defences | Where matching embedded Items exist |
| Utility | Rest, End Scene, token visibility | Characters and NPCs |

## Installation

1. In Foundry, go to **Setup → Add-on Modules → Install Module**.
2. Paste this manifest URL:

   ```text
   https://raw.githubusercontent.com/jlabruna/SWN_Token_Action_HUD/main/module.json
   ```

3. Install it, enable **Token Action HUD Core** and this module in the world, then select an SWNR token.

## Usage notes

- Left-click a weapon to use SWNR's normal weapon roll dialog.
- Right-click an Item action, or enable **Render Item** in Token Action HUD Core, to open the selected Actor's embedded Item sheet.
- The adapter uses the selected token's effective Actor, so linked and unlinked/synthetic tokens resolve their own embedded Items.
- The module respects ordinary Foundry ownership and does not provide a way around system or item permissions.

## Known limitations

- Drone cargo, fittings, and defences are exposed only as Item-sheet actions because SWNR treats them as passive records; no dead activation buttons are created.
- The HUD does not add drone-specific save, attribute, morale, rest, or pilot actions when SWNR does not provide equivalent native functionality.
- The adapter does not require CWN Content Pack, CWN Combat Enhancements, or CWN Interface Theme.

## Development checks

Run the following from the repository root when Node.js is available:

```text
npm run check
npm test
```

## License

MIT — see [LICENSE](LICENSE).
