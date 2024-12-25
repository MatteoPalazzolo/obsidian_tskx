import { App, Modal, Notice, setIcon, TFile } from 'obsidian';
import { NewSpotifyTrackData, SecretSettings } from "../types";
import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
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

        const { contentEl } = this;
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

    private isFilenameAvaliable(filename: string): boolean {
        return this.app.vault.getFiles().filter(file => file.basename === filename).length === 0;
    }

    async processSpotifyLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, link: string) {

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

        ansContainerEl.createEl('h4', { text: "Spotify Track" });
        
        const inputDiv = ansContainerEl.createDiv({ cls: 'input-div' });
        inputDiv.createEl('h6', { text: "Filename" });
        const fileNameInput = inputDiv.createEl('input', {
            type: 'text', cls: 'text-input-class' + (this.isFilenameAvaliable(ans.name) ? '' : ' error'),
            value: ans.name, placeholder: "File Name"
        });
        fileNameInput.addEventListener('input', evt => {
            if (this.isFilenameAvaliable(fileNameInput.value.trim())) {
                fileNameInput.classList.remove('error');
            } else {
                fileNameInput.classList.add('error');
            }
        });
        
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

        // Commit Button
        ansContainerEl.createDiv(
            { cls: 'confirm-note-creation-div' }
        ).createEl('button', 
            { text: 'Sure Af Dude', cls: 'mod-warning' }
        ).addEventListener('click', async () => {
            if (!this.isFilenameAvaliable(fileNameInput.value)) {
                new Notice("ERROR: File Already Exists!")
                return;
            }
            await this.commitSpotifyTrackLink(fileNameInput.value, newAns, thisId);
            this.close();
        });

    }

    // take edited data and use it to create a new note
    async commitSpotifyTrackLink(filename: string, ans: NewSpotifyTrackData, thisId: string) {
        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = "Analysis/Music/Canzoni/" + filename.trim().replace(forbiddenCharsRegex, "_") + ".md";

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
            .replace("https://open.spotify.com/track/", `https://open.spotify.com/embed/track/${thisId}?theme=1`);

        const newFile = await this.app.vault.create(newFilePath, newFileContent).catch((error: Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        if (newFile) {
            this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }


    async processSpotifyAlbumLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, thisId: string): Promise<undefined | TFile> {
        const ans = await sdk.albums.get(thisId);
        console.log(ans);
        ans.name;
        return;

    }


    async processSpotifyArtistLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, thisId: string): Promise<undefined | TFile> {
        const ans = await sdk.artists.get(thisId);
        console.log(ans);
        ans.name;
        return;

    }

}