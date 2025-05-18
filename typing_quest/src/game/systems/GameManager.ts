import { EventBus } from "../EventBus";

export class GameManager {
    private currentLevel: Scene | null = null;

    constructor() {
        this.initGlobalEvents();
    }

    private initGlobalEvents() {
        // Управление игрой
        EventBus.on('level-start', (level: Scene) => {
            this.currentLevel = level;
        });

        // Управление звуком
        EventBus.on('audio-toggle', (state: boolean) => {
            this.toggleAudio(state);
        });
    }

    private toggleAudio(state: boolean) {
        SoundManager.setGlobalVolume(state ? 1 : 0);
        EventBus.emit('audio-state-changed', state);
    }

    destroy() {
        EventBus.off('level-start');
        EventBus.off('level-complete');
        EventBus.off('audio-toggle');
    }
}