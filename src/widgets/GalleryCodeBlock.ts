import { Plugin, setIcon } from "obsidian";
import { ImageSearchModal } from "src/Modals/ImageSearchModal/ImageSearchModal";

export function registerCodeBlockProcessor(this: Plugin) {
    this.registerMarkdownCodeBlockProcessor("gallery", async (source, el, ctx) => {
        let activeSlide = 0;

        console.log(source)

        const imageUrlList = source.split('\n')
            .map((line) => line.trim())
            .filter((line) => line);
        
        el.classList.add('GalleryCodeBlock')
        const galleryContainerEl = el;
        
        // Create Gallery
        const galleryEl = galleryContainerEl.createEl('div', { cls: 'gallery' });

        // Create Small Menu
        const smallMenuDivEl = galleryContainerEl.createDiv({ cls: 'small-menu' });
        const sxArrowBtnEl = smallMenuDivEl.createSpan({ cls: 'small-menu-btn arrow clickable-icon' });
        sxArrowBtnEl.onclick = () => {
            if (activeSlide === 0) {
                activeSlide = imageUrlList.length - 1;
            } else {
                activeSlide -= 1;
            }
            galleryEl.style.backgroundImage = "url(\"" + imageUrlList[activeSlide] + "\")";
        }
        setIcon(sxArrowBtnEl, 'chevron-left');
        const editGalleryBtnEl = smallMenuDivEl.createSpan({ cls: 'small-menu-btn clickable-icon' });
        editGalleryBtnEl.onclick = (evt: MouseEvent) => new ImageSearchModal(this.app, '```gallery\n' + source + '\n```').open()
        setIcon(editGalleryBtnEl, 'pencil');
        const dxArrowBtnEl = smallMenuDivEl.createSpan({ cls: 'small-menu-btn arrow clickable-icon' });
        dxArrowBtnEl.onclick = () => {
            activeSlide = (activeSlide + 1) % imageUrlList.length;
            galleryEl.style.backgroundImage = "url(\"" + imageUrlList[activeSlide] + "\")";
        }
        setIcon(dxArrowBtnEl, 'chevron-right');
        
        // se non ci sono immagini rendi lo sfondo grigio e non renderizzare le frecce
        if (imageUrlList.length === 0) {
            galleryEl.style.backgroundColor = "var(--tab-container-background)";
            smallMenuDivEl.addClass('no-arrows');
            return;
        }
        
        galleryEl.style.backgroundImage = "url(\"" + imageUrlList[activeSlide] + "\")";
        
        // se c'è una sola immagine non renderizzare le frecce
        if (imageUrlList.length === 1) {
            smallMenuDivEl.addClass('no-arrows');
            return;
        }

        // Left Area
        const leftArrowContainerEl = galleryContainerEl.createDiv({ cls: 'arrow-container left' });
        leftArrowContainerEl.onclick = sxArrowBtnEl.onclick
        // Right Area
        const rightArrowContainerEl = galleryContainerEl.createDiv({ cls: 'arrow-container right' });
        rightArrowContainerEl.onclick = dxArrowBtnEl.onclick;

    });
}