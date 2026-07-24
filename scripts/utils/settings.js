import { createSettingsSubmenu } from '/modules/bg3-hud-core/scripts/api/SettingsSubmenu.js';

const MODULE_ID = 'bg3-hud-crucible';

const openAutoPopulateConfiguration = async () => {
    const adapter = ui.BG3HOTBAR?.registry?.activeAdapter;
    if (!adapter?.autoPopulate) {
        ui.notifications.error('Auto-populate system not available');
        return;
    }

    const currentConfig = game.settings.get(MODULE_ID, 'autoPopulateConfiguration');
    const choices = await adapter.autoPopulate.getItemTypeChoices();

    if (!choices?.length) {
        ui.notifications.warn('No action types available for auto-populate');
        return;
    }

    const { showAutoPopulateConfigDialog } = await import(
        '/modules/bg3-hud-core/scripts/utils/dialogs.js'
    );

    const result = await showAutoPopulateConfigDialog({
        title: 'Configure Auto-Populate Grids',
        choices,
        configuration: currentConfig,
    });

    if (result) {
        await game.settings.set(MODULE_ID, 'autoPopulateConfiguration', result);
        ui.notifications.info('Auto-populate configuration saved');
    }
};

class AutoPopulateConfigMenu extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        window: { frame: false, positioned: false, resizable: false, minimizable: false },
        position: { width: 'auto', height: 'auto' },
        tag: 'div',
    };

    async render() {
        await openAutoPopulateConfiguration();
        return this;
    }
}

/**
 * Register Crucible adapter module settings
 */
export function registerSettings() {
    game.settings.register(MODULE_ID, 'showItemNames', {
        name: `${MODULE_ID}.Settings.ShowItemNames.Name`,
        hint: `${MODULE_ID}.Settings.ShowItemNames.Hint`,
        scope: 'client',
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, 'showItemUses', {
        name: `${MODULE_ID}.Settings.ShowItemUses.Name`,
        hint: `${MODULE_ID}.Settings.ShowItemUses.Hint`,
        scope: 'client',
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, 'defaultPortraitImageSource', {
        name: `${MODULE_ID}.Settings.DefaultPortraitImageSource.Name`,
        hint: `${MODULE_ID}.Settings.DefaultPortraitImageSource.Hint`,
        scope: 'client',
        config: false,
        type: String,
        choices: {
            token: `${MODULE_ID}.Settings.PortraitSource.Token`,
            portrait: `${MODULE_ID}.Settings.PortraitSource.Actor`
        },
        default: 'token',
        onChange: () => ui.BG3HUD_APP?.refresh()
    });

    game.settings.register(MODULE_ID, 'autoPopulateEnabled', {
        name: 'Auto-Populate on Token Creation',
        hint: 'Automatically populate hotbar grids when a new token is placed.',
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, 'autoPopulatePlayerCharacters', {
        name: 'Auto-Populate Player Characters',
        hint: 'Also auto-populate hotbars for player characters (heroes), not just adversaries.',
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, 'autoPopulateConfiguration', {
        name: 'Auto-Populate Configuration',
        hint: 'Configuration for which action types to auto-populate in each grid.',
        restricted: true,
        scope: 'world',
        config: false,
        type: Object,
        default: {
            grid0: ['strikes', 'movement'],
            grid1: ['spells'],
            grid2: ['favorites']
        }
    });

    const DisplaySettingsMenu = createSettingsSubmenu({
        moduleId: MODULE_ID,
        titleKey: 'Display Settings',
        sections: [
            { legend: 'Display Options', keys: ['showItemNames', 'showItemUses', 'defaultPortraitImageSource'] }
        ]
    });

    const AutoPopulateSettingsMenu = createSettingsSubmenu({
        moduleId: MODULE_ID,
        titleKey: 'Auto-Populate Settings',
        sections: [
            { legend: 'Auto-Populate Options', keys: ['autoPopulateEnabled', 'autoPopulatePlayerCharacters'] }
        ]
    });

    game.settings.registerMenu(MODULE_ID, 'autoPopulateConfigurationMenu', {
        name: 'Configure Auto-Populate Grids',
        label: 'Configure Grids',
        hint: 'Configure which action types appear in each hotbar grid.',
        icon: 'fas fa-grid-2',
        type: AutoPopulateConfigMenu,
        restricted: true,
    });

    // Display submenu — player-visible: holds per-client display preferences.
    game.settings.registerMenu(MODULE_ID, 'displaySettingsMenu', {
        name: 'Display Settings',
        label: 'Display',
        hint: 'Configure display options for the HUD.',
        icon: 'fas fa-list',
        type: DisplaySettingsMenu,
        restricted: false
    });

    game.settings.registerMenu(MODULE_ID, 'autoPopulateSettingsMenu', {
        name: 'Auto-Populate Settings',
        label: 'Auto-Populate',
        hint: 'Configure auto-populate behaviour.',
        icon: 'fas fa-list',
        type: AutoPopulateSettingsMenu,
        restricted: true
    });
}
