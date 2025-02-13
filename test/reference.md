
```ts
this.app.vault.create("cartella/nome_file.md", "contenuto")

const content = await this.app.vault.read(file);

await this.app.vault.modify(file, newContent);
```