import { openNativeEmbeddedItem, rollNativeEmbeddedWeapon } from './drone-support.js'

export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends TAH Core's RollHandler to process SWNR action clicks
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        // Known actor types this handler supports
        static #KNOWN_ACTOR_TYPES = ['character', 'npc', 'ship', 'drone', 'vehicle']

        /**
         * Handle action click (left or right click)
         * @override
         * @param {PointerEvent} event
         * @param {string} encodedValue  "actionType|actionId"
         */
        async handleActionClick (event, encodedValue) {
            const [actionType, actionId] = encodedValue.split(this.delimiter)

            // If right-click or render mode is active, open the item sheet instead
            if (this.isRenderItem()) {
                const itemTypes = ['weapon', 'skill', 'power', 'armor', 'cyberware', 'feature', 'cargo', 'fitting', 'defence']
                if (this.actor && itemTypes.includes(actionType)) {
                    return this.renderItem(this.actor, actionId)
                }
            }

            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionType, actionId)
                return
            }

            // Multiple tokens selected
            const controlledTokens = canvas.tokens?.controlled?.filter(
                t => RollHandler.#KNOWN_ACTOR_TYPES.includes(t.actor?.type)
            ) ?? []

            for (const token of controlledTokens) {
                await this.#handleAction(event, token.actor, token, actionType, actionId)
            }
        }

        /**
         * Handle action hover
         * @override
         */
        async handleActionHover (event, encodedValue) {}

        /**
         * Handle group click
         * @override
         */
        async handleGroupClick (event, group) {}

        // ---------------------------------------------------------------
        // Internal dispatch
        // ---------------------------------------------------------------

        async #handleAction (event, actor, token, actionType, actionId) {
            try {
                switch (actionType) {
                case 'weapon':
                    await this.#rollItem(actor, actionId)
                    break
                case 'skill':
                    await this.#rollSkill(event, actor, actionId)
                    break
                case 'power':
                    await this.#rollItem(actor, actionId)
                    break
                case 'armor':
                case 'cyberware':
                case 'feature':
                case 'cargo':
                case 'fitting':
                case 'defence':
                    await this.#openItemSheet(actor, actionId)
                    break
                case 'save':
                    await this.#rollSave(actor, actionId)
                    break
                case 'attribute':
                    await this.#rollAttribute(actor, actionId)
                    break
                case 'initiative':
                    await this.#rollInitiative(actor, token)
                    break
                case 'morale':
                    await this.#rollMorale(actor)
                    break
                case 'utility':
                    await this.#handleUtility(actor, token, actionId)
                    break
                default:
                    console.warn(`token-action-hud-swnr | Unknown action type: ${actionType}`)
                }
            } catch (err) {
                console.error(`token-action-hud-swnr | Error handling action [${actionType}|${actionId}]:`, err)
                ui.notifications?.warn(`Token Action HUD SWNR: Action failed — see console for details.`)
            }
        }

        // ---------------------------------------------------------------
        // Item rolls
        // ---------------------------------------------------------------

        /**
         * Generic item roll — tries item.roll() first, falls back to sheet
         */
        async #rollItem (actor, itemId) {
            const item = actor.items.get(itemId)
            if (!item) {
                ui.notifications?.warn('Token Action HUD SWNR: The selected item is no longer available.')
                Hooks.callAll('forceUpdateTokenActionHud')
                return
            }

            return rollNativeEmbeddedWeapon(item)
        }

        /**
         * Skill roll — skill items expose roll(shiftKey)
         * Shift-click triggers the secondary roll mode (if any)
         */
        async #rollSkill (event, actor, itemId) {
            const item = actor.items.get(itemId)
            if (!item) return

            const shiftKey = event?.shiftKey ?? false

            if (typeof item.roll === 'function') {
                await item.roll(shiftKey)
            } else {
                item.sheet?.render(true)
            }
        }

        /**
         * Open item sheet as a fallback
         */
        async #openItemSheet (actor, itemId) {
            const item = actor.items.get(itemId)
            if (!item) {
                ui.notifications?.warn('Token Action HUD SWNR: The selected item is no longer available.')
                Hooks.callAll('forceUpdateTokenActionHud')
                return
            }
            return openNativeEmbeddedItem(item)
        }

        // ---------------------------------------------------------------
        // Save roll — actor.system.rollSave(saveType)
        // ---------------------------------------------------------------

        async #rollSave (actor, saveType) {
            if (typeof actor.system?.rollSave === 'function') {
                await actor.system.rollSave(saveType)
            } else {
                // Fallback: plain d20 roll with save target as flavor
                const target = actor.system?.save?.[saveType] ?? '?'
                const roll = new Roll('1d20', actor.getRollData?.() ?? {})
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: `${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Save (target: ${target})`
                })
            }
        }

        // ---------------------------------------------------------------
        // Attribute check — no native SWNR method; roll 2d6 + mod
        // (SWN skill checks use 2d6 + skill + modifier)
        // ---------------------------------------------------------------

        async #rollAttribute (actor, attrKey) {
            const stat = actor.system?.stats?.[attrKey]
            if (!stat) return

            const mod = stat.mod ?? 0
            const label = game.i18n.localize(`swnr.stat.long.${attrKey}`) || attrKey.toUpperCase()
            const modStr = mod >= 0 ? `+${mod}` : String(mod)

            const roll = new Roll(`2d6${mod !== 0 ? ` + ${mod}` : ''}`, actor.getRollData?.() ?? {})
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: `${label} Check (mod: ${modStr})`
            })
        }

        // ---------------------------------------------------------------
        // Initiative
        // ---------------------------------------------------------------

        async #rollInitiative (actor, token) {
            // Ensure there is an active combat
            if (!game.combat) {
                ui.notifications?.warn(
                    game.i18n.localize('COMBAT.NoneActive') || 'No active combat encounter.'
                )
                return
            }

            // Create a combatant if this token isn't already in combat
            if (!token.combatant) {
                await game.combat.createEmbeddedDocuments('Combatant', [{
                    tokenId: token.id,
                    actorId: actor.id,
                    sceneId: canvas.scene?.id
                }])
            }

            // Roll initiative through the combat tracker so SWNR's
            // overridden rollInitiative() formula is used correctly
            const combatantId = token.combatant?.id
            if (combatantId) {
                await game.combat.rollInitiative([combatantId])
            }
        }

        // ---------------------------------------------------------------
        // Morale (NPC-only) — actor.system.rollMorale()
        // ---------------------------------------------------------------

        async #rollMorale (actor) {
            if (actor.type !== 'npc') return

            if (typeof actor.system?.rollMorale === 'function') {
                await actor.system.rollMorale()
            } else {
                // Fallback: 2d6 morale roll
                const morale = actor.system?.morale ?? actor.system?.stats?.morale ?? '?'
                const roll = new Roll('2d6', actor.getRollData?.() ?? {})
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: `Morale Check (morale: ${morale})`
                })
            }
        }

        // ---------------------------------------------------------------
        // Utility actions
        // ---------------------------------------------------------------

        async #handleUtility (actor, token, actionId) {
            switch (actionId) {
            case 'rest':
                await this.#doRest(actor)
                break
            case 'endScene':
                await this.#doEndScene(actor)
                break
            case 'toggleVisibility':
                await this.#toggleTokenVisibility(token)
                break
            default:
                console.warn(`token-action-hud-swnr | Unknown utility action: ${actionId}`)
            }
        }

        async #doRest (actor) {
            // SWNR exposes rest via globalThis.swnr.utils.refreshActor
            if (typeof globalThis.swnr?.utils?.refreshActor === 'function') {
                await globalThis.swnr.utils.refreshActor({ actor, cadence: 'day' })
            } else if (typeof actor.system?.restForNight === 'function') {
                await actor.system.restForNight()
            } else {
                ui.notifications?.info(`${actor.name}: Rest (no system handler found — open actor sheet to rest)`)
            }
        }

        async #doEndScene (actor) {
            if (typeof globalThis.swnr?.utils?.refreshActor === 'function') {
                await globalThis.swnr.utils.refreshActor({ actor, cadence: 'scene' })
            } else if (typeof actor.system?.endScene === 'function') {
                await actor.system.endScene()
            } else {
                ui.notifications?.info(`${actor.name}: End Scene (no system handler found)`)
            }
        }

        async #toggleTokenVisibility (token) {
            const isHidden = token.document?.hidden ?? false
            await token.document?.update({ hidden: !isHidden })
        }
    }
})
