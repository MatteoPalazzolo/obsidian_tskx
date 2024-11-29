import { App, Modal, Notice } from 'obsidian';
import { gitPush } from "../utils/GitPush";

export class GitPushModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
        contentEl.addClass("GitPushModal");
        contentEl.createEl('h3', { text: "Git Push" });

        // Text
        contentEl.createEl('p', { text: "Do you wanna commit the work done so far?" });

        // Optional Commit Message Input
        const input = contentEl.createEl('input', { 
            type: 'text', cls: 'text-input-class', placeholder: "optional commit message" 
        });

        // Buttons container
        const buttonsDiv = contentEl.createDiv({ cls: 'button-container' });

        // Accept Button
        const acceptButton = buttonsDiv.createEl('button', { text: 'Sure Af Dude', cls: 'mod-warning' });
        acceptButton.addEventListener('click', async () => {
            const message: string = input.value && input.value.trim() !== "" ? input.value : ""; 
            const success = await gitPush(message); 
            if (success) {
                console.info("git push completed");
            } else {
                console.info("an error occurred during git push");
            }
            this.close();
        });

        // Deny Button
        const denyButton = buttonsDiv.createEl('button', { text: 'Nevermind', cls: 'mod-cancel' });
        denyButton.addEventListener('click', () => {
            this.close();
        });
    }
    
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}