import { App, Modal, Notice, setIcon, TFile } from 'obsidian';
import { NewSpotifyTrackData, SecretSettings } from "../types";
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import dayjs from "dayjs";

export class SpotifyImportModal extends Modal {

    secretSettings: SecretSettings;

    constructor(app: App, secretSettings: SecretSettings) {
        super(app);
        this.secretSettings = secretSettings;
    }

    async onOpen() {
        
        if (!this.secretSettings.clientId || !this.secretSettings.secretId) {
            new Notice("Secret Spotify Credentials NOT FOUND!");
            return; 
        }

        const sdk: SpotifyApi = SpotifyApi.withClientCredentials(this.secretSettings.clientId, this.secretSettings.secretId);

        const {contentEl} = this;
        contentEl.addClass("SpotifyImportModal");
        contentEl.createEl('h3', { text: "Import from Spotify" });

        // Link SearchBar
        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'enter link'
        });

        const searchButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(searchButtonEl, 'search');
        
        // Separation Line
        contentEl.createEl('hr');
        
        // Generated Content Div
        const ansContainerEl = contentEl.createDiv({ cls: 'ans-container' });
        ansContainerEl.createSpan({text:"test"});

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

    async processSpotifyLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, link: string) {

        /* use regex to find type and id */
        const match = link.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
        if (!match) {
            new Notice("Invalid URL (1)");
            return;
        }
        const [, thisType, thisId] = match;
                
        /* use id to fetch info from api */
        let newFile: undefined | TFile = undefined;
        switch(thisType) {
            case "track":
                newFile = await this.processSpotifyTrackLink(ansContainerEl, sdk, thisId);
                break;
            case "album":
                newFile = await this.processSpotifyAlbumLink(ansContainerEl, sdk, thisId);
                break;
            case "artist":
                newFile = await this.processSpotifyArtistLink(ansContainerEl, sdk, thisId);
                break;
            default:
                new Notice("Invalid URL (2)");
                return; 
        }
        
        if (newFile) {
            this.app.workspace.getLeaf(false).openFile(newFile);
        }
         
    }

    // put info in a form to allow user to edit them
    async processSpotifyTrackLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, thisId: string) {
        const ans = await sdk.tracks.get(thisId);
        console.log(ans);

        ansContainerEl.empty();
        const newAns: NewSpotifyTrackData = ans;
        
        return await this.commitSpotifyTrackLink(ans, thisId);

    }

    // take edited data and use it to create a new note
    async commitSpotifyTrackLink(ans: NewSpotifyTrackData, thisId: string) : Promise<undefined | TFile> {
        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = "Analysis/Music/Canzoni/" + ans.name.replace(forbiddenCharsRegex, "_")  + ".md";

        const SONG_TEMPLATE_PATH = "!Templates/Music Song Analysis Template.md"

        const file = this.app.vault.getAbstractFileByPath(SONG_TEMPLATE_PATH);

        if (!file || !(file instanceof TFile)) {
            new Notice(SONG_TEMPLATE_PATH + " NOT FOUND!");
            return; 
        }

        const newFileContent = (await this.app.vault.cachedRead(file))
        .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
        .replace("{author}", ans.name)
        .replace("{album}", "\n  - " + ans.artists.map( a => a.name ).join("\n  - "))
        .replace("{index}", ""+ans.track_number)
        .replace("https://open.spotify.com/track/", `https://open.spotify.com/embed/track/${thisId}?theme=1`);
        
        const newFile = await this.app.vault.create(newFilePath, newFileContent).catch( (error:Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        return newFile as undefined | TFile;
    }
    
    
    async processSpotifyAlbumLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, thisId: string) : Promise<undefined | TFile>  {
        const ans = await sdk.albums.get(thisId);
        console.log(ans);
        ans.name;
        return;
        
    }

    
    async processSpotifyArtistLink(ansContainerEl: HTMLDivElement , sdk: SpotifyApi, thisId: string) : Promise<undefined | TFile>  {
        const ans = await sdk.artists.get(thisId);
        console.log(ans);
        ans.name;
        return;

    }

}