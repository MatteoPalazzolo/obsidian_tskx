/**
 * Utility di escaping per i valori delle proprietà frontmatter.
 *
 * Ruolo nell'architettura:
 * - Questa utility viveva nel vecchio modulo dei template, quando l'import
 *   Spotify era l'unico consumatore della funzione. Con la separazione delle
 *   feature template in un plugin dedicato, è stata estratta qui perché serve ancora ai
 *   `LinkProcessor` Spotify per scrivere valori YAML validi nei nuovi file.
 * - Non contiene logica di template: è una normale funzione di formattazione.
 */

/**
 * Conforma una stringa con la convenzione delle proprietà di Obsidian per
 * evitare errori di parsing YAML.
 *
 * La funzione gestisce i casi in cui il valore contiene `:`, oppure inizia già
 * con un carattere di quoting (`'`, `"`, `` ` ``), scegliendo il delimitatore
 * che non entra in conflitto con il contenuto.
 *
 * @param s - Stringa di cui fare l'escape.
 * @returns Stringa pronta per essere inserita in un frontmatter YAML.
 */
export function escapeFilePropertyStrings(s: string): string {
	if (s.includes(":")) {
		if (!s.includes('"')) {
			return `"${s}"`;
		}
		else if (!s.includes("'")) {
			return `'${s}'`;
		}
		else {
			return `"${s.replace(/"/g, '\\\"')}"`;
		}
	}
	if (s.startsWith("'")) {
		if (!s.includes('"')) {
			return `"${s}"`;
		}
		else {
			return `"${s.replace(/"/g, '\\\"')}"`;
		}
	}
	else if (s.startsWith('"')) {
		if (!s.includes("'")) {
			return `'${s}'`;
		}
		else {
			return `"${s.replace(/"/g, '\\\"')}"`;
		}
	}
	else if (s.startsWith("`")) {
		if (!s.includes('"')) {
			return `"${s}"`;
		}
		else if (!s.includes("'")) {
			return `'${s}'`;
		}
		else {
			return `"${s.replace(/"/g, '\\\"')}"`;
		}
	}
	else {
		return s;
	}
}
