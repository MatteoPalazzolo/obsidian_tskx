
```ts
this.app.vault.create("cartella/nome_file.md", "contenuto")

const content = await this.app.vault.read(file);

await this.app.vault.modify(file, newContent);


function createInternalLink(parent: HTMLElement, name: string): HTMLElement {

    const internalLink = parent.createEl("li").createEl("a", {
        text: name, cls: "internal-link"
    });

    internalLink.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        this.app.workspace.openLinkText(name, "", true);
        this.close();
    });

    return internalLink;
}
```