import { Notice, Plugin } from 'obsidian';
import { ImageSearchModal }                    from 'src/modals/ImageSearchModal/ImageSearchModal';
import { ImportFromLinkModal }                 from 'src/modals/ImportFromLinkModal/ImportFromLinkModal';
import { registerCodeBlockProcessor }          from 'src/widgets/GalleryCodeBlock';
import { registerIframeMarkdownPostProcessor } from 'src/widgets/IframePostProcessor';
import { SecretSettings }                      from 'src/types';
import { SECRET_SETTINGS_FILENAME }            from 'src/conts';

/**
 * Entry point del plugin.
 *
 * Ruolo nell'architettura:
 * - Registra i punti di ingresso UI (ribbon) e i renderer Markdown.
 * - Carica le credenziali segrete usate dagli import automatici.
 *
 * Il plugin si occupa esclusivamente di:
 * - gallery (`GalleryCodeBlock` + `ImageSearchModal`);
 * - crawler di immagini (`imageScrapers`);
 * - import automatici specifici della forma del vault (Spotify + `LinkProcessor`);
 * - embed dei media nelle note (`IframePostProcessor`).
 *
 * Le feature di template e lo scanner sono state rimosse e vivono altrove.
 */
export default class extends Plugin {

    secretSettings: SecretSettings;

    async onload() {
        // Il file delle credenziali è indispensabile agli import Spotify,
        // quindi va caricato prima di registrare le ribbon.
        await this.loadSecretSettings();

		// Punti di ingresso UI
        this.addRibbonIcon('link', 'Import From Link', (evt: MouseEvent) => new ImportFromLinkModal(this.app, this.secretSettings).open());
        this.addRibbonIcon('image-plus', 'Image Search', (evt: MouseEvent) => new ImageSearchModal(this.app).open());

		// Renderer Markdown: gallery (code block) e iframe widget (post processor)
		registerIframeMarkdownPostProcessor.call(this);
		registerCodeBlockProcessor.call(this);
    }

    /**
     * Carica `secret-settings.json` dalla cartella del plugin.
     *
     * Se il file manca o non è parsabile, il plugin continua a funzionare con
     * credenziali vuote: l'unica conseguenza è che gli import Spotify
     * mostreranno il notice "Secret Spotify Credentials NOT FOUND!".
     */
    private async loadSecretSettings() {
        const secretSettingsFilePath = (this.manifest.dir ?? "") + "/" + SECRET_SETTINGS_FILENAME;

        try {
            const data = await this.app.vault.adapter.read(secretSettingsFilePath);
            if (!data) {
                throw new Error("secret-settings.json is empty");
            }

            // Normalizza la forma per evitare undefined a valle se il file è parziale.
            const parsed = JSON.parse(data);
            this.secretSettings = {
                spotify: {
                    clientId: parsed?.spotify?.clientId ?? "",
                    secretId: parsed?.spotify?.secretId ?? "",
                },
            };

            new Notice("secret-settings.json FOUND!");
        } catch (error) {
            this.secretSettings = {
                spotify: {
                    clientId: "",
                    secretId: "",
                },
            };

            new Notice("secret-settings.json NOT FOUND!");
            console.warn("Impossibile leggere secret-settings.json:", error);
        }
    }

}
