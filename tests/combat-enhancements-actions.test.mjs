import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { GROUP } from '../scripts/constants.js'
import {
    CE_ACTION_KIND,
    createCombatEnhancementHudAction,
    dispatchCombatEnhancementAction,
    getAvailableCombatEnhancementActions
} from '../scripts/combat-enhancements-actions.js'

const character = { id: 'character-1', type: 'character', name: 'Operator' }
const unsupportedActor = { id: 'npc-1', type: 'npc', name: 'NPC' }
const focusAction = {
    key: 'ace-driver-reroll',
    focusKey: 'ace-driver',
    label: 'Ace Driver: reroll failed driving/vehicle repair check',
    guidance: 'Reroll the qualifying failed check.',
    cadence: 'scene',
    available: true
}
const edgeActions = [
    { key: 'ghost-reroll', edgeKey: 'ghost', label: 'Ghost: reroll failed Sneak check', guidance: 'Reroll.', cadence: 'scene', available: true },
    { key: 'ghost-unseen-move', edgeKey: 'ghost', label: 'Ghost: unseen 10-meter Move', guidance: 'Move unseen.', cadence: 'day', available: true }
]

function gameWith ({ focus = [], edge = [], calls = [] } = {}) {
    return {
        cwnCombatEnhancements: {
            focus: {
                availableActions: () => focus,
                useAction: async (actor, key) => { calls.push(['focus', actor.id, key]); return { key } }
            },
            edge: {
                availableActions: () => edge,
                useAction: async (actor, key) => { calls.push(['edge', actor.id, key]); return { key } }
            }
        }
    }
}

test('CE Focus Actions is a discoverable stable system group', () => {
    assert.deepEqual(GROUP.CE_FOCUS_ACTIONS, {
        id: 'ceFocusActions',
        name: 'tokenActionHud.swnr.group.ceFocusActions',
        type: 'system'
    })
})

test('CE Edge Actions is a discoverable stable system group', () => {
    assert.deepEqual(GROUP.CE_EDGE_ACTIONS, {
        id: 'ceEdgeActions',
        name: 'tokenActionHud.swnr.group.ceEdgeActions',
        type: 'system'
    })
})

test('existing Foci document group remains unchanged', () => {
    assert.equal(GROUP.FOCI.id, 'foci')
    assert.equal(GROUP.FOCI.type, 'system')
})

test('all system group IDs remain unique', () => {
    const ids = Object.values(GROUP).map(group => group.id)
    assert.equal(new Set(ids).size, ids.length)
    assert.notEqual(CE_ACTION_KIND.focus.groupId, GROUP.FOCI.id)
})

test('missing Combat Enhancements returns no actions without throwing', () => {
    assert.deepEqual(getAvailableCombatEnhancementActions(character, 'focus', { gameRef: {} }), [])
})

test('Combat Enhancements discovery errors are contained and return no actions', () => {
    const warnings = []
    const gameRef = gameWith()
    gameRef.cwnCombatEnhancements.focus.availableActions = () => { throw new Error('discovery failed') }

    const actions = getAvailableCombatEnhancementActions(character, 'focus', {
        gameRef,
        logger: { warn: (...args) => warnings.push(args) }
    })

    assert.deepEqual(actions, [])
    assert.equal(warnings.length, 1)
})

test('unsupported actor types do not call Combat Enhancements', () => {
    let called = 0
    const gameRef = gameWith({ focus: [] })
    gameRef.cwnCombatEnhancements.focus.availableActions = () => { called += 1; return [focusAction] }
    assert.deepEqual(getAvailableCombatEnhancementActions(unsupportedActor, 'focus', { gameRef }), [])
    assert.equal(called, 0)
})

test('a character with no actionable abilities returns an empty group', () => {
    assert.deepEqual(getAvailableCombatEnhancementActions(character, 'focus', { gameRef: gameWith() }), [])
})

test('one ready Focus descriptor becomes one HUD action', () => {
    const [descriptor] = getAvailableCombatEnhancementActions(character, 'focus', { gameRef: gameWith({ focus: [focusAction] }) })
    const action = createCombatEnhancementHudAction({ descriptor, kind: 'focus', delimiter: '|', i18n: key => key })
    assert.equal(action.id, focusAction.key)
    assert.equal(action.encodedValue, `ceFocusAction|${focusAction.key}`)
    assert.equal(action.name, focusAction.label)
    assert.equal(action.tooltip, focusAction.guidance)
})

test('one ready Edge descriptor becomes one HUD action', () => {
    const [descriptor] = getAvailableCombatEnhancementActions(character, 'edge', { gameRef: gameWith({ edge: [edgeActions[0]] }) })
    const action = createCombatEnhancementHudAction({ descriptor, kind: 'edge', delimiter: '|', i18n: key => key })
    assert.equal(action.encodedValue, `ceEdgeAction|${edgeActions[0].key}`)
})

test('one Edge with multiple abilities remains multiple distinct HUD actions', () => {
    const descriptors = getAvailableCombatEnhancementActions(character, 'edge', { gameRef: gameWith({ edge: edgeActions }) })
    const actions = descriptors.map(descriptor => createCombatEnhancementHudAction({ descriptor, kind: 'edge', delimiter: '|', i18n: key => key }))
    assert.deepEqual(actions.map(action => action.id), ['ghost-reroll', 'ghost-unseen-move'])
    assert.notEqual(actions[0].name, actions[1].name)
})

test('exhausted actions follow CE availability and are hidden', () => {
    const used = { ...focusAction, available: false }
    assert.deepEqual(getAvailableCombatEnhancementActions(character, 'focus', { gameRef: gameWith({ focus: [used] }) }), [])
})

test('Focus clicks dispatch through the CE public API', async () => {
    const calls = []
    const outcome = await dispatchCombatEnhancementAction(character, 'focus', focusAction.key, { gameRef: gameWith({ calls }) })
    assert.equal(outcome.dispatched, true)
    assert.deepEqual(calls, [['focus', character.id, focusAction.key]])
})

test('Edge clicks dispatch through the CE public API', async () => {
    const calls = []
    const outcome = await dispatchCombatEnhancementAction(character, 'edge', edgeActions[0].key, { gameRef: gameWith({ calls }) })
    assert.equal(outcome.dispatched, true)
    assert.deepEqual(calls, [['edge', character.id, edgeActions[0].key]])
})

test('the HUD adapter maintains no independent usage counter', async () => {
    let available = true
    const gameRef = gameWith()
    gameRef.cwnCombatEnhancements.focus.availableActions = () => [{ ...focusAction, available }]
    gameRef.cwnCombatEnhancements.focus.useAction = async () => { available = false }

    assert.equal(getAvailableCombatEnhancementActions(character, 'focus', { gameRef }).length, 1)
    await dispatchCombatEnhancementAction(character, 'focus', focusAction.key, { gameRef })
    assert.equal(getAvailableCombatEnhancementActions(character, 'focus', { gameRef }).length, 0)
})

test('stale CE actions fail safely when CE becomes unavailable', async () => {
    const outcome = await dispatchCombatEnhancementAction(character, 'edge', edgeActions[0].key, { gameRef: {} })
    assert.deepEqual(outcome, { dispatched: false, reason: 'combat-enhancements-unavailable' })
})

test('action and roll handlers integrate CE without changing native weapon dispatch', async () => {
    const actionHandler = await readFile(new URL('../scripts/action-handler.js', import.meta.url), 'utf8')
    const rollHandler = await readFile(new URL('../scripts/roll-handler.js', import.meta.url), 'utf8')
    const defaults = await readFile(new URL('../scripts/defaults.js', import.meta.url), 'utf8')

    assert.match(actionHandler, /#buildCombatEnhancementActions\('focus', 'ceFocusActions'\)/u)
    assert.match(actionHandler, /#buildCombatEnhancementActions\('edge', 'ceEdgeActions'\)/u)
    assert.match(rollHandler, /case 'ceFocusAction':/u)
    assert.match(rollHandler, /case 'ceEdgeAction':/u)
    assert.match(rollHandler, /case 'weapon':[\s\S]*#rollItem\(actor, actionId\)/u)
    assert.doesNotMatch(defaults, /groups\.CE_FOCUS_ACTIONS/u)
    assert.doesNotMatch(defaults, /groups\.CE_EDGE_ACTIONS/u)
})
