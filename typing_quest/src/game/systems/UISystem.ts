import React from "react";
import { Scene, GameObjects } from "phaser";
import { ScoreManager } from "@/game/systems/ScoreManager";
import { Character } from "../entities/Character";
import { createRoot } from 'react-dom/client';
import PauseModal from './../../components/PauseModal';
import ResultsModal from './../../components/ResultsModal';

export class UISystem {
    private scene: Scene;
    private statsText!: GameObjects.Text;
    private statsBg!: GameObjects.Image;
    private symbolContainer!: GameObjects.Container;
    private pauseModalContainer!: HTMLDivElement;
    private resultsModalContainer!: HTMLDivElement;
    private pauseModalRoot: any = null;
    private resultsModalRoot: any = null;

    // Константы для статистики (аналогично InputSystem)
    private readonly STATS_Y_PERCENT = 62; // На 3% выше чем InputSystem
    private readonly STATS_BASE_WIDTH = 580;
    private readonly STATS_BASE_HEIGHT = 80;
    private readonly STATS_FONT_SIZE = 24;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public createStatsDisplay() {
        // Удаляем старые элементы если они есть
        if (this.statsBg) this.statsBg.destroy();
        if (this.statsText) this.statsText.destroy();

        const zoom = this.scene.cameras.main.zoom;
        const interfaceY = this.scene.scale.height * (this.STATS_Y_PERCENT / 100);
        const statsWidth = this.STATS_BASE_WIDTH / zoom;
        const statsHeight = this.STATS_BASE_HEIGHT / zoom;
        const fontSize = this.STATS_FONT_SIZE / zoom;

        // Создаем фон статистики
        this.statsBg = this.scene.add
            .image(this.scene.scale.width / 2, interfaceY, "stats")
            .setDisplaySize(statsWidth, statsHeight)
            .setScrollFactor(0)
            .setDepth(105);

        // Создаем текст статистики
        this.statsText = this.scene.add
            .text(this.scene.scale.width / 2, interfaceY - 10 / zoom, "", {
                fontFamily: "RuneScape",
                fontSize: `${fontSize}px`,
                color: "#000000",
                padding: { x: 10, y: 5 },
                align: "center",
            })
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(106);

        this.statsText.setShadow(1, 1, "rgba(255,255,255,0.5)", 1);
    }

    public updateStatsDisplay(
        scoreManager: ScoreManager,
        character: Character
    ) {
        if (!this.statsText) return;

        this.statsText.setText(
            [
                `Точность: ${scoreManager.getAccuracy().toFixed(1)}%`,
                `Правильно: ${scoreManager.getCorrectCount()}`,
                `Ошибки: ${scoreManager.getIncorrectCount()}`,
                `Всего: ${scoreManager.getTotalCount()}`,
            ].join("  |  ")
        );
    }

    private createModalContainers() {
        const oldPause = document.getElementById('pause-modal-container');
        const oldResults = document.getElementById('results-modal-container');
        if (oldPause) oldPause.remove();
        if (oldResults) oldResults.remove();

        this.pauseModalContainer = document.createElement('div');
        this.pauseModalContainer.id = 'pause-modal-container';
        this.pauseModalContainer.style.display = 'none';

        this.resultsModalContainer = document.createElement('div');
        this.resultsModalContainer.id = 'results-modal-container';
        this.resultsModalContainer.style.display = 'none';

        document.getElementById('game-container')?.appendChild(this.pauseModalContainer);
        document.getElementById('game-container')?.appendChild(this.resultsModalContainer);
    }

    public createPauseSystem(togglePause: () => void, toggleAudio: () => void, returnToMap: () => void) {
        this.createModalContainers();
        
        const zoom = this.scene.cameras.main.zoom;
        const pauseButton = this.scene.add
            .image(window.innerWidth / 7, 140 / zoom, "pause_button")
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(10000)
            .setScale(5 / zoom)
            .on("pointerdown", () => {
                togglePause();
            });

        if (!this.pauseModalRoot) {
            this.pauseModalRoot = createRoot(this.pauseModalContainer);
        }

        this.pauseModalRoot.render(
            React.createElement(PauseModal, {
                onResume: togglePause,
                onToggleAudio: toggleAudio,
                onReturnToMap: () => {
                    this.scene.sound.stopAll();
                    this.cleanup();
                    returnToMap();
                }
            })
        );
    }

    public async showResultsWindow(stats: any, onComplete: () => void) {
        let leaderboard = [];
        try {
            const response = await fetch(`http://localhost:3000/results/level/${stats.levelId}?limit=5`);
            if (response.ok) {
                leaderboard = await response.json();
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }

        if (!this.resultsModalRoot) {
            this.resultsModalRoot = createRoot(this.resultsModalContainer);
        }

        this.resultsModalContainer.style.display = 'block';

        this.resultsModalRoot.render(
            React.createElement(ResultsModal, {
                stats,
                leaderboard,
                onComplete
            })
        );
    }

    public setPauseMenuVisible(visible: boolean) {
        this.pauseModalContainer.style.display = visible ? 'block' : 'none';
    }

    public cleanup() {
        if (this.pauseModalRoot) {
            this.pauseModalRoot.unmount();
        }
        if (this.resultsModalRoot) {
            this.resultsModalRoot.unmount();
        }
        const pauseContainer = document.getElementById('pause-modal-container');
        const resultsContainer = document.getElementById('results-modal-container');
        if (pauseContainer) pauseContainer.remove();
        if (resultsContainer) resultsContainer.remove();
        
        this.symbolContainer?.destroy();
        this.statsText?.destroy();
        this.statsBg?.destroy();
    }
}