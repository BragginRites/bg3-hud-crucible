import { AutoPopulateFramework } from '/modules/bg3-hud-core/scripts/features/AutoPopulateFramework.js';
import { buildActionCellData, getActionCategory } from '../utils/actionCell.js';

const MODULE_ID = 'bg3-hud-crucible';

/**
 * Crucible auto-populate — sources actor.actions, not item lists.
 */
export class CrucibleAutoPopulate extends AutoPopulateFramework {
    async getItemTypeChoices() {
        return [
            {
                group: game.i18n.localize(`${MODULE_ID}.AutoPopulate.Groups.Actions`),
                choices: [
                    this._choice('all', 'AllActions'),
                    this._choice('favorites', 'Favorites'),
                    this._choice('strikes', 'Strikes'),
                    this._choice('spells', 'Spells'),
                    this._choice('movement', 'Movement')
                ]
            }
        ];
    }

    /**
     * @param {Actor} actor
     * @param {string[]} selectedTypes
     * @returns {Promise<Array<object>>}
     */
    async getMatchingItems(actor, selectedTypes) {
        const actions = Object.values(actor.actions ?? {});
        const favorites = actor.system?.favorites;
        const results = [];

        for (const action of actions) {
            if (!this._matchesSelection(action, selectedTypes, favorites)) continue;
            results.push(buildActionCellData(action, actor));
        }

        return results;
    }

    /**
     * @param {object} action
     * @param {string[]} selectedTypes
     * @param {Set<string>} favorites
     * @returns {boolean}
     */
    _matchesSelection(action, selectedTypes, favorites) {
        const category = getActionCategory(action);

        for (const type of selectedTypes) {
            switch (type) {
                case 'all':
                    return true;
                case 'favorites':
                    if (favorites?.has?.(action.id)) return true;
                    break;
                case 'strikes':
                    if (category === 'strike') return true;
                    break;
                case 'spells':
                    if (category === 'spell') return true;
                    break;
                case 'movement':
                    if (category === 'movement') return true;
                    break;
                default:
                    break;
            }
        }
        return false;
    }

    _choice(value, labelKey) {
        return {
            value,
            label: game.i18n.localize(`${MODULE_ID}.AutoPopulate.ItemTypes.${labelKey}`)
        };
    }
}
