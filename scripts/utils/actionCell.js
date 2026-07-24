const ACTION_UUID_PREFIX = 'crucible-action:';

/**
 * Resolve the most appropriate token document for an actor, preferring the
 * hotbar's current token, then a sole active token, then a sole controlled
 * token, then the first active token.
 * @param {Actor} actor
 * @returns {TokenDocument|null}
 */
export function resolveTokenDocument(actor) {
    const hotbarToken = ui.BG3HUD_APP?.currentToken;
    if (hotbarToken?.actor?.id === actor.id) {
        return hotbarToken.document;
    }
    const tokens = actor.getActiveTokens();
    if (tokens.length === 1) return tokens[0].document;
    const controlled = tokens.filter(t => t.controlled);
    if (controlled.length === 1) return controlled[0].document;
    return tokens[0]?.document ?? null;
}

/**
 * Stable hotbar uuid for a Crucible action (not a Foundry document uuid).
 * @param {Actor} actor
 * @param {string} actionId
 * @returns {string}
 */
export function actionCellUuid(actor, actionId) {
    return `${ACTION_UUID_PREFIX}${actor.uuid}:${actionId}`;
}

/**
 * Parse action id from crucible.action drag payload macro command.
 * @param {object} dragData
 * @returns {string|null}
 */
export function parseActionIdFromDrag(dragData) {
    if (dragData.actionId) return dragData.actionId;

    const command = dragData.macroData?.command ?? '';
    const match = command.match(/macroAction\s*\(\s*actor\s*,\s*"([^"]+)"/);
    return match?.[1] ?? null;
}

/**
 * Infer filter category from action tags and id.
 * @param {object} action - Prepared CrucibleAction on the actor
 * @returns {string}
 */
export function getActionCategory(action) {
    if (!action) return 'other';
    if (action.tags?.has?.('movement')) return 'movement';
    if (action.tags?.has?.('spell')) return 'spell';
    if (action.id === 'strike' || action.tags?.has?.('strike')) return 'strike';
    if (action.id === 'defend') return 'defend';
    if (action.id === 'cast') return 'spell';
    if (action.id === 'move') return 'movement';
    return 'other';
}

/**
 * @param {object} action - Prepared CrucibleAction on the actor
 * @param {Actor} actor
 * @returns {object}
 */
export function buildActionCellData(action, actor) {
    const actionId = action.id;
    const cost = action.cost?.action ?? 0;
    const category = getActionCategory(action);

    const cellData = {
        uuid: actionCellUuid(actor, actionId),
        actorUuid: actor.uuid,
        actionId,
        name: action.name,
        img: action.img || 'icons/svg/mystery-man.svg',
        type: 'CrucibleAction',
        itemData: {
            actionCost: cost,
            focusCost: action.cost?.focus ?? 0,
            heroismCost: action.cost?.heroism ?? 0,
            category,
            favorite: actor.system?.favorites?.has?.(actionId) ?? false,
            itemUuid: action.item?.uuid ?? null
        }
    };

    if (game.settings.get('bg3-hud-crucible', 'showItemUses') && cost > 0) {
        cellData.uses = { value: cost, max: cost };
    }

    return cellData;
}
