import { App, Modal, Notice, setIcon, TFile } from 'obsidian';
import { NewSpotifyAlbumData, NewSpotifyArtistData, NewSpotifyTrackData, SecretSettings } from "../types";
import { Album, Artist, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import dayjs from "dayjs";

// TODO: generalizzare a LinkImportModal
export class SpotifyImportModal extends Modal {

    TRACK_FOLDER = "Analysis/Musica/Canzoni/";
    ALBUM_FOLDER = "Analysis/Musica/Album/";
    ARTIST_FOLDER = "Analysis/Musica/Artisti/";

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

        const { contentEl } = this;
        contentEl.addClass("SpotifyImportModal");
        contentEl.createEl('h3', { text: "Import from link" });

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
        const { contentEl } = this;
        contentEl.empty();
    }


    private isFilenameAvaliable(filename: string, path: string): boolean {
        console.log(this.app.vault.getFiles()[30]);
        return this.app.vault.getFiles().filter(file => file.basename === filename && file.path.startsWith(path)).length === 0;
    }

    
    private async processSpotifyLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, link: string) {

        const match = link.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
        if (!match) {
            new Notice("Invalid URL (1)");
            return;
        }
        const [, thisType, thisId] = match;

        switch (thisType) {
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
                new Notice("Invalid URL (2)");
                return;
        }


    }


    async processSpotifyTrackLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, thisId: string) {

        /////////////////////////////

        ansContainerEl.empty();

        const ans: Track = await sdk.tracks.get(thisId);
        console.log(ans);

        const newAns: NewSpotifyTrackData = {
            name: ans.name,
            track_number: ans.track_number,
            artists: ans.artists.map(a => a.name),
            album: ans.album.name
        };
        console.log(newAns);

        /////////////////////////////

        ansContainerEl.createEl('h4', { text: "Spotify Track" });
        
        const inputDiv = ansContainerEl.createDiv({ cls: 'input-div' });
        inputDiv.createEl('h6', { text: "Filename" });
        const fileNameInput = inputDiv.createEl('input', {
            type: 'text', cls: 'text-input-class' + (this.isFilenameAvaliable(ans.name, this.TRACK_FOLDER) ? '' : ' error'),
            value: ans.name, placeholder: "File Name"
        });
        fileNameInput.addEventListener('input', evt => {
            if (this.isFilenameAvaliable(fileNameInput.value.trim(), this.TRACK_FOLDER)) {
                fileNameInput.classList.remove('error');
            } else {
                fileNameInput.classList.add('error');
            }
        });

        /////////////////////////////
        
        Object.entries({
            "```DETAILS": "",
            "Name: ": newAns.name,
            "Artists: ": newAns.artists.join(", "),
            "Album: ": newAns.album,
            "Index: ": newAns.track_number,
            "```": ""
        }).map(([k, v]) =>
            ansContainerEl.createDiv({
                cls: 'show-details-div'
            }).createSpan({
                text: k + v
            })
        );

        /////////////////////////////

        // Commit Button
        ansContainerEl.createDiv(
            { cls: 'confirm-note-creation-div' }
        ).createEl('button', 
            { text: 'Sure Af Dude', cls: 'mod-warning' }
        ).addEventListener('click', async () => {
            if (!this.isFilenameAvaliable(fileNameInput.value, this.TRACK_FOLDER)) {
                new Notice("ERROR: File Already Exists!")
                return;
            }
            await this.commitSpotifyTrackLink(fileNameInput.value, newAns, thisId);
            this.close();
        });

    }

    async commitSpotifyTrackLink(filename: string, ans: NewSpotifyTrackData, thisId: string) {
        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = this.TRACK_FOLDER + filename.trim().replace(forbiddenCharsRegex, "_") + ".md";

        const SONG_TEMPLATE_PATH = "!Templates/Music Song Analysis Template.md"

        const file = this.app.vault.getAbstractFileByPath(SONG_TEMPLATE_PATH);

        if (!file || !(file instanceof TFile)) {
            new Notice(SONG_TEMPLATE_PATH + " NOT FOUND!");
            return;
        }

        const newFileContent = (await this.app.vault.cachedRead(file))
            .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
            .replace("{name}", ans.name)
            .replace("{author}", "\n  - " + ans.artists.join("\n  - "))
            .replace("{album}", ans.album)
            .replace("{index}", "" + ans.track_number)
            .replace("https://open.spotify.com/track/", `https://open.spotify.com/track/${thisId}`);

        const newFile = await this.app.vault.create(newFilePath, newFileContent).catch((error: Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        if (newFile) {
            this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }


    async processSpotifyAlbumLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, thisId: string) {
        
        /////////////////////////////

        ansContainerEl.empty();

        const ans: Album = await sdk.albums.get(thisId);
        console.log(ans);

        const newAns: NewSpotifyAlbumData = {
            name: ans.name
        };
        console.log(newAns);

        /////////////////////////////

        ansContainerEl.createEl('h4', { text: "Spotify Album" });
        
        const inputDiv = ansContainerEl.createDiv({ cls: 'input-div' });
        inputDiv.createEl('h6', { text: "Filename" });
        const fileNameInput = inputDiv.createEl('input', {
            type: 'text', cls: 'text-input-class' + (this.isFilenameAvaliable(ans.name, this.ALBUM_FOLDER) ? '' : ' error'),
            value: ans.name, placeholder: "File Name"
        });
        fileNameInput.addEventListener('input', evt => {
            if (this.isFilenameAvaliable(fileNameInput.value.trim(), this.ALBUM_FOLDER)) {
                fileNameInput.classList.remove('error');
            } else {
                fileNameInput.classList.add('error');
            }
        });

        /////////////////////////////
        
        Object.entries({
            "```DETAILS": "",
            "Name: ": newAns.name,
            "```": ""
        }).map(([k, v]) =>
            ansContainerEl.createDiv({
                cls: 'show-details-div'
            }).createSpan({
                text: k + v
            })
        );

        /////////////////////////////

        // Commit Button
        ansContainerEl.createDiv(
            { cls: 'confirm-note-creation-div' }
        ).createEl('button', 
            { text: 'Sure Af Dude', cls: 'mod-warning' }
        ).addEventListener('click', async () => {
            if (!this.isFilenameAvaliable(fileNameInput.value, this.ALBUM_FOLDER)) {
                new Notice("ERROR: File Already Exists!")
                return;
            }
            await this.commitSpotifyAlbumLink(fileNameInput.value, newAns, thisId);
            this.close();
        });

    }

    async commitSpotifyAlbumLink(filename: string, ans: NewSpotifyAlbumData, thisId: string) {
        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = this.ALBUM_FOLDER + filename.trim().replace(forbiddenCharsRegex, "_") + ".md";

        const SONG_TEMPLATE_PATH = "!Templates/Music Album Analysis Template.md"

        const file = this.app.vault.getAbstractFileByPath(SONG_TEMPLATE_PATH);

        if (!file || !(file instanceof TFile)) {
            new Notice(SONG_TEMPLATE_PATH + " NOT FOUND!");
            return;
        }

        const newFileContent = (await this.app.vault.cachedRead(file))
            .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
            .replace("{title}", ans.name)
            .replace("https://open.spotify.com/album/", `https://open.spotify.com/album/${thisId}`);
            
        const newFile = await this.app.vault.create(newFilePath, newFileContent).catch((error: Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        if (newFile) {
            this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }


    async processSpotifyArtistLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, thisId: string) {

        /////////////////////////////

        ansContainerEl.empty();

        const ans: Artist = await sdk.artists.get(thisId);
        console.log(ans);

        const newAns: NewSpotifyArtistData = {
            name: ans.name
        };
        console.log(newAns);

        /////////////////////////////

        ansContainerEl.createEl('h4', { text: "Spotify Artist" });
        
        const inputDiv = ansContainerEl.createDiv({ cls: 'input-div' });
        inputDiv.createEl('h6', { text: "Filename" });
        const fileNameInput = inputDiv.createEl('input', {
            type: 'text', cls: 'text-input-class' + (this.isFilenameAvaliable(ans.name, this.ARTIST_FOLDER) ? '' : ' error'),
            value: ans.name, placeholder: "File Name"
        });
        fileNameInput.addEventListener('input', evt => {
            if (this.isFilenameAvaliable(fileNameInput.value.trim(), this.ARTIST_FOLDER)) {
                fileNameInput.classList.remove('error');
            } else {
                fileNameInput.classList.add('error');
            }
        });

        /////////////////////////////
        
        Object.entries({
            "```DETAILS": "",
            "Name: ": newAns.name,
            "```": ""
        }).map(([k, v]) =>
            ansContainerEl.createDiv({
                cls: 'show-details-div'
            }).createSpan({
                text: k + v
            })
        );

        /////////////////////////////

        // Commit Button
        ansContainerEl.createDiv(
            { cls: 'confirm-note-creation-div' }
        ).createEl('button', 
            { text: 'Sure Af Dude', cls: 'mod-warning' }
        ).addEventListener('click', async () => {
            if (!this.isFilenameAvaliable(fileNameInput.value, this.ARTIST_FOLDER)) {
                new Notice("ERROR: File Already Exists!")
                return;
            }
            await this.commitSpotifyArtistLink(fileNameInput.value, newAns, thisId);
            this.close();
        });

    }

    async commitSpotifyArtistLink(filename: string, ans: NewSpotifyArtistData, thisId: string) {
        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = this.ARTIST_FOLDER + filename.trim().replace(forbiddenCharsRegex, "_") + ".md";

        const SONG_TEMPLATE_PATH = "!Templates/Music Artist Analysis Template.md"

        const file = this.app.vault.getAbstractFileByPath(SONG_TEMPLATE_PATH);

        if (!file || !(file instanceof TFile)) {
            new Notice(SONG_TEMPLATE_PATH + " NOT FOUND!");
            return;
        }

        const newFileContent = (await this.app.vault.cachedRead(file))
            .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
            .replace("{name}", ans.name)
            .replace("https://open.spotify.com/artist/", `https://open.spotify.com/artist/${thisId}`);
            
        const newFile = await this.app.vault.create(newFilePath, newFileContent).catch((error: Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        if (newFile) {
            this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }

}