import { Notice } from "obsidian";

export function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        new Notice('Testo copiato nella clipboard!');
        console.info('Testo copiato nella clipboard!');
    }).catch(err => {
        new Notice('Errore nel copiare il testo:', err);
        console.info('Errore nel copiare il testo:', err);
    });
}