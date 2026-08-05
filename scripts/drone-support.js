/**
 * Pure helpers for SWNR drone actors.
 *
 * Keeping discovery and display-data preparation here makes the adapter easy
 * to test without Foundry, while the action and roll handlers remain the only
 * places that call Token Action HUD Core or SWNR APIs.
 */

export const SUPPORTED_ACTOR_TYPES = new Set(['character', 'npc', 'ship', 'drone'])

const DRONE_ITEM_TYPES = {
    weapons: new Set(['weapon', 'shipWeapon']),
    cargo: new Set(['item']),
    fittings: new Set(['shipFitting']),
    defences: new Set(['shipDefense'])
}

export function isSupportedActorType (actorType) {
    return SUPPORTED_ACTOR_TYPES.has(actorType)
}

/**
 * Return actor items in a stable display order. `actor.items` is a Foundry
 * Collection in play, but accepting arrays and maps keeps this helper useful
 * for synthetic test actors too.
 */
export function getActorItemEntries (actor) {
    const items = actor?.items
    if (!items) return []

    let entries
    if (Array.isArray(items)) {
        entries = items.map(item => [item.id, item])
    } else if (typeof items.entries === 'function') {
        entries = [...items.entries()]
    } else {
        entries = Object.values(items).map(item => [item.id, item])
    }

    return entries.sort(([, left], [, right]) => {
        const name = String(left?.name ?? '').localeCompare(String(right?.name ?? ''))
        return name || String(left?.id ?? '').localeCompare(String(right?.id ?? ''))
    })
}

export function getDroneItems (actor, category) {
    const itemTypes = DRONE_ITEM_TYPES[category]
    if (!itemTypes) return []
    return getActorItemEntries(actor).filter(([, item]) => itemTypes.has(item?.type))
}

export function getWeaponAmmoText (item) {
    const ammo = item?.system?.ammo
    if (!ammo || ammo.type === 'none' || ammo.type === 'infinite') return ''

    const value = ammo.value ?? ammo.current
    const max = ammo.max
    if (value === undefined || value === null) return ''
    return max === undefined || max === null ? String(value) : `${value}/${max}`
}

/**
 * Build the raw action data used by TAH Core for a drone weapon.
 * The encoded value deliberately remains the normal `weapon|itemId` route so
 * RollHandler can invoke the embedded SWNR Item's native roll method.
 */
export function createDroneWeaponAction ({ itemId, item, delimiter, i18n, getImage }) {
    const damage = item?.system?.damage ?? item?.system?.dmg ?? ''
    const ammo = getWeaponAmmoText(item)
    const attackBonus = item?.system?.hit ?? item?.system?.attackBonus ?? item?.system?.ab
    const label = i18n('tokenActionHud.swnr.actionType.weapon')
    const action = {
        id: itemId,
        name: item?.name ?? '',
        listName: `${label ? `${label}: ` : ''}${item?.name ?? ''}`,
        encodedValue: ['weapon', itemId].join(delimiter),
        img: getImage(item),
        tooltip: item?.system?.description ?? '',
        info1: damage ? { text: String(damage), title: i18n('tokenActionHud.swnr.info.damage') } : {}
    }

    if (ammo) {
        action.info2 = {
            text: ammo,
            title: i18n('tokenActionHud.swnr.info.ammo'),
            class: Number(item.system?.ammo?.value ?? item.system?.ammo?.current) === 0 ? 'inactive' : ''
        }
    } else if (attackBonus !== undefined && attackBonus !== null && attackBonus !== '') {
        const number = Number(attackBonus)
        action.info2 = {
            text: `${number >= 0 ? '+' : ''}${number}`,
            title: i18n('tokenActionHud.swnr.info.hit')
        }
    }

    return action
}

export function createDroneItemAction ({ itemId, item, actionType, delimiter, i18n, getImage }) {
    const actionTypeKey = `tokenActionHud.swnr.actionType.${actionType}`
    const label = i18n(actionTypeKey)
    return {
        id: itemId,
        name: item?.name ?? '',
        listName: `${label ? `${label}: ` : ''}${item?.name ?? ''}`,
        encodedValue: [actionType, itemId].join(delimiter),
        img: getImage(item),
        tooltip: item?.system?.description ?? ''
    }
}
