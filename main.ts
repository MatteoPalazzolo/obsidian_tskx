import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { SearchBarModal } from 'ts/modals/SearchBarModal';
import { SearchThisGameModal } from 'ts/modals/SearchThisGameModal';
import { BannerSearchModal } from 'ts/modals/BannerSearchModal';
import { GitPushModal } from 'ts/modals/GitPushModal';
import { DefaultScannerModal } from 'ts/modals/DefaultScannerModal';



export default class extends Plugin {
    
    onload(): Promise<void> | void {
        // https://lucide.dev/
        this.addRibbonIcon('image', 'Image Tool', (evt: MouseEvent) => new SearchBarModal(this.app).open() );
        this.addRibbonIcon('image', 'This Game Banner', (evt: MouseEvent) => new SearchThisGameModal(this.app).open() );
        this.addRibbonIcon('image-plus', 'Search Banner', (evt: MouseEvent) => new BannerSearchModal(this.app).open() );
        this.addRibbonIcon('scan-eye', 'Default Banner Scan', (evt: MouseEvent) => new DefaultScannerModal(this.app).open() );
        this.addRibbonIcon('github', 'Git Push', (evt: MouseEvent) => new GitPushModal(this.app).open() );
        
    }

    onunload(): void {
        
    }
}
