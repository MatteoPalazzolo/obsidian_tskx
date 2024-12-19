import { Plugin, Notice, FileSystemAdapter } from 'obsidian';
import { BannerSearchModal } from 'src/modals/BannerSearchModal';
import { GitPushModal } from 'src/modals/GitPushModal';
import { DefaultScannerModal } from 'src/modals/DefaultScannerModal';
import { SpotyImportModal } from 'src/modals/SpotyImportModal';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SecretSettings } from 'src/types';
import * as fs from "fs";
import * as path from "path";


export default class extends Plugin {

    sdk: SpotifyApi;
    secretSettings: SecretSettings;

    onload(): Promise<void> | void {
        // https://lucide.dev/
        
        this.loadSecretSettings();
        
        this.addRibbonIcon('image-plus', 'Search Banner', (evt: MouseEvent) => new BannerSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye', 'Default Banner Scan', (evt: MouseEvent) => new DefaultScannerModal(this.app).open());
        this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());
        this.addRibbonIcon('disc-3', 'Add Current Song', (evt: MouseEvent) => new SpotyImportModal(this.app, this.secretSettings).open());
        
        /*
        this.addRibbonIcon('disc-3', 'Add Current Song', (evt: MouseEvent) => addCurrentSong(
            this.sdk,
            this.secretSettings.clientId,
            this.secretSettings.secretId
        ));
        */
        this.registerSpotifyMarkdownPostProcessor();
    }

    onunload(): void {

    }

    private loadSecretSettings() {
        // is this mobile friendly ???
        const sensitiveFilePath = path.join((this.app.vault.adapter as FileSystemAdapter).getBasePath(), this.manifest.dir ?? "", "secret-settings.json");

        if (fs.existsSync(sensitiveFilePath)) {
            const data = fs.readFileSync(sensitiveFilePath, "utf-8");
            this.secretSettings = JSON.parse(data);
        } else {
            new Notice("secret-settings.json NOT found!");
        }
    }

    private registerSpotifyMarkdownPostProcessor() {
        this.registerMarkdownPostProcessor((element, context) => {

            element.querySelectorAll("p").forEach(p => {
                const text = element.textContent?.trim() ?? "";
                console.log(text);
                const match = text.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
                if (match) {
                    const [, thisType, thisId] = match;
                    const iframe = document.createElement("iframe");
                    iframe.classList.add('spotify-iframe');
                    iframe.src = `https://open.spotify.com/embed/${thisType}/${thisId}?theme=1`;
                    iframe.loading = "lazy";
                    console.log("callback called");
                    p.replaceWith(iframe);
                }
            });
        });
    }

}
