import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { App, Modal, Notice, setIcon } from 'obsidian';
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
        const templaterAPI = this.getTemplaterAPI()

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

    getTemplaterAPI(): any { 
        
        console.log(this.app.plugins.plugins["templater-obsidian"]);

        // Verifica se Templater è attivo
        const templaterPlugin = this.app.plugins.plugins["templater-obsidian"];
        if (!templaterPlugin) {
            new Notice("Templater plugin is not enabled.");
            return;
        }

        // Recupera Templater API
        const templaterAPI = templaterPlugin.templater;
        if (!templaterAPI) {
            new Notice("Templater API not available.");
            return;
        }

        console.log(templaterAPI.read_and_parse_template)
        console.log(templaterAPI.read_and_parse_template({template_file:"hola", target_file:"hola"}))

        return templaterAPI;

    }

    async processSpotifyLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, link: string) {

        /* use regex to find type and id */
        const match = link.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
        if (!match) 
            return new Notice("Invalid URL (1)");
        const [, thisType, thisId] = match;
                
        /* use id to fetch info from api */
        switch(thisType) {
            case "track":
                await this.processSpotifyTrackLink(ansContainerEl, sdk, thisId);
                break;
            case "album":
                await this.processSpotifyAlbumLink(ansContainerEl, sdk, thisId);
                break;
            case "artist":
                await this.processSpotifyArtistLink(ansContainerEl, sdk, thisId);
                break;
            default:
                return new Notice("Invalid URL (2)");
        }
        
        /* put info in a form to allow user to edit them */
        /* take edited data and use it to create a new note */
         
    }

    async processSpotifyTrackLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, thisId: string) {
        const ans = await sdk.tracks.get(thisId);
        console.log(ans);

        const newFilePath = "Analysis/Music/Canzoni/" + ans.name + ".md";
        const newFileContent = `---
name: ${ans.name}
author: 
  - ${ans.artists.map(a => a.name).join("\n  - ")}
---

# ${ans.name}

`;
        
        await this.app.vault.create(newFilePath, newFileContent).catch( (error:Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

    }
    
    async processSpotifyAlbumLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, thisId: string) {
        const ans = await sdk.albums.get(thisId);
        console.log(ans);
        ans.name;

    }

    
    async processSpotifyArtistLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, thisId: string) {
        const ans = await sdk.artists.get(thisId);
        console.log(ans);
        ans.name;

    }

}