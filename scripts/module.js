/**
 * BG3 HUD Crucible Adapter Module
 */

import { registerSettings } from './utils/settings.js';
import { createCruciblePortraitContainer } from './components/containers/CruciblePortraitContainer.js';
import { getCrucibleRests } from './components/containers/CrucibleActionButtonsContainer.js';
import { ActiveEffectsContainer } from '/modules/bg3-hud-core/scripts/components/containers/ActiveEffectsContainer.js';
import { CrucibleFilterContainer } from './components/containers/CrucibleFilterContainer.js';
import { CrucibleInfoContainer } from './components/containers/CrucibleInfoContainer.js';
import { CrucibleAutoPopulate } from './features/CrucibleAutoPopulate.js';
import { CrucibleAutoSort } from './features/CrucibleAutoSort.js';
import { CrucibleMenuBuilder } from './components/menus/CrucibleMenuBuilder.js';
import { buildActionCellData, parseActionIdFromDrag, resolveTokenDocument } from './utils/actionCell.js';
import { applyCrucibleTooltipHost, initCrucibleHudTooltips } from './utils/crucibleTooltips.js';
import { createLogger } from '/modules/bg3-hud-core/scripts/utils/logger.js';

const MODULE_ID = 'bg3-hud-crucible';
const log = createLogger('bg3-hud-crucible');

log.debug('Loading adapter');

Hooks.once('init', () => {
    registerSettings();
});

Hooks.on('bg3HudReady', async (BG3HUD_API) => {
    if (game.system.id !== 'crucible') {
        log.warn('Not running Crucible system, skipping registration');
        return;
    }

    const CruciblePortraitContainer = await createCruciblePortraitContainer();
    const adapter = new CrucibleAdapter();

    BG3HUD_API.registerNamedHudParts({
        portrait: CruciblePortraitContainer,
        filter: CrucibleFilterContainer,
        characterInfo: CrucibleInfoContainer,
        activeEffects: ActiveEffectsContainer,
        rest: getCrucibleRests
    });
    BG3HUD_API.registerAdapter(adapter);
    BG3HUD_API.registerMenuBuilder('crucible', CrucibleMenuBuilder, { adapter });

    initCrucibleHudTooltips();

    // Refresh filter action-point pips when resources change
    Hooks.on('updateActor', (actor, changes) => {
        if (!changes.system?.resources) return;
        const hotbarApp = ui.BG3HUD_APP;
        if (!hotbarApp?.currentActor || hotbarApp.currentActor.id !== actor.id) return;
        hotbarApp.components?.filters?.render?.();
    });

    Hooks.call('bg3HudRegistrationComplete');
});

/**
 * Crucible system adapter
 */
class CrucibleAdapter {
    constructor() {
        this.MODULE_ID = MODULE_ID;
        this.systemId = 'crucible';
        this.name = 'Crucible Adapter';

        this.autoSort = new CrucibleAutoSort();
        this.autoPopulate = new CrucibleAutoPopulate();
        this.autoPopulate.setAutoSort(this.autoSort);
        this._menuBuilder = new CrucibleMenuBuilder({ adapter: this });
    }

    isCompatible(actor) {
        return actor && (actor.type === 'hero' || actor.type === 'adversary');
    }

    getPortraitDataDefaults() {
        return [
            { path: 'system.resources.health.value', icon: 'fas fa-heart', color: '#c0392b' },
            { path: 'system.resources.morale.value', icon: 'fas fa-brain', color: '#8e44ad' },
            { path: 'system.resources.action.value', icon: 'fas fa-bolt', color: '#ffd86b' },
            { path: 'system.resources.focus.value', icon: 'fas fa-eye', color: '#3498db' },
            { path: 'system.defenses.physical.total', icon: 'fas fa-shield-alt', color: '#7f8c8d' },
            { path: '', icon: '', color: '#ffffff' }
        ];
    }

    async onAdapterFlagsChanged() {
        return false;
    }

    transformActionToCellData(action, actor) {
        if (!action || !actor) return null;
        return buildActionCellData(action, actor);
    }

    async transformItemToCellData(item) {
        const actor = item.actor;
        if (!actor) {
            return {
                uuid: item.uuid,
                name: item.name,
                img: item.img,
                type: 'Item'
            };
        }

        // Prefer a single matching prepared action for this item
        const actions = Object.values(actor.actions ?? {});
        const itemActions = actions.filter(a => a.item?.id === item.id);
        if (itemActions.length === 1) {
            return buildActionCellData(itemActions[0], actor);
        }

        return {
            uuid: item.uuid,
            name: item.name,
            img: item.img,
            type: 'Item',
            itemData: { itemType: item.type }
        };
    }

    async onCellClick(cell, event) {
        const data = cell.data;
        if (!data) return;

        switch (data.type) {
            case 'CrucibleAction':
                await this._useAction(data, event);
                break;
            case 'Item':
                await this._useItem(data.uuid, event);
                break;
            case 'Macro':
                await this._executeMacro(data.uuid);
                break;
            default:
                if (data.uuid) await this._useItem(data.uuid, event);
        }
    }

    async getCellMenuItems(cell) {
        return this._menuBuilder.buildMenu(cell, cell.data);
    }

    async resolveExternalDragData(dragData) {
        if (dragData.type === 'crucible.action') {
            const actor = ui.BG3HUD_APP?.currentActor;
            if (!actor) return null;

            const actionId = parseActionIdFromDrag(dragData);
            if (!actionId) return null;

            const action = actor.actions[actionId];
            if (!action) {
                ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.Notifications.ActionNotFound`));
                return null;
            }

            return { cellData: buildActionCellData(action, actor) };
        }

        return null;
    }

    decorateCellElement(cellElement, cellData) {
        if (!cellData) return;

        if (cellData.type === 'CrucibleAction' && cellData.actorUuid && cellData.actionId) {
            cellElement.classList.add('action', 'line-item');
            applyCrucibleTooltipHost(cellElement, {
                type: 'action',
                uuid: cellData.actorUuid,
                actionId: cellData.actionId
            });
        } else if (cellData.actionId) {
            cellElement.dataset.actionId = cellData.actionId;
        }

        const itemData = cellData.itemData ?? {};
        if (itemData.category) {
            cellElement.dataset.actionCategory = itemData.category;
        }
        if (itemData.actionCost !== undefined) {
            cellElement.dataset.actionCost = String(itemData.actionCost);
        }
        if (itemData.favorite) {
            cellElement.dataset.favorite = 'true';
        }
        if (itemData.itemType) {
            cellElement.dataset.itemType = itemData.itemType;
        }
    }

    getDisplaySettings() {
        return {
            showItemNames: game.settings.get(MODULE_ID, 'showItemNames'),
            showItemUses: game.settings.get(MODULE_ID, 'showItemUses')
        };
    }

    async _useAction(data, event) {
        const actor = await fromUuid(data.actorUuid);
        if (!actor) {
            ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.Notifications.NoActor`));
            return;
        }

        const action = actor.actions[data.actionId];
        if (!action) {
            ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.Notifications.ActionNotFound`));
            return;
        }

        const token = this._getTokenDocument(actor);
        const dialog = !event?.shiftKey;

        try {
            await actor.useAction(data.actionId, { dialog, token });
        } catch (error) {
            log.error('Action use failed:', error);
        }
    }

    async _useItem(uuid, event) {
        const item = await fromUuid(uuid);
        if (!item) return;

        const actor = item.actor;
        if (!actor) {
            item.sheet?.render(true);
            return;
        }

        const actions = Object.values(actor.actions ?? {}).filter(a => a.item?.id === item.id);
        if (actions.length === 1) {
            await this._useAction(buildActionCellData(actions[0], actor), event);
            return;
        }

        item.sheet?.render(true);
    }

    async _executeMacro(uuid) {
        const macro = await fromUuid(uuid);
        if (macro) await macro.execute();
    }

    _getTokenDocument(actor) {
        return resolveTokenDocument(actor);
    }
}
