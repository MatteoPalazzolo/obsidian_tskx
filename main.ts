import {Plugin, Notice, TFile} from 'obsidian';
import { ImageSearchModal }                     from 'src/modals/ImageSearchModal/ImageSearchModal';
import { GitPushModal }                         from 'src/modals/GitPushModal/GitPushModal';
import { ScannerModal }                         from 'src/modals/ScannerModal/ScannerModal';
import { ImportFromLinkModal }                  from 'src/modals/ImportFromLinkModal/ImportFromLinkModal';
import { registerCodeBlockProcessor }           from 'src/widgets/GalleryCodeBlock';
import { registerIframeMarkdownPostProcessor }  from 'src/widgets/IframePostProcessor';
import { SecretSettings } from 'src/types';
import { SECRET_SETTINGS_FILENAME } from 'src/conts';
import * as PatchMetadataPropertiesDOM from 'src/hacks/patchMetadataPropertiesDOM';
import * as StatusMetadataPropertiesDOM from 'src/hacks/statusMetadataPropertiesDOM';
import {
	init as initTemplateAPIModule,
	isTemplateCoherentToParentTemplate,
	registerTemplatezListener,
} from 'src/utils/templateAPI';
import {refreshIcon} from "src/hacks/statusMetadataPropertiesDOM";


export default class extends Plugin {

    secretSettings: SecretSettings;

    async onload() {
        // https://lucide.dev/

        await this.loadSecretSettings();

		// init modules
		initTemplateAPIModule(this);
		PatchMetadataPropertiesDOM.init(this);
		StatusMetadataPropertiesDOM.init(this);

        this.addRibbonIcon('link', 'Import From Link', (evt: MouseEvent) => new ImportFromLinkModal(this.app, this.secretSettings).open());
        this.addRibbonIcon('image-plus', 'Image Search', (evt: MouseEvent) => new ImageSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye', 'Scanner', (evt: MouseEvent) => new ScannerModal(this.app).open());
		this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());

		this.addRibbonIcon('bug', 'Debug', async (evt: MouseEvent) => {
			const fileT = this.app.vault.getAbstractFileByPath("!MediaAnalysis/!Books/!Books/!Template.md") as TFile;
			console.log(await isTemplateCoherentToParentTemplate.call(this, fileT));
		});

		registerIframeMarkdownPostProcessor.call(this);
		registerCodeBlockProcessor.call(this);

		this.app.workspace.onLayoutReady(() => {
			registerTemplatezListener();
			PatchMetadataPropertiesDOM.refreshButton();
			StatusMetadataPropertiesDOM.refreshIcon();
		});

    }

    onunload() {
		PatchMetadataPropertiesDOM.clear();
		StatusMetadataPropertiesDOM.clear();
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
