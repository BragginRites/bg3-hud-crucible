import { createLogger } from '/modules/bg3-hud-core/scripts/utils/logger.js';
import { resolveUseTokenImage } from '/modules/bg3-hud-core/scripts/utils/portraitImage.js';

const MODULE_ID = 'bg3-hud-crucible';
const log = createLogger('bg3-hud-crucible');

/**
 * Portrait container with Crucible health/morale resource paths.
 */
export async function createCruciblePortraitContainer() {
    const { PortraitContainer } = await import('/modules/bg3-hud-core/scripts/components/containers/PortraitContainer.js');

    return class CruciblePortraitContainer extends PortraitContainer {
        _useTokenImage() {
            return resolveUseTokenImage(this.actor, MODULE_ID);
        }

        getPortraitImage() {
            if (this._useTokenImage()) {
                return this.token?.document?.texture?.src || this.actor?.img || '';
            }
            return this.actor?.img || this.token?.document?.texture?.src || '';
        }

        async render() {
            this.element = this.createElement('div', ['bg3-portrait-container']);

            if (!this.token || !this.actor) {
                return this.element;
            }

            if (this.infoContainer) {
                try {
                    const infoElement = await this.infoContainer.render();
                    this.element.appendChild(infoElement);
                } catch (error) {
                    log.warn('Info container render failed', error);
                }
            }

            const imageContainer = this.createElement('div', ['portrait-image-container']);
            const imageSubContainer = this.createElement('div', ['portrait-image-subcontainer']);
            const imageSrc = this.getPortraitImage();
            imageSubContainer.appendChild(this._createMediaElement(imageSrc, this.actor.name || 'Portrait'));
            imageContainer.appendChild(imageSubContainer);

            await this._renderPortraitData(imageContainer);

            this.element.appendChild(imageContainer);
            this._applyPortraitScale(imageSubContainer);
            this._registerPortraitMenu(imageContainer);

            return this.element;
        }

        getHealth() {
            const health = this.actor?.system?.resources?.health ?? {};
            const value = health.value ?? 0;
            const max = health.max || 1;
            const percent = Math.max(0, Math.min(100, (value / max) * 100));
            return {
                current: value,
                max,
                percent,
                damage: 100 - percent,
                temp: 0
            };
        }
    };
}
