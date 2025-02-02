import { Plugin, Notice } from 'obsidian';
import { OldBannerSearchModal }    from 'src/Modals/OldBannerSearchModal/OldBannerSearchModal';
import { ImageSearchModal }    from 'src/Modals/ImageSearchModal/ImageSearchModal';
import { GitPushModal }         from 'src/Modals/GitPushModal/GitPushModal';
import { ErrorScannerModal }  from 'src/Modals/ErrorScannerModal/ErrorScannerModal';
import { ImportFromLinkModal }  from 'src/Modals/ImportFromLinkModal/ImportFromLinkModal';
import { registerCodeBlockProcessor }           from 'src/Widgets/GalleryCodeBlock';
import { registerIframeMarkdownPostProcessor }  from 'src/Widgets/IframePostProcessor';
import { SecretSettings } from 'src/types';
import { SECRET_SETTINGS_FILENAME } from 'src/conts';


export default class extends Plugin {

    secretSettings: SecretSettings;

    async onload() {
        // https://lucide.dev/

        await this.loadSecretSettings();

        this.addRibbonIcon('disc-3'     , 'Import From Link', (evt: MouseEvent) => new ImportFromLinkModal(this.app, this.secretSettings).open());
        this.addRibbonIcon('image-plus' , 'Image Search', (evt: MouseEvent) => new ImageSearchModal(this.app).open());
        this.addRibbonIcon('trash-2'    , 'Old Banner Search', (evt: MouseEvent) => new OldBannerSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye'   , 'Error Scan', (evt: MouseEvent) => new ErrorScannerModal(this.app).open());
        this.addRibbonIcon('github'     , 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());

        registerIframeMarkdownPostProcessor.call(this);
        registerCodeBlockProcessor.call(this);

    }

    onunload() {

    }

    private async loadSecretSettings() {
        const secretSettingsFilePath = (this.manifest.dir ?? "") + "/" + SECRET_SETTINGS_FILENAME;
        const data = await this.app.vault.adapter.read(secretSettingsFilePath);

        if (data) {
            this.secretSettings = JSON.parse(data);
            new Notice("secret-settings.json FOUND!");
        } else {
            new Notice("secret-settings.json NOT FOUND!");
        }

    }
    
}