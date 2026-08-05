import {
    ACTION_TYPE,
    ATTRIBUTES,
    ITEM_TYPE,
    SAVES
} from './constants.js'
import {
    createDroneItemAction,
    createDroneWeaponAction,
    getDroneItems
} from './drone-support.js'

export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends TAH Core's ActionHandler and builds system actions for the SWNR HUD
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        // ---------------------------------------------------------------
        // Entry point — called by TAH Core whenever the HUD needs rebuilt
        // ---------------------------------------------------------------

        /**
         * Build system actions
         * @override
         * @param {string[]} groupIds
         */
        async buildSystemActions (groupIds) {
            // Core 2.1 exposes selected actors through the `actors` getter.
            // `_getActors()` belonged to older Core versions and no longer exists.
            this.actors = this.actor ? [this.actor] : (this.actors ?? [])
            this.actorType = this.actor?.type

            if (this.actor) {
                let items = this.actor.items
                items = coreModule.api.Utils.sortItemsByName(items)
                this.items = items
            }

            if (this.actorType === 'character') {
                await this.#buildCharacterActions()
            } else if (this.actorType === 'npc') {
                await this.#buildNpcActions()
            } else if (this.actorType === 'ship') {
                await this.#buildShipActions()
            } else if (this.actorType === 'drone') {
                await this.#buildDroneActions()
            } else if (!this.actor) {
                // Multiple tokens selected — build a limited multi-token set
                await this.#buildMultiTokenActions()
            }
        }

        // ---------------------------------------------------------------
        // Actor-type builders
        // ---------------------------------------------------------------

        async #buildCharacterActions () {
            await Promise.all([
                this.#buildItemGroup('weapons',   'weapon',   'weapon'),
                this.#buildItemGroup('skills',    'skill',    'skill'),
                this.#buildItemGroup('powers',    'power',    'power'),
                this.#buildItemGroup('armor',     'armor',    'armor'),
                this.#buildItemGroup('cyberware', 'cyberware','cyberware'),
                this.#buildItemGroup('foci',      'feature',  'feature'),
                this.#buildSaves(),
                this.#buildAttributes(),
                this.#buildCombatActions({ includeInitiative: true }),
                this.#buildUtilityActions()
            ])
        }

        async #buildNpcActions () {
            await Promise.all([
                this.#buildItemGroup('weapons', 'weapon', 'weapon'),
                this.#buildSaves(),
                this.#buildCombatActions({ includeInitiative: true, includeMorale: true }),
                this.#buildUtilityActions()
            ])
        }

        async #buildShipActions () {
            await Promise.all([
                this.#buildItemGroup('weapons', 'weapon', 'weapon'),
                this.#buildCombatActions({ includeInitiative: true })
            ])
        }

        /**
         * SWNR drones use the vehicle sheet's native embedded Item model.
         * Weapon action values intentionally use the ordinary `weapon` route;
         * RollHandler then calls the current embedded Item's native `roll()`.
         */
        async #buildDroneActions () {
            await Promise.all([
                this.#buildDroneWeaponActions(),
                this.#buildDroneItemGroup('cargo', 'cargo', 'cargo'),
                this.#buildDroneItemGroup('fittings', 'fittings', 'fitting'),
                this.#buildDroneItemGroup('defences', 'defences', 'defence'),
                this.#buildCombatActions({ includeInitiative: true })
            ])
        }

        async #buildDroneWeaponActions () {
            const actions = getDroneItems(this.actor, 'weapons').map(([itemId, item]) => (
                createDroneWeaponAction({
                    itemId,
                    item,
                    delimiter: this.delimiter,
                    i18n: key => coreModule.api.Utils.i18n(key),
                    getImage: document => coreModule.api.Utils.getImage(document)
                })
            ))
            this.addActions(actions, { id: 'weapons', type: 'system' })
        }

        async #buildDroneItemGroup (groupId, category, actionType) {
            const actions = getDroneItems(this.actor, category).map(([itemId, item]) => (
                createDroneItemAction({
                    itemId,
                    item,
                    actionType,
                    delimiter: this.delimiter,
                    i18n: key => coreModule.api.Utils.i18n(key),
                    getImage: document => coreModule.api.Utils.getImage(document)
                })
            ))
            this.addActions(actions, { id: groupId, type: 'system' })
        }

        async #buildMultiTokenActions () {
            await this.#buildCombatActions({ includeInitiative: true })
        }

        // ---------------------------------------------------------------
        // Item group builder — handles weapon / skill / power / armor / etc.
        // ---------------------------------------------------------------

        /**
         * Build actions for a group from actor items filtered by type
         * @param {string} groupId     - GROUP id (e.g. 'weapons')
         * @param {string} itemType    - SWNR item.type value (e.g. 'weapon')
         * @param {string} actionType  - encodedValue prefix (e.g. 'weapon')
         */
        async #buildItemGroup (groupId, itemType, actionType) {
            if (!this.items || this.items.size === 0) return

            const filteredItems = [...this.items].filter(([, item]) => item.type === itemType)
            if (filteredItems.length === 0) return

            const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionType] ?? '')

            const actions = filteredItems.map(([itemId, item]) => {
                const id = itemId
                const name = item.name ?? ''
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
                const encodedValue = [actionType, id].join(this.delimiter)
                const img = coreModule.api.Utils.getImage(item)
                const tooltip = item.system?.description ?? ''

                let info1 = {}
                let info2 = {}
                let cssClass = ''

                if (itemType === 'weapon') {
                    const dmg = item.system?.damage ?? item.system?.dmg ?? ''
                    if (dmg) info1 = { text: String(dmg), title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.damage') }
                    const toHit = item.system?.hit ?? item.system?.attackBonus ?? ''
                    if (toHit !== '' && toHit !== undefined) {
                        const hitNum = Number(toHit)
                        info2 = { text: `${hitNum >= 0 ? '+' : ''}${hitNum}`, title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.hit') }
                    }
                } else if (itemType === 'skill') {
                    // Skill rank: SWNR uses -1 (untrained), 0–4
                    const rank = item.system?.rank ?? item.system?.level ?? item.system?.skillLevel ?? null
                    if (rank !== null && rank !== undefined) {
                        info1 = { text: rank >= 0 ? `+${rank}` : String(rank), title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.rank') }
                    }
                } else if (itemType === 'power') {
                    const strain = item.system?.strain ?? item.system?.cost ?? ''
                    if (strain !== '' && strain !== undefined) {
                        info1 = { text: String(strain), title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.strain') }
                    }
                }

                // Mark equipped/active items
                if (item.system?.equipped === true || item.system?.active === true) {
                    cssClass = 'active'
                }

                return { id, name, listName, encodedValue, img, tooltip, info1, info2, cssClass }
            })

            this.addActions(actions, { id: groupId, type: 'system' })
        }

        // ---------------------------------------------------------------
        // Saves
        // ---------------------------------------------------------------

        async #buildSaves () {
            if (!this.actor) return

            const saveData = this.actor.system?.save ?? {}
            const actions = []

            for (const save of SAVES) {
                // Skip save types the actor doesn't have
                const target = saveData[save.id]
                if (target === undefined || target === null) continue

                const name = game.i18n.localize(save.labelKey) || save.id
                const encodedValue = ['save', save.id].join(this.delimiter)
                const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE.save ?? '')
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
                const info1 = { text: String(target), title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.target') }

                actions.push({ id: save.id, name, listName, encodedValue, info1 })
            }

            if (actions.length > 0) {
                this.addActions(actions, { id: 'saves', type: 'system' })
            }
        }

        // ---------------------------------------------------------------
        // Attributes
        // ---------------------------------------------------------------

        async #buildAttributes () {
            if (!this.actor) return

            const stats = this.actor.system?.stats ?? {}
            const actions = []

            for (const attr of ATTRIBUTES) {
                const statData = stats[attr.id]
                if (!statData) continue

                const name = game.i18n.localize(attr.labelKey) || attr.id.toUpperCase()
                const encodedValue = ['attribute', attr.id].join(this.delimiter)
                const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE.attribute ?? '')
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
                const mod = statData.mod ?? 0
                const info1 = { text: `${mod >= 0 ? '+' : ''}${mod}`, title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.mod') }
                const info2 = { text: String(statData.total ?? statData.base ?? ''), title: coreModule.api.Utils.i18n('tokenActionHud.swnr.info.score') }

                actions.push({ id: attr.id, name, listName, encodedValue, info1, info2 })
            }

            if (actions.length > 0) {
                this.addActions(actions, { id: 'attributes', type: 'system' })
            }
        }

        // ---------------------------------------------------------------
        // Combat actions (initiative, morale, etc.)
        // ---------------------------------------------------------------

        async #buildCombatActions ({ includeInitiative = false, includeMorale = false } = {}) {
            const actions = []

            if (includeInitiative) {
                actions.push({
                    id: 'initiative',
                    name: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.initiative'),
                    listName: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.initiative'),
                    encodedValue: ['initiative', 'initiative'].join(this.delimiter)
                })
            }

            if (includeMorale) {
                actions.push({
                    id: 'morale',
                    name: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.morale'),
                    listName: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.morale'),
                    encodedValue: ['morale', 'morale'].join(this.delimiter)
                })
            }

            if (actions.length > 0) {
                this.addActions(actions, { id: 'combat_actions', type: 'system' })
            }
        }

        // ---------------------------------------------------------------
        // Utility actions
        // ---------------------------------------------------------------

        async #buildUtilityActions () {
            const actions = [
                {
                    id: 'rest',
                    name: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.rest'),
                    listName: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.rest'),
                    encodedValue: ['utility', 'rest'].join(this.delimiter)
                },
                {
                    id: 'endScene',
                    name: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.endScene'),
                    listName: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.endScene'),
                    encodedValue: ['utility', 'endScene'].join(this.delimiter)
                },
                {
                    id: 'toggleVisibility',
                    name: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.toggleVisibility'),
                    listName: coreModule.api.Utils.i18n('tokenActionHud.swnr.action.toggleVisibility'),
                    encodedValue: ['utility', 'toggleVisibility'].join(this.delimiter)
                }
            ]

            this.addActions(actions, { id: 'utility_actions', type: 'system' })
        }
    }
})
