import { App, Modal, Notice } from 'obsidian';
import { gitPush } from "../utils/GitPush";

export class GitPushModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
        
        contentEl.createEl('h3', { text: "Git Push" });

        // Message
        contentEl.createEl('p', { text: "Do you wanna commit the work done so far?" });

        // Buttons container
        const buttonsDiv = contentEl.createDiv({ cls: 'git-modal-button-container' });

        // Accept Button
        const acceptButton = buttonsDiv.createEl('button', { text: 'Sure Af Dude', cls: 'commit' });
        acceptButton.addEventListener('click', async () => {
            const success = await gitPush(); 
            if (success) {
                console.log("git push completed");
            } else {
                console.log("an error occurred during git push");
            }
            this.close();
        });

        // Deny Button
        const denyButton = buttonsDiv.createEl('button', { text: 'Nevermind', cls: 'close' });
        denyButton.addEventListener('click', () => {
            this.close();
        });
    }
    
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}