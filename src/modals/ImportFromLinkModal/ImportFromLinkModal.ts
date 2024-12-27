import { App, Modal, Notice, setIcon, TFile } from 'obsidian';
import { LinkProcessorSettings, SecretSettings } from "../../types";
import { SpotifyTrackLinkProcessor } from './LinkProcessorSubclasses/SpotifyTrackLinkProcessor';
import { SpotifyArtistLinkProcessor } from './LinkProcessorSubclasses/SpotifyArtistLinkProcessor';
import { SpotifyAlbumLinkProcessor } from './LinkProcessorSubclasses/SpotifyAlbumLinkProcessor';


export class ImportFromLinkModal extends Modal {

    static SETTINGS: { [key: string]: LinkProcessorSettings } = {
        TRACK: {
            destinationFolder: "Analysis/Musica/Canzoni/",
            templateFilePath: "!Templates/Music Song Analysis Template.md"
        },
        ARTIST: {
            destinationFolder: "Analysis/Musica/Artisti/",
            templateFilePath: "!Templates/Music Artist Analysis Template.md"
        },
        ALBUM: {
            destinationFolder: "Analysis/Musica/Album/",
            templateFilePath: "!Templates/Music Album Analysis Template.md"
        },
    };

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
                    new SpotifyTrackLinkProcessor(
                        this,
                        ImportFromLinkModal.SETTINGS.TRACK,
                        link,
                        ansContainerEl,
                        thisId,
                        this.secretSettings
                    ).processLink();
                    return;
                case "album":
                    new SpotifyAlbumLinkProcessor(
                        this,
                        ImportFromLinkModal.SETTINGS.TRACK,
                        link,
                        ansContainerEl,
                        thisId,
                        this.secretSettings
                    ).processLink();
                    return;
                case "artist":
                    new SpotifyArtistLinkProcessor(
                        this,
                        ImportFromLinkModal.SETTINGS.TRACK,
                        link,
                        ansContainerEl,
                        thisId,
                        this.secretSettings
                    ).processLink();
                    return;
                default:
                    new Notice("Invalid Spotify URL");
                    return;
            }
        }
        
        new Notice("Invalid URL");
        
    }

}