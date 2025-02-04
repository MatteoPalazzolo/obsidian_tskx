import { Plugin } from "obsidian";

export function registerCodeBlockProcessor(this: Plugin) {
    this.registerMarkdownCodeBlockProcessor("gallery", async (source, el, ctx) => {
        let activeSlide = 0;

        const imageUrlList = source.split('\n')
            .map((line) => line.trim())
            .filter((line) => line);
        
        el.classList.add('GalleryCodeBlock')
        const galleryContainerEl = el;
        
        // Create Gallery
        const galleryEl = galleryContainerEl.createEl('div', { cls: 'gallery' });

        // se non ci sono immagini rendi lo sfondo grigio
        if (imageUrlList.length === 0) {
            galleryEl.style.backgroundColor = "var(--tab-container-background)";
            return;
        }

        galleryEl.style.backgroundImage = "url(" + imageUrlList[activeSlide] + ")";

        // se c'è una sola immagine non renderizzare le frecce
        if (imageUrlList.length === 1) {
            return;
        }

        // Create Left Arrow
        const leftArrowContainerEl = galleryContainerEl.createDiv({ cls: 'arrow-container left' });
        leftArrowContainerEl.createSpan({ text: '<' });
        // previous image
        leftArrowContainerEl.onclick = () => {
            if (activeSlide === 0) {
                activeSlide = imageUrlList.length - 1;
            } else {
                activeSlide -= 1;
            }
            galleryEl.style.backgroundImage = "url(" + imageUrlList[activeSlide] + ")";
        }

        // Create Right Arrow
        const rightArrowContainerEl = galleryContainerEl.createDiv({ cls: 'arrow-container right' });
        rightArrowContainerEl.createSpan({ text: '>'  });
        // next image
        rightArrowContainerEl.onclick = () => {
            activeSlide = (activeSlide + 1) % imageUrlList.length;
            galleryEl.style.backgroundImage = "url(" + imageUrlList[activeSlide] + ")";
        }

    });
}