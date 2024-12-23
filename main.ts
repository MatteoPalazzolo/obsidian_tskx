import { Plugin, Notice, FileSystemAdapter, TFile } from 'obsidian';
import { BannerSearchModal } from 'src/modals/BannerSearchModal';
import { GitPushModal } from 'src/modals/GitPushModal';
import { DefaultScannerModal } from 'src/modals/DefaultScannerModal';
import { SpotifyImportModal } from 'src/modals/SpotifyImportModal';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SecretSettings } from 'src/types';


export default class extends Plugin {

    sdk: SpotifyApi;
    secretSettings: SecretSettings;

    async onload(): Promise<void> {
        // https://lucide.dev/
        
        await this.loadSecretSettings();

        this.addRibbonIcon('image-plus', 'Search Banner', (evt: MouseEvent) => new BannerSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye', 'Default Banner Scan', (evt: MouseEvent) => new DefaultScannerModal(this.app).open());
        this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());
        this.addRibbonIcon('disc-3', 'Add Current Song', (evt: MouseEvent) => new SpotifyImportModal(this.app, this.secretSettings).open());

        this.registerSpotifyMarkdownPostProcessor();
        
    }

    onunload(): void {

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

    private registerSpotifyMarkdownPostProcessor() {
        this.registerMarkdownPostProcessor((element, context) => {

            element.querySelectorAll("p").forEach(p => {
                const text = element.textContent?.trim() ?? "";
                const match = text.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
                if (match) {
                    const [, thisType, thisId] = match;
                    const iframe = document.createElement("iframe");
                    iframe.classList.add('spotify-iframe');
                    iframe.src = `https://open.spotify.com/embed/${thisType}/${thisId}?theme=1`;
                    iframe.loading = "lazy";
                    p.replaceWith(iframe);
                }
            });
            
        });
    }

}
