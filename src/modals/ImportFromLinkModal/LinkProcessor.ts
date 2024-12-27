import { Modal, Notice } from "obsidian";

class LinkProcessor {

    thisModal: Modal;

    constructor(thisModal:Modal, settings, link, thisId) {
        thisModal = this.thisModal;

    }

    async processSpotifyAlbumLink(ansContainerEl: HTMLDivElement, thisId: string) {
        
        ansContainerEl.empty();

        ///////////////////////////// SPECIFIC
        // const ans = getData(thisId:string);

        const {clientId, secretId} = this.secretSettings.spotify;

        if (!clientId || !secretId) {
            new Notice("Secret Spotify Credentials NOT FOUND!");
            return;
        }

        const sdk: SpotifyApi = SpotifyApi.withClientCredentials(clientId, secretId);

        const ans: Album = await sdk.albums.get(thisId);
        console.log(ans);

        const newAns: NewSpotifyAlbumData = {
            name: ans.name
        };
        console.log(newAns);

        ///////////////////////////// SHARED(title:string, folder:string)

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

        ///////////////////////////// SHARED(toprint:string[])
        
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

        ///////////////////////////// SHARED(ctx, folder:string)

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

        ///////////////////////////// SHARED(ctx, folder:string, teplate_path:string)

        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = this.ALBUM_FOLDER + filename.trim().replace(forbiddenCharsRegex, "_") + ".md";

        const SONG_TEMPLATE_PATH = "!Templates/Music Album Analysis Template.md"

        const file = this.app.vault.getAbstractFileByPath(SONG_TEMPLATE_PATH);

        if (!file || !(file instanceof TFile)) {
            new Notice(SONG_TEMPLATE_PATH + " NOT FOUND!");
            return;
        }

        ///////////////////////////// SPECIFIC
        // const templateContent = await this.app.vault.cachedRead(file);
        // const newFileContent = processTemplate(ctx, templateContent:string, ans:dict, thisId?:string);

        const newFileContent = (await this.app.vault.cachedRead(file))
            .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
            .replace("{title}", ans.name)
            .replace("https://open.spotify.com/album/", `https://open.spotify.com/album/${thisId}`);

            
        ///////////////////////////// SHARED(ctx)
            
        const newFile = await this.app.vault.create(newFilePath, newFileContent).catch((error: Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        if (newFile) {
            this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }


}