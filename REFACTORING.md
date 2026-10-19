# REFACTORING.md

> Documento di refactoring e valutazione statica della repository.
> Stato di partenza: plugin post-cleanup con gallery, crawler immagini, import Spotify e embed media.
> Le righe citate (`file:linea`) si riferiscono allo stato attuale del codice.

---

## 1. Obiettivi

1. Rendere il comportamento attuale corretto e prevedibile, eliminando race condition e casi limite.
2. Centralizzare le magic strings in un unico file (`src/consts.ts`), con ruoli documentati.
3. Separare ciò che è **costante tecnica** da ciò che è **configurazione del vault** e da ciò che è **segreto**.
4. Preparare il codice a un'eventuale estrazione di feature pubblicabili nella community.
5. Aggiungere una base minima di test e una checklist di verifica manuale.

Non obiettivi:

- reintrodurre template o scanner;
- trasformare il plugin personale in un prodotto generico senza una decisione esplicita;
- astrarre ogni singola riga: il refactoring deve ridurre il rischio, non aumentare l'indirection.

---

## 2. Nome del plugin

`obsidian-tools` non è un buon nome per una pubblicazione:

- è generico e non comunica il dominio (media, gallery, import);
- sembra un bundle di utility;
- il prefisso "Obsidian" nel nome visualizzato è sconsigliato per i plugin community e può sembrare ufficiale;
- l'`id` `obsidian-tools` è ampio e facilmente in conflitto.

Criteri proposti:

- 2-3 parole, descrittivo, univoco;
- niente "Obsidian" nel `name` del manifest;
- `id` lowercase con trattini, stabile nel tempo;
- verificare la disponibilità nel catalogo community prima di scegliere.

Proposte:

| Nome | Note |
|---|---|
| **Media Curator** | Copre gallery, import e curation; la proposta principale. |
| **Media Shelf** | Corto, memorabile, metafora di archivio/collezione. |
| **Artwork Picker** | Adatto se si estrae solo gallery + crawler immagini. |
| **Spotify Notes** | Adatto se si estrae solo l'importer Spotify. |
| **PicKaXe / TsKx** | Brand personale, ottimo per il plugin privato, poco descrittivo per la community. |

Da aggiornare in caso di rinomina:

- `manifest.json` (`id`, `name`, `authorUrl`, `fundingUrl`);
- `package.json` (`name`, `description`, `author`);
- README, screenshot e testi UI;
- `versions.json` se cambia `minAppVersion`.

---

## 3. Feature estraibili come plugin pubblicabili

| Feature | Pubblicabilità | Note |
|---|---|---|
| **Import Spotify → nota da template** | Alta | Parte più autocontenuta. Richiede settings per cartelle/template per tipo, gestione credenziali (meglio PKCE del client secret), validazione placeholder, test. |
| **Gallery + artwork picker** | Medio-alta | Code block `gallery` + ricerca multi-fonte (Steam/itch/TMDb). Richiede mapping cartella→scraper configurabile, API ufficiali dove possibile, cache, loading/error state, supporto mobile. |
| **Embed iframe** | Bassa | Spazio affollato (Media Extended, Rich Links, ecc.). Meglio tenerlo nel plugin privato. |
| **Crawler come libreria** | Bassa | Non è un plugin: al massimo un pacchetto npm interno. Gli scraper HTML sono fragili. |
| **GitPush / scanner / template** | No | GitPush è coperto da plugin Git; scanner e template sono già stati separati. |

Raccomandazione: se si vuole pubblicare, estrarre al massimo due plugin:

1. **Media Curator / Artwork Picker** — gallery + crawler con settings generici.
2. **Spotify Notes** — import da link con template e cartelle configurabili.

Il plugin privato resta l'integrazione specifica della forma del vault.

### Note su ToS e manutenzione

- Steam e TMDb hanno API ufficiali (TMDb richiede una key); itch.io non ha una API pubblica di ricerca, quindi lo scraping è la parte più fragile.
- Un plugin pubblico che scrape-à siti terzi richiede rate limiting, cache, gestione errori e una dichiarazione chiara nel README.
- Il client secret Spotify in un plugin client-side non è realmente segreto: per una pubblicazione usare PKCE o far configurare all'utente le proprie credenziali.

---

## 4. Valutazione statica

### 4.1 Giudizio sintetico

- **Uso personale:** buono (7/10). Codice piccolo, leggibile, responsabilità separate, una sola dipendenza runtime.
- **Pubblicazione community:** acerbo (4/10). Mancano settings, gestione errori, test, metadata, compatibilità CSS e alcuni fix di correttezza.

### 4.2 Punti di forza

- `main.ts` è un entry point chiaro; le feature sono in cartelle dedicate.
- Nessuna dipendenza circolare.
- `LinkProcessor` è una buona astrazione per aggiungere nuovi importer.
- Gli scraper come `AsyncGenerator` sono componibili e permettono streaming dei risultati.
- Commenti estesi e orientati all'architettura.
- Typecheck già verificato nella sessione precedente.

### 4.3 Problemi ad alta priorità (P0)

| ID | Posizione | Problema | Impatto | Correzione proposta |
|---|---|---|---|---|
| P0-01 | `src/widgets/IframePostProcessor.ts:9` | Usa `element.textContent` invece di `p.textContent` dentro `forEach` sui `<p>`. | Se una nota ha più paragrafi e uno contiene un link, tutti i paragrafi vengono sostituiti con lo stesso iframe. | Usare `p.textContent?.trim() ?? ""`. |
| P0-02 | `src/widgets/IframePostProcessor.ts:8` | `forEach(async …)` non viene atteso. | Il post processor termina prima delle sostituzioni asincrone (soprattutto itch.io); possibili race e iframe mancanti. | `for…of` con `await` oppure `Promise.all` con gestione errori. |
| P0-03 | `src/modals/ImageSearchModal/ImageSearchModal.ts:185` | `searchAndLoadImages` può girare in concorrenza (Enter, click, apertura modale). | I loop svuotano e riempiono lo stesso container; checkbox ID duplicati, risultati misti. | Token di generazione, flag `closed`, disable del pulsante durante la ricerca, ignore dei risultati stale. |
| P0-04 | `src/modals/ImageSearchModal/ImageSearchModal.ts:259` | `splice(i, 1)` con `i = -1` rimuove l'ultimo elemento. | Deselezione errata di un'immagine diversa. | `if (i >= 0) this.selectedImages.splice(i, 1);` |
| P0-05 | `src/modals/ImageSearchModal/ImageSearchModal.ts:178` | `vault.read` + `vault.modify` non atomico. | Possibile sovrascrittura di modifiche concorrenti; se la gallery non esiste più, nessun avviso. | `vault.process(file, data => …)`, verifica della sostituzione e Notice in caso di mancata corrispondenza. |
| P0-06 | `src/utils/escapeFilePropertyStrings.ts:23` | Escaping YAML incompleto: non gestisce newline, backslash, spazi, scalari riservati (`null`, `true`, `yes`, numeri). | Frontmatter potenzialmente invalido o con tipi errati. | Quotare sempre con `JSON.stringify(s)` (JSON è sottoinsieme di YAML 1.2) o usare un serializer YAML. |
| P0-07 | `manifest.json:5` | `minAppVersion: "0.15.0"` troppo basso rispetto a nesting CSS e `:has()` (`styles.css:3`). | CSS ignorato o layout rotto su versioni Obsidian più vecchie. | Alzare `minAppVersion` a una versione con Chromium ≥ 112 (Obsidian 1.4+) e aggiornare `versions.json`, oppure appiattire il CSS. |
| P0-08 | `src/widgets/GalleryCodeBlock.ts:33` + `src/modals/ImageSearchModal/ImageSearchModal.ts:178` | Il raw della gallery viene ricostruito con `\n` e sostituito per stringa esatta. | Con CRLF o fence diverse la sostituzione non avviene e la modifica viene persa silenziosamente. | Passare il testo esatto trovato nel file o usare una regex che cattura il fence; verificare la sostituzione. |
| P0-09 | `src/widgets/GalleryCodeBlock.ts:29` | URL inserito in `backgroundImage` senza escaping. | Un URL con `"` o `)` rompe il CSS o consente injection nel foglio di stile inline. | `JSON.stringify(url)` o creare un elemento `<img>`; validare lo schema `http/https`. |

### 4.4 Problemi a media priorità (P1)

| ID | Posizione | Problema | Correzione proposta |
|---|---|---|---|
| P1-01 | `src/modals/ImageSearchModal/imageScrapers.ts:17` | Log dell'intero HTML in console (`console.groupCollapsed`/`console.log`). | Rimuovere o mettere dietro un flag di debug. |
| P1-02 | `src/modals/ImageSearchModal/imageScrapers.ts` | Regex HTML fragili; nessun timeout/retry/rate limit. | API ufficiali dove possibile, fixture di test, cache, delay tra richieste. |
| P1-03 | `src/modals/ImportFromLinkModal/LinkProcessorSubclasses/LinkProcessor.ts:28` | `vault.getFiles().filter(...)` a ogni input: O(n) sul vault. | `vault.getAbstractFileByPath(destinationFolder + filename + ".md")`, O(1). |
| P1-04 | `src/modals/ImportFromLinkModal/LinkProcessorSubclasses/LinkProcessor.ts:95` | Validazione filename incompleta: nome vuoto, nomi riservati Windows, lunghezza. | Validare `trim()`, rifiutare vuoto, gestire `CON`, `PRN`, `AUX`, `NUL`, `COM1`… e limite lunghezza. |
| P1-05 | `src/main.ts:49` | Notice "FOUND/NOT FOUND" a ogni avvio; secret in chiaro. | Settings tab, notice solo su errore, PKCE o credenziali utente per una pubblicazione. |
| P1-06 | `src/modals/ImportFromLinkModal/ImportFromLinkModal.ts:90` | Import concorrenti sullo stesso `ansContainerEl`. | Disable di input/pulsante durante il processing e token di richiesta. |
| P1-07 | `src/modals/ImportFromLinkModal/LinkProcessorSubclasses/Spotify*.ts` | SDK Spotify ricreato a ogni import; token non riusato. | Servizio Spotify con cache dell'istanza/token. |
| P1-08 | `src/modals/ImportFromLinkModal/LinkProcessorSubclasses/Spotify*.ts` | `processTemplate` silenzioso se i placeholder mancano. | Validare i campi richiesti e notificare il template non conforme. |
| P1-09 | `src/utils/obsidianFetch.ts:25` | `Accept: application/json` per richieste HTML; nessun timeout/retry. | `Accept: */*` di default o per chiamata; timeout e retry. |
| P1-10 | `src/utils/clipboard.ts:8` | `new Notice('Errore…', err)` passa l'errore come `duration`. | `console.error(err)` e `new Notice('Errore nel copiare il testo')`. |
| P1-11 | `src/modals/ImageSearchModal/ImageSearchModal.ts:235` | Attributo `src` su un `div` (non valido). | Rimuovere l'attributo o usare `data-src`. |
| P1-12 | `src/widgets/GalleryCodeBlock.ts:22` | Controlli con `span`/`div` e `onclick`, senza tastiera/ARIA. | Usare `button`/`setIcon`, `aria-label`, gestione `keydown`. |
| P1-13 | `styles.css:191` | Menu e frecce visibili solo su `:hover`; su touch può essere inaffidabile. | `@media (hover: none)` per mostrare sempre i controlli. |
| P1-14 | `manifest.json:6` | `description` vuota; `authorUrl` e `fundingUrl` placeholder. | Compilare i metadata reali o rimuovere i campi non validi. |
| P1-15 | `package.json:15` | `@types/node` 16 EOL, `@typescript-eslint` 5.29 vecchio, `eslint` non dichiarato, `obsidian: latest` non pinnato. | Aggiornare la toolchain e pinnare le versioni. |
| P1-16 | root | Manca un file `LICENSE` nonostante la licenza MIT dichiarata. | Aggiungere il testo MIT. |
| P1-17 | root | Nessun test automatico. | Test unitari sulle funzioni pure e fixture per gli scraper. |

### 4.5 Problemi minori (P2)

- `src/widgets/GalleryCodeBlock.ts:8`: `console.log(source)` residuo.
- `src/modals/ImageSearchModal/ImageSearchModal.ts:245` e `:262`: `console.log(this.selectedImages)` residuo.
- `src/modals/ImageSearchModal/imageScrapers.ts:52`: doppio `;;`.
- `src/conts.ts`: nome probabilmente da rinominare in `src/consts.ts`.
- `src/modals/ImageSearchModal/ImageSearchModal.ts:101`: `.contains()` funziona grazie alle estensioni Obsidian, ma `.includes()` è più portabile.
- `README.md`: molto personale e in italiano; per la community serve una versione generica con installazione, settings, screenshot e disclaimer.
- `screenshots/immage_scraper_*`: refuso nel nome file, non funzionale.

### 4.6 Test consigliati

Test unitari (Node test o Vitest) sulle funzioni pure:

- `escapeFilePropertyStrings`: titoli con `:`, virgolette, newline, `null`, `true`, caratteri YAML speciali.
- `formatCurrentDate`: formato `YYYY-MM-DD` e zero-padding.
- `galleryRawToContent` (da estrarre dalla modale): gallery vuota, una immagine, più immagini, `![header](...)`, CRLF, fence con spazi.
- parsing URL Spotify: track/album/artist, URL con query string, URL invalidi.
- regex scraper con fixture HTML statiche (Steam, itch.io, TMDb).
- `LinkProcessor`: sanitizzazione filename e controllo esistenza.

Test manuali:

- gallery con 0, 1, N immagini;
- apertura modale da ribbon e da pulsante gallery;
- due ricerche consecutive e click multipli;
- import track/album/artist, template mancante, file già esistente;
- embed Spotify/YouTube/Steam/itch.io, incluso paragrafo multiplo;
- nota con CRLF;
- mobile/touch per menu gallery;
- tema chiaro/scuro.

---

## 5. Estrazione delle magic strings in `src/consts.ts`

### 5.1 Obiettivo

Un unico file per le costanti condivise, con nomi parlanti e un commento che spieghi il ruolo di ogni gruppo. Il file deve contenere solo valori puri: niente import da `obsidian`, niente side effect, niente segreti.

Rinominare `src/conts.ts` in `src/consts.ts` (correzione del refuso) e aggiornare `main.ts:7`.

### 5.2 Cosa mettere in `consts.ts`

- URL e template di URL;
- regex di parsing;
- nomi di code block, fence, campi template, classi CSS del plugin;
- messaggi UI statici;
- icone e label delle ribbon;
- default tecnici (limiti, timeout, accept header);
- percorsi del vault come **default**, in attesa di una settings tab.

### 5.3 Cosa NON mettere in `consts.ts`

- **Segreti** (`clientId`, `secretId`): restano in `secret-settings.json` o nella settings tab.
- **Stato runtime**: selezione corrente, query, risultati degli scraper.
- **Configurazione utente**: se in futuro si aggiunge una settings tab, i path e il mapping cartella→scraper diventano `settings.ts` con default presi da `consts.ts`.
- **Tipi**: restano in `src/types.ts` (o in file `types.ts` dedicati).
- **Costanti usate in un solo punto e prive di significato semantico**: non vale la pena centralizzarle.

### 5.4 Struttura proposta

```ts
// src/consts.ts
// Costanti condivise del plugin: URL, regex, path di default, messaggi e classi CSS.
// Non importare Obsidian qui: questo file deve restare puro e testabile.

export const SECRET_SETTINGS_FILENAME = "secret-settings.json";

export const VAULT = {
    MUSIC: {
        SONGS: {
            FOLDER: "!MediaAnalysis/!Music/!Songs/",
            TEMPLATE: "!MediaAnalysis/!Music/!Songs/!Template.md",
        },
        ARTISTS: {
            FOLDER: "!MediaAnalysis/!Music/!Artists/",
            TEMPLATE: "!MediaAnalysis/!Music/!Artists/!Template.md",
        },
        ALBUMS: {
            FOLDER: "!MediaAnalysis/!Music/!Albums/",
            TEMPLATE: "!MediaAnalysis/!Music/!Albums/!Template.md",
        },
    },
    VIDEOGAMES: {
        FOLDER: "!MediaAnalysis/!Videogames/!Videogames",
    },
    MOVIES: {
        FOLDER: "!MediaAnalysis/!Movies&Shows/!Movies",
    },
    SHOWS: {
        FOLDER: "!MediaAnalysis/!Movies&Shows/!Shows",
    },
} as const;

export const RIBBON = {
    IMPORT: { ICON: "link", LABEL: "Import From Link" },
    IMAGE_SEARCH: { ICON: "image-plus", LABEL: "Image Search" },
} as const;

export const GALLERY = {
    CODE_BLOCK: "gallery",
    FENCE: "```",
    HEADER_ICON: "header",
    ARROW_LEFT_ICON: "chevron-left",
    ARROW_RIGHT_ICON: "chevron-right",
    EDIT_ICON: "pencil",
} as const;

export const SCRAPERS = {
    NAMES: ["steam", "itchio", "tmdb"] as const,
    DEFAULT_LIMIT: 5,
    LINE_SENTINEL: "line",
    BY_FOLDER: {
        [VAULT.VIDEOGAMES.FOLDER]: ["steam", "itchio"],
        [VAULT.MOVIES.FOLDER]: ["tmdb"],
        [VAULT.SHOWS.FOLDER]: ["tmdb"],
    },
} as const;

export const STEAM = {
    SEARCH_URL: "https://store.steampowered.com/search?",
    APP_URL: "https://store.steampowered.com/app/",
    APP_ID_REGEX: /https:\/\/store\.steampowered\.com\/app\/(\d+)/g,
    IMAGE_REGEX: /href="[^"]*(https:\/\/shared.(?:cloudflare|fastly).steamstatic.com\/store_item_assets\/steam\/apps\/[^"]*.jpg)[^"]*"/g,
} as const;

export const ITCH = {
    SEARCH_URL: "https://itch.io/search?",
    GAME_LINK_REGEX: /<a[^>]*?class="title game_link"[^>]*?href="(https:\/\/[a-zA-Z0-9-]+\.itch\.io\/[^"]+)|<a[^>]*?href="(https:\/\/[a-zA-Z0-9-]+\.itch\.io\/[^"]+)[^>]*?class="title game_link"/g,
    IMAGE_REGEX: /<a[^>]*?href="(https:\/\/img\.itch\.zone\/[^"]*)"[^>]*?target="_blank"|<a[^>]*?target="_blank"[^>]*?href="(https:\/\/img\.itch\.zone\/[^"]*)"/g,
    EMBED_URL: "https://itch.io/embed/",
    EMBED_API: (dev: string, game: string) => `https://${dev}.itch.io/${game}/embed`,
    EMBED_ID_REGEX: /embed\\\/(\d+?)&quot/,
} as const;

export const TMDB = {
    BASE_URL: "https://www.themoviedb.org",
    SEARCH_URL: "https://www.themoviedb.org/search?",
    POSTER_REGEX: /class="poster"[\s\S]*?href="(.+?)"/g,
    IMAGE_REGEX: /class="card compact ok"[\s\S]*?href="(.+?)"/g,
    BACKDROPS_SUFFIX: "/images/backdrops",
} as const;

export const SPOTIFY = {
    LINK_REGEX: /(?:https|http):\/\/open\.spotify\.com.*?\/(\w*)\/(\w*)(?:$|\?)/,
    TRACK_PREFIX: "https://open.spotify.com/track/",
    ALBUM_PREFIX: "https://open.spotify.com/album/",
    ARTIST_PREFIX: "https://open.spotify.com/artist/",
    EMBED_URL: (type: string, id: string) => `https://open.spotify.com/embed/${type}/${id}?theme=1`,
} as const;

export const TEMPLATE_FIELDS = {
    DATE_REGEX: /^date:[^\S\n]*$/m,
    NAME_REGEX: /^name:[^\S\n]*$/m,
    AUTHOR_EMPTY_REGEX: /^author:[^\S\n]*\[\][^\S\n]*$/m,
    ALBUM_REGEX: /^album:[^\S\n]*$/m,
    INDEX_REGEX: /^index:[^\S\n]*$/m,
} as const;

export const FILENAME = {
    FORBIDDEN_CHARS_REGEX: /[*"\/<>:|?]{1}/g,
    EXTENSION: ".md",
    RESERVED_NAMES: ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"],
    MAX_LENGTH: 200,
} as const;

export const HTTP = {
    DEFAULT_ACCEPT: "*/*",
    TIMEOUT_MS: 15_000,
    RETRY_COUNT: 2,
    USER_AGENT: "MediaCurator/1.0",
} as const;

export const MESSAGES = {
    INVALID_URL: "Invalid URL",
    INVALID_SPOTIFY_URL: "Invalid Spotify URL",
    CREDENTIALS_NOT_FOUND: "Secret Spotify Credentials NOT FOUND!",
    FILE_ALREADY_EXISTS: "ERROR: File Already Exists!",
    TEMPLATE_NOT_FOUND: "Template NOT FOUND!",
    CREATE_FAILED: "Failed to create note",
    GALLERY_NOT_FOUND: "Gallery not found in the current note",
    NO_ACTIVE_SCRAPERS: "There are no active scrapers!",
    NO_IMAGES: "No image found!",
    COPIED: "Copied to clipboard!",
    COPY_ERROR: "Failed to copy to clipboard",
} as const;

export const CSS_CLASSES = {
    GALLERY_ROOT: "GalleryCodeBlock",
    GALLERY_IMAGE: "gallery",
    GALLERY_MENU: "small-menu",
    GALLERY_MENU_BUTTON: "small-menu-btn",
    GALLERY_ARROW: "arrow",
    GALLERY_ARROW_CONTAINER: "arrow-container",
    IMAGE_SEARCH_MODAL: "ImageSearchModal",
    IMPORT_LINK_MODAL: "ImportFromLinkModal",
    IMAGES_CONTAINER: "images-container",
    IMAGE_CHECKBOX_DIV: "my-image-checkbox-div",
    EMPTY_SELECTION: "empty-selection",
    SPOTIFY_IFRAME: "spotify-iframe",
    YOUTUBE_IFRAME: "youtube-iframe",
    STEAM_IFRAME: "steam-iframe",
    ITCH_IFRAME: "itchio-iframe",
    STEAM_ITCH_CONTAINER: "steam-itchio-iframe-container",
} as const;
```

> Nota importante sulle regex globali: se una regex con flag `g` viene usata con `.exec()` o `.test()`, `lastIndex` è mutabile e condiviso. In quel caso esportare una **factory** (`createSteamImageRegex()`) oppure resettare `lastIndex` prima dell'uso. Con `String.matchAll()` la regex viene clonata ed è sicura.

### 5.5 Dettaglio delle costanti

#### A. Segreti e vault

| Costante | Valore proposto | Ruolo | Consumatori attuali |
|---|---|---|---|
| `SECRET_SETTINGS_FILENAME` | `"secret-settings.json"` | Nome del file credenziali nella cartella del plugin. | `main.ts` |
| `VAULT.MUSIC.SONGS.FOLDER` | `"!MediaAnalysis/!Music/!Songs/"` | Cartella di destinazione delle tracce. | `ImportFromLinkModal` (`SETTINGS.TRACK`). |
| `VAULT.MUSIC.SONGS.TEMPLATE` | `"!MediaAnalysis/!Music/!Songs/!Template.md"` | Template per una traccia. | `ImportFromLinkModal`, `LinkProcessor`. |
| `VAULT.MUSIC.ARTISTS.FOLDER` | `"!MediaAnalysis/!Music/!Artists/"` | Cartella di destinazione degli artisti. | `ImportFromLinkModal` (`SETTINGS.ARTIST`). |
| `VAULT.MUSIC.ARTISTS.TEMPLATE` | `"!MediaAnalysis/!Music/!Artists/!Template.md"` | Template per un artista. | `ImportFromLinkModal`, `LinkProcessor`. |
| `VAULT.MUSIC.ALBUMS.FOLDER` | `"!MediaAnalysis/!Music/!Albums/"` | Cartella di destinazione degli album. | `ImportFromLinkModal` (`SETTINGS.ALBUM`). |
| `VAULT.MUSIC.ALBUMS.TEMPLATE` | `"!MediaAnalysis/!Music/!Albums/!Template.md"` | Template per un album. | `ImportFromLinkModal`, `LinkProcessor`. |
| `VAULT.VIDEOGAMES.FOLDER` | `"!MediaAnalysis/!Videogames/!Videogames"` | Cartella usata per abilitare gli scraper Steam/itch.io. | `ImageSearchModal` (`FILEPATH_TO_SCRAPERS`). |
| `VAULT.MOVIES.FOLDER` | `"!MediaAnalysis/!Movies&Shows/!Movies"` | Cartella usata per abilitare lo scraper TMDb. | `ImageSearchModal`. |
| `VAULT.SHOWS.FOLDER` | `"!MediaAnalysis/!Movies&Shows/!Shows"` | Cartella usata per abilitare lo scraper TMDb. | `ImageSearchModal`. |
| `SCRAPERS.BY_FOLDER` | mappa cartella → scraper | Default di associazione tra posizione della nota e fonti immagini. | `ImageSearchModal`; in futuro settings. |

#### B. UI, ribbon e gallery

| Costante | Valore proposto | Ruolo | Consumatori |
|---|---|---|---|
| `RIBBON.IMPORT.ICON` | `"link"` | Icona Lucide della ribbon import. | `main.ts` |
| `RIBBON.IMPORT.LABEL` | `"Import From Link"` | Tooltip/label della ribbon import. | `main.ts` |
| `RIBBON.IMAGE_SEARCH.ICON` | `"image-plus"` | Icona Lucide della ribbon image search. | `main.ts` |
| `RIBBON.IMAGE_SEARCH.LABEL` | `"Image Search"` | Tooltip/label della ribbon image search. | `main.ts` |
| `GALLERY.CODE_BLOCK` | `"gallery"` | Nome del code block Markdown registrato. | `GalleryCodeBlock`, `ImageSearchModal` |
| `GALLERY.FENCE` | fence Markdown di apertura/chiusura | Delimitatore del fence ricostruito. | `GalleryCodeBlock`, `ImageSearchModal` |
| `GALLERY.HEADER_ICON` | `"header"` | Nome dell'icona usata nell'immagine di intestazione `![header](...)`. | `ImageSearchModal` |
| `GALLERY.ARROW_LEFT_ICON` | `"chevron-left"` | Icona freccia sinistra. | `GalleryCodeBlock` |
| `GALLERY.ARROW_RIGHT_ICON` | `"chevron-right"` | Icona freccia destra. | `GalleryCodeBlock` |
| `GALLERY.EDIT_ICON` | `"pencil"` | Icona del pulsante modifica gallery. | `GalleryCodeBlock` |
| `GALLERY.HEADER_IMAGE_REGEX` | `/!\[header\]\(([^)]*)\)/` | Riconosce l'immagine di intestazione. | `ImageSearchModal.galleryRawToContent` |
| `GALLERY.BLOCK_REGEX` | regex del blocco gallery | Riconosce un code block gallery e ne estrae il contenuto. | `ImageSearchModal` |
| `GALLERY.EMPTY_BLOCK_REGEX` | regex del blocco gallery vuoto | Riconosce un code block gallery senza immagini. | `ImageSearchModal` |
| `GALLERY.CLASSES.*` | vedi `CSS_CLASSES` | Classi CSS del widget gallery. | `GalleryCodeBlock`, `styles.css` |

#### C. Scraper

| Costante | Valore proposto | Ruolo | Consumatori |
|---|---|---|---|
| `SCRAPERS.NAMES` | `["steam", "itchio", "tmdb"]` | Elenco canonico degli scraper; genera le checkbox e il tipo `ScraperName`. | `ImageSearchModal` |
| `SCRAPERS.DEFAULT_LIMIT` | `5` | Numero massimo di risultati per ricerca. | `steam.ts`, `imageScrapers.ts` |
| `SCRAPERS.LINE_SENTINEL` | `"line"` | Sentinella emessa dai generator per separare i gruppi visivi. | `imageScrapers.ts`, `ImageSearchModal` |
| `STEAM.SEARCH_URL` | `"https://store.steampowered.com/search?"` | Endpoint di ricerca Steam. | `steam.ts` |
| `STEAM.APP_URL` | `"https://store.steampowered.com/app/"` | Base per costruire la pagina di un'app. | `imageScrapers.ts` |
| `STEAM.APP_ID_REGEX` | `/https:\/\/store\.steampowered\.com\/app\/(\d+)/g` | Estrae gli app ID dai risultati di ricerca. | `steam.ts` |
| `STEAM.IMAGE_REGEX` | regex su `shared.cloudflare/fastly.steamstatic.com` | Estrae gli URL delle immagini dalla pagina dell'app. | `imageScrapers.ts` |
| `ITCH.SEARCH_URL` | `"https://itch.io/search?"` | Endpoint di ricerca itch.io. | `imageScrapers.ts` |
| `ITCH.GAME_LINK_REGEX` | regex su `title game_link` | Estrae i link alle pagine dei giochi. | `imageScrapers.ts`, `IframePostProcessor` |
| `ITCH.IMAGE_REGEX` | regex su `img.itch.zone` | Estrae gli URL delle immagini. | `imageScrapers.ts` |
| `ITCH.EMBED_URL` | `"https://itch.io/embed/"` | Base degli embed itch.io. | `IframePostProcessor` |
| `ITCH.EMBED_API` | funzione `(dev, game) => ...` | Costruisce l'endpoint JSON per ricavare l'ID embed da un URL `dev.itch.io/game`. | `IframePostProcessor` |
| `ITCH.EMBED_ID_REGEX` | `/embed\\\/(\d+?)&quot/` | Estrae l'ID embed dalla risposta JSON. | `IframePostProcessor` |
| `TMDB.BASE_URL` | `"https://www.themoviedb.org"` | Base del sito TMDb. | `imageScrapers.ts` |
| `TMDB.SEARCH_URL` | `"https://www.themoviedb.org/search?"` | Endpoint di ricerca. | `imageScrapers.ts` |
| `TMDB.POSTER_REGEX` | `/class="poster"[\s\S]*?href="(.+?)"/g` | Estrae i link ai risultati. | `imageScrapers.ts` |
| `TMDB.IMAGE_REGEX` | `/class="card compact ok"[\s\S]*?href="(.+?)"/g` | Estrae i link alle immagini/backdrop. | `imageScrapers.ts` |
| `TMDB.BACKDROPS_SUFFIX` | `"/images/backdrops"` | Suffisso della pagina immagini di un titolo. | `imageScrapers.ts` |

#### D. Spotify, template e filename

| Costante | Valore proposto | Ruolo | Consumatori |
|---|---|---|---|
| `SPOTIFY.LINK_REGEX` | `/(?:https|http):\/\/open\.spotify\.com.*?\/(\w*)\/(\w*)(?:$|\?)/` | Riconosce e scompone i link Spotify. | `ImportFromLinkModal`, `IframePostProcessor` |
| `SPOTIFY.TRACK_PREFIX` | `"https://open.spotify.com/track/"` | Prefisso del link traccia nel template. | `SpotifyTrackLinkProcessor` |
| `SPOTIFY.ALBUM_PREFIX` | `"https://open.spotify.com/album/"` | Prefisso del link album nel template. | `SpotifyAlbumLinkProcessor` |
| `SPOTIFY.ARTIST_PREFIX` | `"https://open.spotify.com/artist/"` | Prefisso del link artista nel template. | `SpotifyArtistLinkProcessor` |
| `SPOTIFY.EMBED_URL` | funzione `(type, id) => ...` | Costruisce l'URL dell'iframe Spotify. | `IframePostProcessor` |
| `TEMPLATE_FIELDS.DATE_REGEX` | `/^date:[^\S\n]*$/m` | Trova il campo `date:` vuoto. | 3 processor Spotify |
| `TEMPLATE_FIELDS.NAME_REGEX` | `/^name:[^\S\n]*$/m` | Trova il campo `name:` vuoto. | 3 processor Spotify |
| `TEMPLATE_FIELDS.AUTHOR_EMPTY_REGEX` | `/^author:[^\S\n]*\[\][^\S\n]*$/m` | Trova `author: []`. | Track/Album processor |
| `TEMPLATE_FIELDS.ALBUM_REGEX` | `/^album:[^\S\n]*$/m` | Trova il campo `album:` vuoto. | Track processor |
| `TEMPLATE_FIELDS.INDEX_REGEX` | `/^index:[^\S\n]*$/m` | Trova il campo `index:` vuoto. | Track processor |
| `TEMPLATE_FIELDS.DATE_PREFIX` | `"date: "` | Prefisso di replacement. | 3 processor |
| `TEMPLATE_FIELDS.NAME_PREFIX` | `"name: "` | Prefisso di replacement. | 3 processor |
| `TEMPLATE_FIELDS.AUTHOR_PREFIX` | `"author:\n  - "` | Prefisso della lista autori. | Track/Album processor |
| `TEMPLATE_FIELDS.ALBUM_PREFIX` | `"album: "` | Prefisso di replacement. | Track processor |
| `TEMPLATE_FIELDS.INDEX_PREFIX` | `"index: "` | Prefisso di replacement. | Track processor |
| `FILENAME.FORBIDDEN_CHARS_REGEX` | `/[*"\/<>:|?]{1}/g` | Caratteri non validi nei nomi file Obsidian/Windows. | `LinkProcessor` |
| `FILENAME.EXTENSION` | `".md"` | Estensione delle note create. | `LinkProcessor` |
| `FILENAME.RESERVED_NAMES` | `["CON", "PRN", "AUX", "NUL", "COM1", ...]` | Nomi riservati Windows da rifiutare. | `LinkProcessor` |
| `FILENAME.MAX_LENGTH` | `200` | Limite prudenziale per il basename. | `LinkProcessor` |

#### E. HTTP, messaggi e classi CSS

| Costante | Valore proposto | Ruolo | Consumatori |
|---|---|---|---|
| `HTTP.DEFAULT_ACCEPT` | `"*/*"` | Header Accept di default per richieste testuali/HTML. | `obsidianFetch` |
| `HTTP.TIMEOUT_MS` | `15000` | Timeout applicativo per le richieste. | `obsidianFetch` |
| `HTTP.RETRY_COUNT` | `2` | Numero di retry su errori transitori. | `obsidianFetch` |
| `HTTP.USER_AGENT` | `"MediaCurator/1.0"` | User-Agent identificabile per i siti scraped. | `obsidianFetch` |
| `MESSAGES.INVALID_URL` | `"Invalid URL"` | URL non riconosciuto. | `ImportFromLinkModal` |
| `MESSAGES.INVALID_SPOTIFY_URL` | `"Invalid Spotify URL"` | Link Spotify non tra track/album/artist. | `ImportFromLinkModal` |
| `MESSAGES.CREDENTIALS_NOT_FOUND` | `"Secret Spotify Credentials NOT FOUND!"` | Credenziali mancanti. | 3 processor |
| `MESSAGES.FILE_ALREADY_EXISTS` | `"ERROR: File Already Exists!"` | Collisione filename. | `LinkProcessor` |
| `MESSAGES.TEMPLATE_NOT_FOUND` | `"Template NOT FOUND!"` | Template assente. | `LinkProcessor` |
| `MESSAGES.CREATE_FAILED` | `"Failed to create note"` | Errore di `vault.create`. | `LinkProcessor` |
| `MESSAGES.GALLERY_NOT_FOUND` | `"Gallery not found in the current note"` | Sostituzione gallery non riuscita. | `ImageSearchModal` |
| `MESSAGES.NO_ACTIVE_SCRAPERS` | `"There are no active scrapers!"` | Nessuno scraper selezionato. | `ImageSearchModal` |
| `MESSAGES.NO_IMAGES` | `"No image found!"` | Ricerca senza risultati. | `ImageSearchModal` |
| `MESSAGES.COPIED` | `"Copied to clipboard!"` | Copia riuscita. | `clipboard` |
| `MESSAGES.COPY_ERROR` | `"Failed to copy to clipboard"` | Copia fallita. | `clipboard` |
| `CSS_CLASSES.GALLERY_ROOT` | `"GalleryCodeBlock"` | Classe radice del code block gallery. | `GalleryCodeBlock`, `styles.css` |
| `CSS_CLASSES.GALLERY_IMAGE` | `"gallery"` | Contenitore dell'immagine di sfondo. | `GalleryCodeBlock`, `styles.css` |
| `CSS_CLASSES.GALLERY_MENU` | `"small-menu"` | Menu con frecce e matita. | `GalleryCodeBlock`, `styles.css` |
| `CSS_CLASSES.GALLERY_MENU_BUTTON` | `"small-menu-btn"` | Singolo pulsante del menu. | `GalleryCodeBlock`, `styles.css` |
| `CSS_CLASSES.GALLERY_ARROW` | `"arrow"` | Freccia del menu. | `GalleryCodeBlock`, `styles.css` |
| `CSS_CLASSES.GALLERY_ARROW_CONTAINER` | `"arrow-container"` | Area cliccabile laterale. | `GalleryCodeBlock`, `styles.css` |
| `CSS_CLASSES.IMAGE_SEARCH_MODAL` | `"ImageSearchModal"` | Classe radice della modale image search. | `ImageSearchModal`, `styles.css` |
| `CSS_CLASSES.IMPORT_LINK_MODAL` | `"ImportFromLinkModal"` | Classe radice della modale import. | `ImportFromLinkModal`, `styles.css` |
| `CSS_CLASSES.IMAGES_CONTAINER` | `"images-container"` | Griglia dei risultati immagini. | `ImageSearchModal`, `styles.css` |
| `CSS_CLASSES.IMAGE_CHECKBOX_DIV` | `"my-image-checkbox-div"` | Card immagine + checkbox. | `ImageSearchModal`, `styles.css` |
| `CSS_CLASSES.EMPTY_SELECTION` | `"empty-selection"` | Messaggio "nessun risultato". | `ImageSearchModal`, `styles.css` |
| `CSS_CLASSES.SPOTIFY_IFRAME` | `"spotify-iframe"` | Iframe Spotify. | `IframePostProcessor`, `styles.css` |
| `CSS_CLASSES.YOUTUBE_IFRAME` | `"youtube-iframe"` | Iframe YouTube. | `IframePostProcessor`, `styles.css` |
| `CSS_CLASSES.STEAM_IFRAME` | `"steam-iframe"` | Iframe Steam. | `IframePostProcessor`, `styles.css` |
| `CSS_CLASSES.ITCH_IFRAME` | `"itchio-iframe"` | Iframe itch.io. | `IframePostProcessor`, `styles.css` |
| `CSS_CLASSES.STEAM_ITCH_CONTAINER` | `"steam-itchio-iframe-container"` | Contenitore due iframe Steam + itch. | `IframePostProcessor`, `styles.css` |

### 5.6 Migrazione file per file

| File | Magic strings da estrarre |
|---|---|
| `main.ts` | `SECRET_SETTINGS_FILENAME`, icone/label ribbon, messaggi secret. |
| `src/widgets/GalleryCodeBlock.ts` | `GALLERY.CODE_BLOCK`, icone, fence, classi CSS, messaggi. |
| `src/widgets/IframePostProcessor.ts` | regex/URL Spotify, YouTube, Steam, itch; classi iframe; `HTTP`. |
| `src/modals/ImageSearchModal/ImageSearchModal.ts` | `SCRAPERS.NAMES`, `SCRAPERS.BY_FOLDER`, regex gallery/header, classi CSS, messaggi. |
| `src/modals/ImageSearchModal/imageScrapers.ts` | URL/regex Steam/itch/TMDb, `DEFAULT_LIMIT`, `LINE_SENTINEL`. |
| `src/utils/steam.ts` | `STEAM.*`, `DEFAULT_LIMIT`. |
| `src/modals/ImportFromLinkModal/ImportFromLinkModal.ts` | `SPOTIFY.LINK_REGEX`, mappa `VAULT.MUSIC.*`, messaggi. |
| `src/modals/ImportFromLinkModal/LinkProcessorSubclasses/LinkProcessor.ts` | `FILENAME.*`, `MESSAGES.*`, estensione. |
| `src/modals/ImportFromLinkModal/LinkProcessorSubclasses/Spotify*.ts` | `SPOTIFY.*_PREFIX`, `TEMPLATE_FIELDS.*`. |
| `src/utils/obsidianFetch.ts` | `HTTP.*`. |
| `src/utils/clipboard.ts` | `MESSAGES.COPIED`, `MESSAGES.COPY_ERROR`. |
| `src/utils/date.ts` | nessuna magic string necessaria; il formato è implementato direttamente. |
| `src/conts.ts` | rinominare in `src/consts.ts` e ampliare. |

### 5.7 Regole di naming

- `*_URL`: URL o template di URL.
- `*_REGEX`: espressioni regolari.
- `*_FOLDER`: cartelle del vault.
- `*_TEMPLATE`: path di template.
- `*_PREFIX` / `*_SUFFIX`: frammenti di stringa usati nelle replacement.
- `*_ICON`: nomi Lucide.
- `*_LABEL`: testi UI.
- `MESSAGES.*`: testi mostrati all'utente.
- `CSS_CLASSES.*`: classi del plugin; `styles.css` resta la fonte di verità per i selettori.

### 5.8 Definition of done

- `src/consts.ts` è l'unico punto in cui compaiono URL, regex, path di default, messaggi e classi CSS del plugin.
- Nessun segreto in `consts.ts`.
- `src/conts.ts` non esiste più; tutti gli import puntano a `src/consts.ts`.
- Typecheck, build e lint passano.
- `grep` di controllo: nessuna occorrenza residua di `!MediaAnalysis`, `open.spotify.com`, `store.steampowered.com`, `itch.io`, `themoviedb.org`, `secret-settings.json` e del fence `gallery` fuori da `consts.ts` e dai test.
- Test unitari sulle costanti con regex e sulle funzioni di escaping.
- QA manuale della checklist in §4.6.

---

## 6. Piano di implementazione a fasi

### Fase 0 — Decisioni

- Scegliere il nome (privato e/o pubblico).
- Decidere se pubblicare una o due feature.
- Decidere se introdurre una settings tab ora o dopo il refactoring.

### Fase 1 — Fix P0 (S/M)

1. `IframePostProcessor`: `p.textContent` + await.
2. `ImageSearchModal`: token di ricerca, `closed`, `splice` guard, `vault.process`.
3. `escapeFilePropertyStrings`: quoting YAML-safe.
4. Gallery: raw esatto + URL escaping.
5. `minAppVersion`/CSS: alzare la versione o appiattire il CSS.

### Fase 2 — Estrazione `consts.ts` (M)

1. Creare `src/consts.ts` con i gruppi A-E.
2. Rinominare `src/conts.ts` e aggiornare `main.ts`.
3. Sostituire i literal file per file secondo §5.6.
4. Aggiungere test per regex/escaping.
5. Verificare con typecheck/build/lint e grep.

### Fase 3 — Robustezza e UX (M)

1. `LinkProcessor`: controllo O(1), validazione filename, creazione cartella o errore chiaro.
2. `obsidianFetch`: Accept per chiamata, timeout, retry, rate limit.
3. Scraper: rimuovere log, cache, API ufficiali dove possibile.
4. Spotify: servizio con cache token; validazione placeholder template.
5. Messaggi e Notice: rimuovere notice all'avvio, aggiungere errori actionable.

### Fase 4 — Community readiness (M/L)

1. Settings tab con path/template/mapping configurabili.
2. Manifest/package metadata, LICENSE, README generico, screenshot.
3. Toolchain lint aggiornata (ESLint 9 + typescript-eslint 8, flat config).
4. Test unitari e CI.
5. Accessibilità e mobile (hover/touch, ARIA, tastiera).

### Fase 5 — Estrazione plugin pubblici (L, opzionale)

1. Estrarre `Media Curator` (gallery + crawler) con settings generici.
2. Estrarre `Spotify Notes` (import) con PKCE/credenziali utente.
3. Mantenere il plugin privato come integrazione del vault.

---

## 7. Commit suggeriti

Refactoring P0:

```text
fix: corregge race condition e quoting negli import/gallery

- corregge lo scope del testo in IframePostProcessor
- attende le sostituzioni asincrone degli iframe
- serializza le ricerche immagini e protegge la selezione
- usa vault.process per aggiornare la gallery
- rende YAML-safe l'escaping delle proprietà
```

Estrazione costanti:

```text
refactor: centralizza le costanti in src/consts.ts

- rinomina conts.ts in consts.ts
- estrae URL, regex, path, messaggi e classi CSS
- aggiorna i consumer e aggiunge test sulle regex
```

Community readiness:

```text
chore: prepara il plugin alla pubblicazione community

- aggiunge settings tab e metadata manifest/package
- aggiunge LICENSE e README generico
- aggiorna ESLint/typescript-eslint
- aggiunge test e checklist QA
```

---

## 8. Rischi e note

- **Non** centralizzare literal puramente locali o privi di significato: aumenterebbe il rumore.
- **Non** mettere segreti in `consts.ts`.
- **Non** condividere regex globali usate con `.exec()`/`.test()` senza reset o factory.
- **Non** rompere i path del vault personale durante l'estrazione: i default devono restare identici.
- **Non** introdurre una settings tab prima di aver stabilizzato i fix P0.
- **Non** aggiornare `minAppVersion` senza aggiornare `versions.json`.
- Gli scraper HTML restano il punto più fragile: qualsiasi pubblicazione richiede manutenzione continua e una strategia di fallback.
