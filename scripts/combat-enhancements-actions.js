/**
 * Optional CWN Combat Enhancements integration.
 *
 * Combat Enhancements owns action discovery, eligibility, execution, and use
 * tracking. This adapter only converts its public descriptors into Token
 * Action HUD actions and dispatches clicks back through the same public API.
 */

export const CE_ACTION_KIND = Object.freeze({
    focus: Object.freeze({
        actionType: 'ceFocusAction',
        groupId: 'ceFocusActions',
        typeLabelKey: 'tokenActionHud.swnr.actionType.ceFocusAction'
    }),
    edge: Object.freeze({
        actionType: 'ceEdgeAction',
        groupId: 'ceEdgeActions',
        typeLabelKey: 'tokenActionHud.swnr.actionType.ceEdgeAction'
    })
})

const CADENCE_LABEL_KEYS = Object.freeze({
    round: 'tokenActionHud.swnr.cadence.round',
    scene: 'tokenActionHud.swnr.cadence.scene',
    day: 'tokenActionHud.swnr.cadence.day',
    week: 'tokenActionHud.swnr.cadence.week',
    session: 'tokenActionHud.swnr.cadence.session'
})

function getKindConfig (kind) {
    return CE_ACTION_KIND[kind] ?? null
}

function getKindApi (kind, gameRef = globalThis.game) {
    const api = gameRef?.cwnCombatEnhancements?.[kind]
    if (!api || typeof api.availableActions !== 'function' || typeof api.useAction !== 'function') return null
    return api
}

/**
 * Read currently available actions from Combat Enhancements.
 * Unsupported actors and missing/disabled CE installations safely return [].
 */
export function getAvailableCombatEnhancementActions (
    actor,
    kind,
    { gameRef = globalThis.game, logger = console } = {}
) {
    if (actor?.type !== 'character' || !getKindConfig(kind)) return []
    const api = getKindApi(kind, gameRef)
    if (!api) return []

    try {
        const descriptors = api.availableActions(actor)
        if (!Array.isArray(descriptors)) return []
        return descriptors.filter(action => (
            action?.available === true &&
            typeof action.key === 'string' && action.key.length > 0 &&
            typeof action.label === 'string' && action.label.length > 0
        ))
    } catch (error) {
        logger?.warn?.('token-action-hud-swnr | Could not discover Combat Enhancements actions.', error)
        return []
    }
}

/** Convert one CE public action descriptor into ordinary TAH action data. */
export function createCombatEnhancementHudAction ({
    descriptor,
    kind,
    delimiter,
    i18n = key => key
}) {
    const config = getKindConfig(kind)
    if (!config || !descriptor?.key) return null

    const typeLabel = i18n(config.typeLabelKey)
    const cadenceKey = CADENCE_LABEL_KEYS[descriptor.cadence]
    const cadence = cadenceKey ? i18n(cadenceKey) : ''

    return {
        id: descriptor.key,
        name: descriptor.label,
        listName: `${typeLabel ? `${typeLabel}: ` : ''}${descriptor.label}`,
        encodedValue: [config.actionType, descriptor.key].join(delimiter),
        tooltip: descriptor.guidance ?? '',
        info1: cadence
            ? { text: cadence, title: i18n('tokenActionHud.swnr.info.cadence') }
            : {}
    }
}

/** Dispatch through CE without storing or mutating any HUD-owned usage state. */
export async function dispatchCombatEnhancementAction (
    actor,
    kind,
    actionKey,
    { gameRef = globalThis.game } = {}
) {
    if (actor?.type !== 'character' || !getKindConfig(kind)) {
        return { dispatched: false, reason: 'unsupported-actor-or-kind' }
    }

    const api = getKindApi(kind, gameRef)
    if (!api) return { dispatched: false, reason: 'combat-enhancements-unavailable' }

    const result = await api.useAction(actor, actionKey)
    return { dispatched: true, result }
}
