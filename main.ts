import { Plugin, Notice } from 'obsidian';
import { BannerSearchModal } from 'src/modals/BannerSearchModal';
import { GitPushModal } from 'src/modals/GitPushModal';
import { DefaultScannerModal } from 'src/modals/DefaultScannerModal';
import { ImportFromLinkModal } from 'src/modals/ImportFromLinkModal/ImportFromLinkModal';
import { SecretSettings } from 'src/types';
import { registerCodeBlockProcessor } from 'src/widgets/GalleryCodeBlock';
import { registerIframeMarkdownPostProcessor } from 'src/widgets/IframePostProcessor';


export default class extends Plugin {

    secretSettings: SecretSettings;

    async onload() {
        // https://lucide.dev/

        await this.loadSecretSettings();

        this.addRibbonIcon('image-plus', 'Search Banner', (evt: MouseEvent) => new BannerSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye', 'Default Banner Scan', (evt: MouseEvent) => new DefaultScannerModal(this.app).open());
        this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());
        this.addRibbonIcon('disc-3', 'Import From Link', (evt: MouseEvent) => new ImportFromLinkModal(this.app, this.secretSettings).open());

        registerIframeMarkdownPostProcessor.call(this);
        registerCodeBlockProcessor.call(this);

    }

    onunload() {

    }

    private async loadSecretSettings() {
        const secretSettingsFilePath = (this.manifest.dir ?? "") + "/secret-settings.json";
        const data = await this.app.vault.adapter.read(secretSettingsFilePath);

        if (data) {
            this.secretSettings = JSON.parse(data);
            new Notice("secret-settings.json FOUND!");
        } else {
            new Notice("secret-settings.json NOT FOUND!");
        }

    }
    
}