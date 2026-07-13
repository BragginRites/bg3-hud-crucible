import { AutoSortFramework } from '/modules/bg3-hud-core/scripts/features/AutoSortFramework.js';
import { getActionCategory } from '../utils/actionCell.js';

/**
 * Crucible auto-sort — action cost, category, then name.
 */
export class CrucibleAutoSort extends AutoSortFramework {
    async enrichItemsForSort(items) {
        for (const item of items) {
            if (item.type === 'CrucibleAction') {
                item.sortData = {
                    name: item.name ?? '',
                    cost: item.itemData?.actionCost ?? 99,
                    category: item.itemData?.category ?? 'other',
                    favorite: item.itemData?.favorite ? 0 : 1
                };
                continue;
            }

            if (!item.uuid) continue;
            try {
                const doc = await fromUuid(item.uuid);
                if (doc) {
                    item.name = doc.name;
                    item.sortData = { name: doc.name };
                }
            } catch {
                item.sortData = { name: item.name ?? '' };
            }
        }
    }

    async sortItems(items) {
        items.sort((a, b) => {
            const sa = a.sortData ?? {};
            const sb = b.sortData ?? {};

            if (sa.favorite !== sb.favorite) return sa.favorite - sb.favorite;

            const costA = sa.cost ?? 99;
            const costB = sb.cost ?? 99;
            if (costA !== costB) return costA - costB;

            const catOrder = { strike: 0, spell: 1, movement: 2, defend: 3, other: 4 };
            const catA = catOrder[sa.category] ?? 5;
            const catB = catOrder[sb.category] ?? 5;
            if (catA !== catB) return catA - catB;

            return (sa.name || '').localeCompare(sb.name || '');
        });
    }
}
