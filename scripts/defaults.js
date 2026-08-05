import { GROUP } from './constants.js'

/**
 * Default HUD layout and groups.
 * Built inside the hook so we have access to coreModule.api.Utils.i18n().
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = GROUP

    // Resolve i18n names for every group
    Object.values(groups).forEach(group => {
        group.name = coreModule.api.Utils.i18n(group.name)
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
    })

    const groupsArray = Object.values(groups)

    DEFAULTS = {
        layout: [
            // Tab 1: Combat — the most-reached-for tab at the table
            {
                nestId: 'combat',
                id: 'combat',
                name: coreModule.api.Utils.i18n('tokenActionHud.swnr.tab.combat'),
                groups: [
                    { ...groups.WEAPONS,        nestId: 'combat_weapons'        },
                    { ...groups.SAVES,          nestId: 'combat_saves'          },
                    { ...groups.ATTRIBUTES,     nestId: 'combat_attributes'     },
                    { ...groups.COMBAT_ACTIONS, nestId: 'combat_combat_actions' }
                ]
            },
            // Tab 2: Abilities — skills, powers, foci
            {
                nestId: 'abilities',
                id: 'abilities',
                name: coreModule.api.Utils.i18n('tokenActionHud.swnr.tab.abilities'),
                groups: [
                    { ...groups.SKILLS, nestId: 'abilities_skills' },
                    { ...groups.POWERS, nestId: 'abilities_powers' },
                    { ...groups.FOCI,   nestId: 'abilities_foci'   }
                ]
            },
            // Tab 3: Inventory — worn/carried gear
            {
                nestId: 'inventory',
                id: 'inventory',
                name: coreModule.api.Utils.i18n('tokenActionHud.swnr.tab.inventory'),
                groups: [
                    { ...groups.ARMOR,     nestId: 'inventory_armor'     },
                    { ...groups.CYBERWARE, nestId: 'inventory_cyberware' },
                    { ...groups.CARGO,     nestId: 'inventory_cargo'     },
                    { ...groups.FITTINGS,  nestId: 'inventory_fittings'  },
                    { ...groups.DEFENCES,  nestId: 'inventory_defences'  }
                ]
            },
            // Tab 4: Utility
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    { ...groups.UTILITY_ACTIONS, nestId: 'utility_utility_actions' }
                ]
            }
        ],
        groups: groupsArray
    }
})
