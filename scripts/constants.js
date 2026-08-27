/**
 * Module constants
 */
export const MODULE = {
    ID: 'token-action-hud-swnr-v14',
    NAME: 'Token Action HUD - SWNR v14'
}

/**
 * TAH Core module id
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
}

/**
 * Minimum TAH Core version required by this module
 */
export const REQUIRED_CORE_MODULE_VERSION = '2.1'

/**
 * Action types — values are i18n keys
 */
export const ACTION_TYPE = {
    weapon:     'tokenActionHud.swnr.actionType.weapon',
    skill:      'tokenActionHud.swnr.actionType.skill',
    power:      'tokenActionHud.swnr.actionType.power',
    armor:      'tokenActionHud.swnr.actionType.armor',
    cyberware:  'tokenActionHud.swnr.actionType.cyberware',
    feature:    'tokenActionHud.swnr.actionType.feature',
    ceFocusAction: 'tokenActionHud.swnr.actionType.ceFocusAction',
    ceEdgeAction:  'tokenActionHud.swnr.actionType.ceEdgeAction',
    cargo:      'tokenActionHud.swnr.actionType.cargo',
    fitting:    'tokenActionHud.swnr.actionType.fitting',
    defence:    'tokenActionHud.swnr.actionType.defence',
    save:       'tokenActionHud.swnr.actionType.save',
    attribute:  'tokenActionHud.swnr.actionType.attribute',
    initiative: 'tokenActionHud.swnr.actionType.initiative',
    morale:     'tokenActionHud.swnr.actionType.morale',
    utility:    'tokenActionHud.utility'
}

/**
 * HUD action groups (children that live inside tabs)
 * id must be unique across all groups
 */
export const GROUP = {
    WEAPONS:         { id: 'weapons',        name: 'tokenActionHud.swnr.group.weapons',       type: 'system' },
    SKILLS:          { id: 'skills',         name: 'tokenActionHud.swnr.group.skills',        type: 'system' },
    POWERS:          { id: 'powers',         name: 'tokenActionHud.swnr.group.powers',        type: 'system' },
    ARMOR:           { id: 'armor',          name: 'tokenActionHud.swnr.group.armor',         type: 'system' },
    CYBERWARE:       { id: 'cyberware',      name: 'tokenActionHud.swnr.group.cyberware',     type: 'system' },
    FOCI:            { id: 'foci',           name: 'tokenActionHud.swnr.group.foci',          type: 'system' },
    CE_FOCUS_ACTIONS: { id: 'ceFocusActions', name: 'tokenActionHud.swnr.group.ceFocusActions', type: 'system' },
    CE_EDGE_ACTIONS: { id: 'ceEdgeActions',  name: 'tokenActionHud.swnr.group.ceEdgeActions', type: 'system' },
    CARGO:           { id: 'cargo',          name: 'tokenActionHud.swnr.group.cargo',         type: 'system' },
    FITTINGS:        { id: 'fittings',       name: 'tokenActionHud.swnr.group.fittings',      type: 'system' },
    DEFENCES:        { id: 'defences',       name: 'tokenActionHud.swnr.group.defences',      type: 'system' },
    SAVES:           { id: 'saves',          name: 'tokenActionHud.swnr.group.saves',         type: 'system' },
    ATTRIBUTES:      { id: 'attributes',     name: 'tokenActionHud.swnr.group.attributes',    type: 'system' },
    COMBAT_ACTIONS:  { id: 'combat_actions', name: 'tokenActionHud.swnr.group.combatActions', type: 'system' },
    UTILITY_ACTIONS: { id: 'utility_actions',name: 'tokenActionHud.utility',                  type: 'system' }
}

/**
 * Maps SWNR item.type → group id
 * These are the actual item types registered in the swnr system template.json
 */
export const ITEM_TYPE = {
    weapon:    { groupId: 'weapons'   },
    skill:     { groupId: 'skills'    },
    power:     { groupId: 'powers'    },
    armor:     { groupId: 'armor'     },
    cyberware: { groupId: 'cyberware' },
    feature:   { groupId: 'foci'      }
}

/**
 * Attribute keys and their i18n labels
 */
export const ATTRIBUTES = [
    { id: 'str', labelKey: 'swnr.stat.long.str' },
    { id: 'dex', labelKey: 'swnr.stat.long.dex' },
    { id: 'con', labelKey: 'swnr.stat.long.con' },
    { id: 'int', labelKey: 'swnr.stat.long.int' },
    { id: 'wis', labelKey: 'swnr.stat.long.wis' },
    { id: 'cha', labelKey: 'swnr.stat.long.cha' }
]

/**
 * Save types and their i18n labels
 */
export const SAVES = [
    { id: 'physical', labelKey: 'swnr.sheet.saves.physical' },
    { id: 'evasion',  labelKey: 'swnr.sheet.saves.evasion'  },
    { id: 'mental',   labelKey: 'swnr.sheet.saves.mental'   },
    { id: 'luck',     labelKey: 'swnr.sheet.saves.luck'     }
]
