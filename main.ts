import { Plugin, Notice, FileSystemAdapter, TFile } from 'obsidian';
import { BannerSearchModal } from 'src/modals/BannerSearchModal';
import { GitPushModal } from 'src/modals/GitPushModal';
import { DefaultScannerModal } from 'src/modals/DefaultScannerModal';
import { ImportFromLinkModal } from 'src/modals/ImportFromLinkModal/ImportFromLinkModal';
import { SecretSettings } from 'src/types';


export default class extends Plugin {

    secretSettings: SecretSettings;

    async onload() {
        // https://lucide.dev/
        
        await this.loadSecretSettings();

        this.addRibbonIcon('image-plus', 'Search Banner', (evt: MouseEvent) => new BannerSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye', 'Default Banner Scan', (evt: MouseEvent) => new DefaultScannerModal(this.app).open());
        this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());
        this.addRibbonIcon('disc-3', 'Add Current Song', (evt: MouseEvent) => new ImportFromLinkModal(this.app, this.secretSettings).open());

        this.registerIframeMarkdownPostProcessor();
        
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

    private registerIframeMarkdownPostProcessor() {
        this.registerMarkdownPostProcessor((element, context) => {

            element.querySelectorAll("p").forEach(p => {
                const text = element.textContent?.trim() ?? "";

                // Spotify
                const spotifyMatch = text.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
                if (spotifyMatch) {
                    const [, thisType, thisId] = spotifyMatch;
                    const iframe = document.createElement("iframe");
                    iframe.classList.add('spotify-iframe');
                    iframe.classList.add(thisType);
                    iframe.src = `https://open.spotify.com/embed/${thisType}/${thisId}?theme=1`;
                    iframe.loading = "lazy";
                    p.replaceWith(iframe);
                }

                // Youtube
                const youtubeMatch = text.match(/(?:https|http):\/\/youtu.be\/(\w+)(?:$|\?)|(?:https|http):\/\/www.youtube.com\/embed\/(\w+)(?:$|\?)|(?:https|http):\/\/www.youtube.com\/watch\?v=(\w+)(?:$|&)/);
                if (youtubeMatch) {
                    const [, thisId] = youtubeMatch.filter(id => id);
                    const iframe = document.createElement("iframe");
                    iframe.classList.add('youtube-iframe');
                    iframe.src = `https://www.youtube.com/embed/${thisId}`;
                    iframe.loading = "lazy";
                    p.replaceWith(iframe);
                }

            });
            
        });
    }

}
