import { Plugin, Notice } from 'obsidian';
// import { OldBannerSearchModal }    from 'src/Modals/OldBannerSearchModal/OldBannerSearchModal';
import { ImageSearchModal }                     from 'src/Modals/ImageSearchModal/ImageSearchModal';
import { GitPushModal }                         from 'src/Modals/GitPushModal/GitPushModal';
import { ScannerModal }                         from 'src/Modals/ScannerModal/ScannerModal';
import { ImportFromLinkModal }                  from 'src/Modals/ImportFromLinkModal/ImportFromLinkModal';
import { registerCodeBlockProcessor }           from 'src/Widgets/GalleryCodeBlock';
import { registerIframeMarkdownPostProcessor }  from 'src/Widgets/IframePostProcessor';
import { SecretSettings } from 'src/types';
import { SECRET_SETTINGS_FILENAME } from 'src/conts';
import { registerTemplatezListener } from 'src/utils/templatez';


export default class extends Plugin {

    secretSettings: SecretSettings;

    async onload() {
        // https://lucide.dev/

        await this.loadSecretSettings();

        this.addRibbonIcon('link'     , 'Import From Link', (evt: MouseEvent) => new ImportFromLinkModal(this.app, this.secretSettings).open());
        this.addRibbonIcon('image-plus' , 'Image Search', (evt: MouseEvent) => new ImageSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye'   , 'Scanner', (evt: MouseEvent) => new ScannerModal(this.app).open());
        this.addRibbonIcon('github'     , 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());

        registerIframeMarkdownPostProcessor.call(this);
        registerCodeBlockProcessor.call(this);
        registerTemplatezListener.call(this);        

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