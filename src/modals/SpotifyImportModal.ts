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
        ansContainerEl.createSpan({ text: "test" });

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

    async processSpotifyLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, link: string) {

        /* use regex to find type and id */
        const match = link.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
        if (!match) {
            new Notice("Invalid URL (1)");
            return;
        }
        const [, thisType, thisId] = match;

        /* use id to fetch info from api */
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

    // put info in a form to allow user to edit them
    async processSpotifyTrackLink(ansContainerEl: HTMLDivElement, sdk: SpotifyApi, thisId: string) {
        ansContainerEl.empty();

        const ans: Track = await sdk.tracks.get(thisId);
        console.log(ans);

        const newAns: NewSpotifyTrackData = {
            filename: "",
            name: ans.name,
            track_number: ans.track_number,
            artists: ans.artists.map(a => a.name),
            album: ans.album.name
        };
        console.log(newAns);

        ansContainerEl.createEl('h1', { text: "Spotify Track" });
        
        const fileNameInput = ansContainerEl.createEl('input', {
            type: 'text', cls: 'text-input-class', value: ans.name, placeholder: "File Name"
        });

        ansContainerEl.createEl('h5', { text: "Details" });
        // TODO: improve everything!
        const trackDataSpans = Object.entries(newAns).filter(([k, v]) => k !== "filename").map(([k, v]) =>
            ansContainerEl.createEl('p', {
                text: k + ": " + v
            })
        );

        // Commit Button
        ansContainerEl.createEl(
            'button', 
            { text: 'Sure Af Dude', cls: 'mod-warning' }
        ).addEventListener('click', async () => {
            // TODO: check che il nome del file non sia già presente
            newAns.filename = fileNameInput.value;
            await this.commitSpotifyTrackLink(newAns, thisId);
            this.close();
        });

    }

    // take edited data and use it to create a new note
    async commitSpotifyTrackLink(ans: NewSpotifyTrackData, thisId: string) {
        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = "Analysis/Music/Canzoni/" + ans.filename.replace(forbiddenCharsRegex, "_") + ".md";

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