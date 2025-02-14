import { App, Modal, Notice, setIcon } from 'obsidian';
import { LinkProcessorSettings, SecretSettings } from "../../types";
import { SpotifyTrackLinkProcessor } from './LinkProcessorSubclasses/SpotifyTrackLinkProcessor';
import { SpotifyArtistLinkProcessor } from './LinkProcessorSubclasses/SpotifyArtistLinkProcessor';
import { SpotifyAlbumLinkProcessor } from './LinkProcessorSubclasses/SpotifyAlbumLinkProcessor';


const SETTINGS: { [key in "TRACK" | "ARTIST" | "ALBUM"]: LinkProcessorSettings } = {
    TRACK: {
        destinationFolder:  "!MediaAnalysis/!Music/!Songs/",
        templateFilePath:   "!MediaAnalysis/!Music/!Songs/!Template.md"
    },
    ARTIST: {
        destinationFolder:  "!MediaAnalysis/!Music/!Artists/",
        templateFilePath:   "!MediaAnalysis/!Music/!Artists/!Template.md"
    },
    ALBUM: {
        destinationFolder:  "!MediaAnalysis/!Music/!Albums/",
        templateFilePath:   "!MediaAnalysis/!Music/!Albums/!Template.md"
    },
};

export class ImportFromLinkModal extends Modal {

    secretSettings: SecretSettings;

    constructor(app: App, secretSettings: SecretSettings) {
        super(app);
        this.secretSettings = secretSettings;
    }

    async onOpen() {

        // Title
        const { contentEl } = this;
        contentEl.addClass("ImportFromLinkModal");
        contentEl.createEl('h3', { text: "Import from link" });

        // Search Input
        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'enter link'
        });

        // Search Button
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
            this.processLink(ansContainerEl, pastedText);

        });

        inputEl.addEventListener('keydown', evt => {
            if (evt.key === "Enter") {
                this.processLink(ansContainerEl,inputEl.value);

            }
        });

        searchButtonEl.addEventListener('click', evt => {
            this.processLink(ansContainerEl,inputEl.value);
        });

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private processLink(ansContainerEl: HTMLDivElement, link: string) {

        const match = link.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
        if (match) {
            const [, thisType, thisId] = match;
            switch (thisType) {
                case "track":
                    new SpotifyTrackLinkProcessor( this, SETTINGS.TRACK, link,
                        ansContainerEl, thisId, this.secretSettings ).processLink();
                    return;
                case "album":
                    new SpotifyAlbumLinkProcessor( this, SETTINGS.ALBUM, link, 
                        ansContainerEl, thisId, this.secretSettings ).processLink();
                    return;
                case "artist":
                    new SpotifyArtistLinkProcessor( this, SETTINGS.ARTIST, link, 
                        ansContainerEl, thisId, this.secretSettings ).processLink();
                    return;
                default:
                    new Notice("Invalid Spotify URL");
                    return;
            }
        }
        
        new Notice("Invalid URL");
        
    }

}