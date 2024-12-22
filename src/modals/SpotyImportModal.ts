import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { App, Modal, Notice, setIcon } from 'obsidian';
import { gitPush } from "../utils/GitPush";
import { SecretSettings } from "../types";

export class SpotyImportModal extends Modal {

    secretSettings: SecretSettings;

    constructor(app: App, secretSettings: SecretSettings) {
        super(app);
        this.secretSettings = secretSettings;
    }

    async onOpen() {
        if (!this.secretSettings.clientId || !this.secretSettings.secretId) {
            return new Notice("Secret Spotify Credentials NOT FOUND!");
        }

        const sdk: SpotifyApi = SpotifyApi.withClientCredentials(this.secretSettings.clientId, this.secretSettings.secretId);
        
        console.log(await sdk.albums.get("2npzGBEPDOfVLN8ajYm3pZ"));
        console.log(await sdk.artists.get("1UAY1hWd5x69hPVXMXIeri"));
        console.log(await sdk.tracks.get("30UQ4lCKtYYbKajGwjqKfQ"));

        const {contentEl} = this;
        contentEl.addClass("SpotyImportModal");
        contentEl.createEl('h3', { text: "Import from Spotify" });

        // Link SearchBar
        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'enter link'
        });

        const searchButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(searchButtonEl, 'search');
        
        // Generated Content Div
        const ansContainerEl = contentEl.createDiv({ cls: 'ans-container' });

        // Link SearchBar Events
        inputEl.addEventListener('paste', evt => {
            evt.preventDefault();
            const pastedText = evt.clipboardData?.getData('text') ?? "";
            inputEl.value = pastedText;
            this.processSpotifyLink(ansContainerEl, sdk, pastedText);
        
        });

        inputEl.addEventListener('keydown', evt => {
            if (evt.key === "Enter") {
                this.processSpotifyLink(ansContainerEl, sdk, inputEl.value);

            }
        });

        searchButtonEl.addEventListener('click', evt => {
            this.processSpotifyLink(ansContainerEl, sdk, inputEl.value);

        });

    }
    
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }

    processSpotifyLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, link: string) {
        console.log(link);

        /* use regex to find type and id */
        /* use id to fetch info from api */
        /* put info in a form to allow user to edit them */
        /* take edited data and use it to create a new note */
         
    }

}