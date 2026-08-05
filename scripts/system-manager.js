import { ActionHandler } from './action-handler.js'
import { RollHandler } from './roll-handler.js'
import { MODULE, REQUIRED_CORE_MODULE_VERSION } from './constants.js'
import { DEFAULTS } from './defaults.js'

export let SystemManager = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's SystemManager
     */
    SystemManager = class SystemManager extends coreModule.api.SystemManager {
        /**
         * Returns an instance of ActionHandler to TAH Core
         * @override
         * @returns {ActionHandler}
         */
        getActionHandler () {
            return new ActionHandler()
        }

        /**
         * Returns a map of available roll handler IDs → display names
         * Populates the Roll Handler module setting dropdown
         * @override
         * @returns {object}
         */
        getAvailableRollHandlers () {
            return { core: 'Core (SWNR)' }
        }

        /**
         * Returns the active RollHandler instance
         * @override
         * @param {string} rollHandlerId
         * @returns {RollHandler}
         */
        getRollHandler (rollHandlerId) {
            return new RollHandler()
        }

        /**
         * Returns the default layout and groups to TAH Core
         * @override
         * @returns {object}
         */
        async registerDefaults () {
            return DEFAULTS
        }
    }
})
