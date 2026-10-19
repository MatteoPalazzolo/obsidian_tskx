/**
 * Helper di formattazione date per gli import automatici.
 *
 * Ruolo nell'architettura:
 * - I processor Spotify scrivono la data di import nel frontmatter dei nuovi
 *   documenti. L'unica operazione necessaria è la data odierna in formato
 *   `YYYY-MM-DD`, quindi non serve una libreria esterna: `dayjs` è stato
 *   rimosso per ridurre le dipendenze runtime del plugin.
 * - La data è calcolata nel fuso orario locale, come faceva `dayjs()`.
 */

/**
 * Restituisce la data corrente nel formato `YYYY-MM-DD`, compatibile con il
 * frontmatter YAML di Obsidian.
 */
export function formatCurrentDate(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
