const HUD_SELECTOR = '.bg3-hud, #bg3-hotbar-container, .bg3-container-popover';

/**
 * Shared Crucible tooltip host attributes (system pointerenter + renderCard).
 * @param {HTMLElement} element
 * @param {object} options
 * @param {string} options.type - crucibleTooltip value (action, activeEffect, …)
 * @param {string} [options.uuid]
 * @param {string} [options.actionId]
 */
export function applyCrucibleTooltipHost(element, { type, uuid, actionId } = {}) {
    if (!element || game.system.id !== 'crucible' || !type) return;

    element.dataset.crucibleTooltip = type;
    element.dataset.tooltipDirection = 'UP';
    element.dataset.tooltipClass = 'crucible crucible-tooltip';

    if (uuid) element.dataset.uuid = uuid;
    if (actionId) element.dataset.actionId = actionId;
}

/**
 * Middle-click pin / dismiss for Foundry tooltips on HUD Crucible hosts.
 */
export function installCrucibleTooltipPinning() {
    if (installCrucibleTooltipPinning._installed) return;
    installCrucibleTooltipPinning._installed = true;

    document.addEventListener('auxclick', (event) => {
        if (event.button !== 1 || game.system.id !== 'crucible') return;

        const locked = event.target.closest?.('.locked-tooltip');
        if (locked && typeof game.tooltip?.dismissLockedTooltip === 'function') {
            event.preventDefault();
            event.stopPropagation();
            game.tooltip.dismissLockedTooltip(locked);
            return;
        }

        const host = event.target.closest?.('[data-crucible-tooltip]');
        if (!host?.closest(HUD_SELECTOR)) return;

        if (game.tooltip?.element !== host) return;
        if (!host.dataset.tooltipHtml) return;

        if (typeof game.tooltip.lockTooltip !== 'function') return;

        event.preventDefault();
        event.stopPropagation();
        game.tooltip.lockTooltip();
    }, true);
}

/**
 * Patch core ActiveEffectButton so HUD effect icons use Crucible effect cards.
 */
export async function patchActiveEffectTooltips() {
    if (patchActiveEffectTooltips._patched) return;
    patchActiveEffectTooltips._patched = true;

    const { ActiveEffectButton } = await import(
        '/modules/bg3-hud-core/scripts/components/buttons/ActiveEffectButton.js'
    );

    const decorate = (element, effect) => {
        if (!element || !effect) return;
        applyCrucibleTooltipHost(element, { type: 'activeEffect', uuid: effect.uuid });
    };

    const originalRender = ActiveEffectButton.prototype.render;
    ActiveEffectButton.prototype.render = async function patchedRender() {
        const element = await originalRender.call(this);
        decorate(element, this.effect);
        return element;
    };

    const originalUpdate = ActiveEffectButton.prototype.update;
    ActiveEffectButton.prototype.update = async function patchedUpdate() {
        await originalUpdate.call(this);
        decorate(this.element, this.effect);
    };
}

/**
 * Register Crucible tooltip behaviour for the HUD.
 */
export function initCrucibleHudTooltips() {
    installCrucibleTooltipPinning();
    patchActiveEffectTooltips();
}
