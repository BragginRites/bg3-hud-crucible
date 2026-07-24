import { ActionButtonsContainer } from '/modules/bg3-hud-core/scripts/components/containers/ActionButtonsContainer.js';
import { createLogger } from '/modules/bg3-hud-core/scripts/utils/logger.js';
import { resolveTokenDocument } from '../../utils/actionCell.js';

const MODULE_ID = 'bg3-hud-crucible';
const log = createLogger('bg3-hud-crucible');

/**
 * End turn and rest controls for Crucible.
 */
export class CrucibleActionButtonsContainer extends ActionButtonsContainer {
    constructor(options = {}) {
        super({
            ...options,
            getButtons: () => this.getCrucibleButtons()
        });
    }

    getCrucibleButtons() {
        const buttons = [];
        if (!this.actor) return buttons;

        buttons.push({
            key: 'end-turn',
            classes: ['end-turn-button'],
            icon: 'fas fa-stopwatch',
            label: game.i18n.localize(`${MODULE_ID}.Actions.EndTurn`),
            tooltip: game.i18n.localize(`${MODULE_ID}.Actions.EndTurn`),
            tooltipDirection: 'LEFT',
            visible: () => !!game.combat?.started &&
                game.combat?.combatant?.actor?.id === this.actor.id,
            onClick: async () => {
                if (game.combat) await game.combat.nextTurn();
            }
        });

        buttons.push({
            key: 'rest',
            classes: ['rest-button'],
            icon: 'fas fa-bed',
            label: game.i18n.localize(`${MODULE_ID}.Actions.Rest`),
            tooltip: game.i18n.localize(`${MODULE_ID}.Actions.Rest`),
            tooltipDirection: 'LEFT',
            visible: () => !game.combat?.started,
            onClick: async () => {
                const token = this._resolveTokenDocument();
                try {
                    await this.actor.useAction('rest', { dialog: true, token });
                } catch (error) {
                    log.error('Rest failed:', error);
                }
            }
        });

        return buttons;
    }

    _resolveTokenDocument() {
        return resolveTokenDocument(this.actor);
    }
}
