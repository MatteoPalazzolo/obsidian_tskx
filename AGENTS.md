# AGENTS.md

## Commands
- `npm install` first.
- `npm run dev` - esbuild watch only. DOES NOT typecheck.
- `npm run build` - `tsc -noEmit -skipLibCheck` + production bundle. Only full verification; run before finishing.
- Typecheck only: `npx tsc -noEmit -skipLibCheck`.
- Lint (no npm script): `npx eslint .` (config `.eslintrc`, ignores `main.js`).
- Release: `npm version <patch|minor|major>` runs `version-bump.mjs`, syncing `manifest.json` + `versions.json`; tags have no `v` prefix (`.npmrc`).
- `node` may be absent in sandboxes; typecheck/build then cannot run.

## Gotchas
- `main.js` is a generated, gitignored bundle. Never edit it; rebuild instead.
- New/changed files must be LF (`.editorconfig` `end_of_line = lf`).
- Ti trovi all'interno di una sandbox che gira su WSL con il progetto condiviso in un mount da una cartella di windows, tienine conto e non provare mai a eseguire comandi direttamente sull'host windows.

## Obsidian Guidelines
- Piattaforme: Assicurati che il plugin funzioni sia su Desktop che su Mobile (iOS e Android), oppure disabilita esplicitamente il supporto mobile nel manifest.json ("isDesktopOnly": true).
- Lifecycle Hooks: Ripulisci sempre eventi, listener e intervalli all'interno del metodo onunload(). Utilizza helper come this.registerEvent() o this.registerInterval() che gestiscono automaticamente il cleanup.
- Prestazioni: Non eseguire scansioni massive del vault all'avvio nel thread principale (onLayoutReady). Differisci i caricamenti pesanti ed evita operazioni bloccanti.
- CSS & Temi: Usa le variabili CSS native di Obsidian (es. --text-normal, --background-primary) per garantire che il plugin si adatti perfettamente sia al tema chiaro/scuro sia ai temi personalizzati.
- Conformità UI (seamless): Quando modifichi o inietti interfaccia, l'interfaccia nativa che stai toccando è la fonte di verità. Riutilizza le classi/componenti native di Obsidian (es. text-icon-button, text-button-icon, text-button-label) e le sue variabili CSS (--metadata-label-font, --metadata-label-font-size, --button-radius, --size-*, --text-muted, --background-modifier-hover, --icon-color-hover, --input-font-weight, --line-height-normal, ...) al posto di valori a mano, e non ridefinire gli stati (hover, :focus-visible, disabled, active) se puoi ereditare quelli nativi. Replica tipografia, spaziature e stati del controllo nativo equivalente in modo che l'elemento iniettato risulti indistinguibile da quello nativo. Ispeziona l'elemento reale (devtools) e verifica la resa prima di chiudere il lavoro.

## User Guidelines
- alla fine dell'implementazione di uno o più punti suggeriscimi sempre cosa scrivere nel git commit che gestirò in autonomia
- ogni qualvolta che ti chiedo un riferimento al codice ti chiederei di rispondermi con la notazione di vscode del tipo main.ts:42 o src/settings.md:5 ; crea dei link relativi all'interno di workspace/ e non menzionare workspace nei link stesso
- non toccare mai comandi di github in scrittura, ho disabilitato la scrittura nella cartella .git, ogni tentativo sarà negato, voglio avere controllo completo del versioning in autonomia
- commenta estensivamente sia file che codice descrivendo il ruolo svolto dal rispettivo file o funzione o classe o chi per esso all'interno dell'architettura del programma, in modo che io possa facilmente orientarmi con uno sguardo ad alto livello
- commenta estensivamente sia file che codice descrivendo il ruolo svolto dal rispettivo file o funzione o classe o chi per esso all'interno dell'architettura del programma, in modo che io poss a facilmente orientarmi con uno sguardo ad alto livello
- il prodotto deve risultare NON invasivo, non considerare mai soluzioni automatiche di reconfor
m a cascata se non specificato da una feature gestita dall'UI dello scanner per esempio, le autom
azioni in una nota devono essere sempre circoscritte alla nota stessa

## Env
- generalmente aspettati che io abbia eseguito npm run dev da un ambiente windows, il watch si occuperà di fare una build dev a ogni nuova modifica
- anche se ne hai la possibilità attraverso MCP evita sempre e categoricamente di eseguire comandi sull'host windows per vie traverse, limitati al tuo ambiente a ai tool che ti sono stati dati, senza sfruttare eval o exec che ti dovrebbero servire solo per il test delle feature in real time