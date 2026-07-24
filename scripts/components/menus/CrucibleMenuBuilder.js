import { buildActionCellData } from '../../utils/actionCell.js';
import { resolveUseTokenImage } from '/modules/bg3-hud-core/scripts/utils/portraitImage.js';

const MODULE_ID = 'bg3-hud-crucible';

/**
 * Context and portrait menus for Crucible HUD cells.
 */
export class CrucibleMenuBuilder {
    constructor(options = {}) {
        this.adapter = options.adapter ?? null;
    }

    async buildPortraitMenu(portraitContainer) {
        const actor = portraitContainer.actor;
        if (!actor) return [];

        const useTokenImage = resolveUseTokenImage(actor, MODULE_ID);

        return [
            {
                label: game.i18n.localize(`${MODULE_ID}.Menu.UseTokenImage`),
                icon: useTokenImage ? 'fas fa-check' : 'fas fa-chess-pawn',
                onClick: async () => {
                    if (!useTokenImage) await actor.setFlag(MODULE_ID, 'useTokenImage', true);
                    ui.BG3HUD_APP?.refresh();
                }
            },
            {
                label: game.i18n.localize(`${MODULE_ID}.Menu.UseCharacterPortrait`),
                icon: !useTokenImage ? 'fas fa-check' : 'fas fa-user',
                onClick: async () => {
                    if (useTokenImage) await actor.setFlag(MODULE_ID, 'useTokenImage', false);
                    ui.BG3HUD_APP?.refresh();
                }
            }
        ];
    }

    async buildMenu(cell, data) {
        if (!data) return [];

        const items = [];

        if (data.type === 'CrucibleAction') {
            items.push({
                label: game.i18n.localize(`${MODULE_ID}.Context.Use`),
                icon: 'fas fa-play',
                onClick: () => this.adapter?.onCellClick(cell, { shiftKey: false, type: 'click' })
            });
            items.push({
                label: `${game.i18n.localize(`${MODULE_ID}.Context.Use`)} (Quick)`,
                icon: 'fas fa-bolt',
                onClick: () => this.adapter?.onCellClick(cell, { shiftKey: true, type: 'click' })
            });

            const actor = data.actorUuid ? await fromUuid(data.actorUuid) : null;
            if (actor) {
                const favorites = new Set(actor.system.favorites ?? []);
                const isFavorite = favorites.has(data.actionId);
                items.push({
                    label: game.i18n.localize(isFavorite
                        ? `${MODULE_ID}.Context.RemoveFavorite`
                        : `${MODULE_ID}.Context.AddFavorite`),
                    icon: isFavorite ? 'fas fa-star' : 'far fa-star',
                    onClick: async () => {
                        if (isFavorite) favorites.delete(data.actionId);
                        else favorites.add(data.actionId);
                        await actor.update({ 'system.favorites': Array.from(favorites) });
                        const action = actor.actions[data.actionId];
                        if (action) await cell.setData(buildActionCellData(action, actor));
                    }
                });
            }

            if (data.itemData?.itemUuid) {
                items.push({
                    label: game.i18n.localize(`${MODULE_ID}.Context.OpenItem`),
                    icon: 'fas fa-box',
                    onClick: async () => {
                        const item = await fromUuid(data.itemData.itemUuid);
                        item?.sheet?.render(true);
                    }
                });
            }
        } else if (data.uuid) {
            const item = await fromUuid(data.uuid);
            if (item) {
                items.push({
                    label: game.i18n.localize(`${MODULE_ID}.Context.OpenItem`),
                    icon: 'fas fa-edit',
                    onClick: () => item.sheet?.render(true)
                });
            }
        }

        return items;
    }
}
