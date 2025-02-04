import { Notice } from "obsidian";

export function copyToClipboard(imgSrc: string) {
    navigator.clipboard.writeText(imgSrc).then(() => {
        new Notice('Link copiato nella clipboard!');
        console.info('Link copiato nella clipboard!');
    }).catch(err => {
        new Notice('Errore nel copiare il testo:', err);
        console.info('Errore nel copiare il testo:', err);
    });
}