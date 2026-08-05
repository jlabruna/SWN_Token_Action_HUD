/**
 * Entry point for token-action-hud-swnr
 *
 * All class definitions live inside the 'tokenActionHudCoreApiReady' hook
 * so that they can extend the live TAH Core API classes.
 *
 * This listener runs once per Foundry lifecycle after the imported modules
 * have registered their Core-ready listeners. Using `once` prevents duplicate
 * system registration during refreshes or hot reloads.
 */

import { SystemManager } from './system-manager.js'
import { MODULE, REQUIRED_CORE_MODULE_VERSION } from './constants.js'

// These imports are side-effect-only — they register their own
// tokenActionHudCoreApiReady hooks to define ActionHandler, RollHandler,
// DEFAULTS, and SystemManager.
import './action-handler.js'
import './roll-handler.js'
import './defaults.js'

Hooks.once('tokenActionHudCoreApiReady', async () => {
    const module = game.modules.get(MODULE.ID)
    module.api = {
        requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
        SystemManager
    }
    Hooks.call('tokenActionHudSystemReady', module)
})
