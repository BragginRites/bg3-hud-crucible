import { InfoContainer } from '/modules/bg3-hud-core/scripts/components/containers/InfoContainer.js';
import { createLogger } from '/modules/bg3-hud-core/scripts/utils/logger.js';

const MODULE_ID = 'bg3-hud-crucible';
const log = createLogger('bg3-hud-crucible');

const CRUCIBLE_ABILITIES = {
    strength: 'STR',
    toughness: 'TOU',
    dexterity: 'DEX',
    intellect: 'INT',
    presence: 'PRE',
    wisdom: 'WIS'
};

/**
 * Identity, abilities, and skills for Crucible actors.
 */
export class CrucibleInfoContainer extends InfoContainer {
    constructor(options = {}) {
        super(options);
        this.selectedAbility = null;
    }

    async renderContent() {
        const content = this.createElement('div', ['bg3-info-content', 'crucible-info-content']);

        const identity = this.createElement('div', ['crucible-info-identity']);
        identity.textContent = this._getIdentityLine();
        content.appendChild(identity);

        const columns = this.createElement('div', ['crucible-info-columns']);
        columns.appendChild(await this._renderSkillsColumn());
        columns.appendChild(await this._renderAbilitiesColumn());
        content.appendChild(columns);

        return content;
    }

    async _renderAbilitiesColumn() {
        const column = this.createElement('div', ['crucible-info-abilities-col']);

        const header = this.createElement('div', ['bg3-info-section-header']);
        header.textContent = game.i18n.localize(`${MODULE_ID}.Info.Abilities`);
        column.appendChild(header);

        const abilities = this.createElement('div', ['crucible-info-abilities']);
        for (const [id, label] of Object.entries(CRUCIBLE_ABILITIES)) {
            const value = this.actor?.abilities?.[id]?.value
                ?? this.actor?.system?.abilities?.[id]?.value ?? 0;
            const pip = this.createElement('button', ['crucible-info-ability']);
            if (this.selectedAbility === id) pip.classList.add('selected');
            pip.type = 'button';
            pip.textContent = `${label} ${value}`;
            this.addEventListener(pip, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._onAbilityClick(id);
            });
            abilities.appendChild(pip);
        }
        column.appendChild(abilities);

        return column;
    }

    async _renderSkillsColumn() {
        const column = this.createElement('div', ['crucible-info-skills-col']);

        const header = this.createElement('div', ['bg3-info-section-header']);
        header.textContent = game.i18n.localize(`${MODULE_ID}.Info.Skills`);
        column.appendChild(header);

        const skillsRoot = this.createElement('div', ['crucible-info-skills']);
        const skillConfig = globalThis.crucible?.CONFIG?.SKILLS ?? {};
        const prepared = this.actor?.system?.skills ?? {};

        for (const [skillId, config] of Object.entries(skillConfig)) {
            if (this.selectedAbility && !config.abilities?.includes(this.selectedAbility)) continue;

            const skill = prepared[skillId];
            if (!skill) continue;

            const row = this.createElement('button', ['crucible-info-skill']);
            row.type = 'button';

            const name = this.createElement('span', ['crucible-info-skill-name']);
            name.textContent = game.i18n.localize(config.label);

            const score = this.createElement('span', ['crucible-info-skill-score']);
            const formatted = Number(skill.score ?? 0);
            score.textContent = formatted >= 0 ? `+${formatted}` : String(formatted);

            const passive = this.createElement('span', ['crucible-info-skill-passive']);
            passive.textContent = String(skill.passive ?? '');

            row.appendChild(name);
            row.appendChild(score);
            row.appendChild(passive);

            this.addEventListener(row, 'click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this._rollSkill(skillId);
            });

            skillsRoot.appendChild(row);
        }

        if (!skillsRoot.childElementCount) {
            const empty = this.createElement('div', ['crucible-info-skills-empty']);
            empty.textContent = this.selectedAbility
                ? game.i18n.localize(`${MODULE_ID}.Info.NoSkillsForAbility`)
                : game.i18n.localize(`${MODULE_ID}.Info.NoSkills`);
            skillsRoot.appendChild(empty);
        }

        column.appendChild(skillsRoot);
        return column;
    }

    async _onAbilityClick(abilityId) {
        this.selectedAbility = this.selectedAbility === abilityId ? null : abilityId;
        await this.update();
    }

    async _rollSkill(skillId) {
        if (!this.actor || typeof this.actor.rollSkill !== 'function') return;
        try {
            await this.actor.rollSkill(skillId, { dialog: true, chatMessage: true });
        } catch (error) {
            log.error('Skill roll failed:', error);
        }
    }

    _getIdentityLine() {
        if (!this.actor) return '';

        const tags = this.actor.getTags?.('short') ?? this.actor.getTags?.() ?? {};
        const tagLine = typeof tags === 'object'
            ? Object.values(tags).filter(Boolean).join(' · ')
            : String(tags);

        if (this.actor.type === 'hero') {
            const ancestry = this.actor.system?.details?.ancestry?.name;
            return [tagLine, ancestry].filter(Boolean).join(' — ');
        }

        if (this.actor.type === 'adversary') {
            const archetype = this.actor.system?.details?.archetype?.name;
            const rank = this.actor.system?.advancement?.rank;
            return [tagLine, archetype, rank].filter(Boolean).join(' — ');
        }

        return tagLine || this.actor.name;
    }
}
