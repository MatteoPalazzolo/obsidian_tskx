import { Plugin } from 'obsidian';
import { BannerSearchModal } from 'src/modals/BannerSearchModal';
import { GitPushModal } from 'src/modals/GitPushModal';
import { DefaultScannerModal } from 'src/modals/DefaultScannerModal';


export default class extends Plugin {

    onload(): Promise<void> | void {
        // https://lucide.dev/
        this.addRibbonIcon('image-plus', 'Search Banner', (evt: MouseEvent) => new BannerSearchModal(this.app).open());
        this.addRibbonIcon('scan-eye', 'Default Banner Scan', (evt: MouseEvent) => new DefaultScannerModal(this.app).open());
        this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open());
        this.registerSpotifyMarkdownPostProcessor();
    }

    onunload(): void {

    }

    private registerSpotifyMarkdownPostProcessor() {
        this.registerMarkdownPostProcessor((element, context) => {

            element.querySelectorAll("p").forEach(p => {
                const text = element.textContent?.trim() ?? "";
                console.log(text);
                const match = text.match(/(?:https|http):\/\/.*?\/(\w*)(?:$|\?)/);
                if (match) {
                    const [, trackId] = match;
                    console.log(trackId);
                    const iframe = document.createElement("iframe");
                    iframe.classList.add('spotify-iframe');
                    iframe.src = `https://open.spotify.com/embed/track/${trackId}?theme=1`;
                    iframe.loading = "lazy";
                    console.log("callback called");
                    p.replaceWith(iframe);
                }
            });
        });
    }

}
