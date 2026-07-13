import { FilterContainer } from '/modules/bg3-hud-core/scripts/components/containers/FilterContainer.js';

const MODULE_ID = 'bg3-hud-crucible';

/**
 * Filters hotbar cells by action cost, category, and favourites.
 */
export class CrucibleFilterContainer extends FilterContainer {
    constructor(options = {}) {
        super({
            ...options,
            getFilters: () => this.getCrucibleFilters()
        });
    }

    getCrucibleFilters() {
        const filters = [];
        if (!this.actor) return filters;

        const actionRes = this.actor.system?.resources?.action;
        const remaining = actionRes?.value ?? 0;
        const max = actionRes?.max ?? 6;
        const actionColor = '#ffd86b';

        for (let cost = 0; cost <= Math.min(max, 3); cost++) {
            filters.push({
                id: `action-cost-${cost}`,
                label: cost === 0
                    ? game.i18n.localize(`${MODULE_ID}.Filters.Action`)
                    : `${cost} AP`,
                short: String(cost),
                classes: ['action-cost-button'],
                color: actionColor,
                value: remaining >= cost ? 1 : 0,
                max: 1,
                data: { actionCost: cost },
                alwaysShow: cost <= 1
            });
        }

        filters.push({
            id: 'strike',
            label: game.i18n.localize(`${MODULE_ID}.Filters.Strike`),
            symbol: 'fa-sword',
            classes: ['action-type-button'],
            color: '#e74c3c',
            data: { category: 'strike' }
        });

        filters.push({
            id: 'spell',
            label: game.i18n.localize(`${MODULE_ID}.Filters.Spell`),
            symbol: 'fa-hat-wizard',
            classes: ['action-type-button'],
            color: '#9b59b6',
            data: { category: 'spell' }
        });

        filters.push({
            id: 'movement',
            label: game.i18n.localize(`${MODULE_ID}.Filters.Movement`),
            symbol: 'fa-person-running',
            classes: ['action-type-button'],
            color: '#2ecc71',
            data: { category: 'movement' }
        });

        filters.push({
            id: 'favorites',
            label: game.i18n.localize(`${MODULE_ID}.Filters.Favorites`),
            symbol: 'fa-star',
            classes: ['favorite-button'],
            color: '#f1c40f',
            data: { favorite: true }
        });

        return filters;
    }

    matchesFilter(filter, cell) {
        if (!filter?.data || !cell) return false;
        const data = filter.data;

        if (data.actionCost !== undefined) {
            const cellCost = cell.dataset.actionCost;
            return cellCost !== undefined && Number(cellCost) === data.actionCost;
        }

        if (data.category) {
            return cell.dataset.actionCategory === data.category;
        }

        if (data.favorite) {
            return cell.dataset.favorite === 'true';
        }

        return false;
    }
}
