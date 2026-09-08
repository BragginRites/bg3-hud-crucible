import { createLogger } from '/modules/bg3-hud-core/scripts/utils/logger.js';
import { resolveTokenDocument } from '../../utils/actionCell.js';

const MODULE_ID = 'bg3-hud-crucible';
const log = createLogger('bg3-hud-crucible');

/**
 * Crucible rest fill for the named Rest HUD part.
 * @param {{ actor?: Actor, token?: Token }} ctx
 * @returns {Array<Object>}
 */
export function getCrucibleRests({ actor } = {}) {
    if (!actor) return [];

    return [
        {
            key: 'rest',
            classes: ['rest-button'],
            icon: 'fas fa-bed',
            label: game.i18n.localize(`${MODULE_ID}.Actions.Rest`),
            tooltip: game.i18n.localize(`${MODULE_ID}.Actions.Rest`),
            tooltipDirection: 'LEFT',
            visible: () => !game.combat?.started,
            onClick: async () => {
                const token = resolveTokenDocument(actor);
                try {
                    await actor.useAction('rest', { dialog: true, token });
                } catch (error) {
                    log.error('Rest failed:', error);
                }
            }
        }
    ];
}
