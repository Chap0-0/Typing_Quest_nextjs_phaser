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
    private symbolContainer!: GameObjects.Container;
    private livesText!: Phaser.GameObjects.Text;
    private pauseModalContainer!: HTMLDivElement;
    private resultsModalContainer!: HTMLDivElement;
    private pauseModalRoot: any = null;
    private resultsModalRoot: any = null;
    constructor(scene: Scene) {
        this.scene = scene;
    }

    // ===== Система статистики =====
    public createStatsDisplay() {
        const interfaceHeight = this.scene.scale.height * 0.2;
        const interfaceY = this.scene.scale.height - interfaceHeight;

        // Фон статистики (используем такое же изображение как для ввода)
        const bg = this.scene.add
            .image(this.scene.scale.width / 2, interfaceY - 60, "stats")
            .setDisplaySize(460, 60)
            .setScrollFactor(0)
            .setDepth(105);

        // Текст статистики (черные буквы)
        this.statsText = this.scene.add
            .text(this.scene.scale.width / 2, interfaceY - 70, "", {
                fontFamily: "RuneScape",
                fontSize: "20px",
                color: "#000000", // Черный цвет текста
                padding: { x: 10, y: 5 },
                align: "center",
            })
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(106);

        // Добавляем небольшую тень для лучшей читаемости
        this.statsText.setShadow(1, 1, "rgba(255,255,255,0.5)", 1);

        this.livesText = this.scene.add
            .text(
                this.scene.scale.width / 2,
                this.scene.scale.height - 300,
                "Lives: 5",
                {
                    fontFamily: "RuneScape",
                    fontSize: "24px",
                    color: "#000000",
                }
            )
            .setScrollFactor(0)
            .setDepth(110);
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
        if (this.livesText) {
            this.livesText.setText(`Lives: ${character.getLives()}`);
        }
    }

    // ===== Интерфейс ввода =====
    public createInputInterface() {
        const interfaceHeight = this.scene.scale.height * 0.4;
        const interfaceY = this.scene.scale.height - interfaceHeight;

        this.scene.add
            .image(
                this.scene.scale.width / 2,
                interfaceY + interfaceHeight / 2,
                "input_bg"
            )
            .setDisplaySize(800, 120)
            .setDepth(101)
            .setScrollFactor(0);

        this.symbolContainer = this.scene.add
            .container(
                this.scene.scale.width / 2,
                interfaceY + interfaceHeight / 2
            )
            .setDepth(102)
            .setScrollFactor(0);
    }

    public updateSymbolDisplay(
        fullSequence: string[],
        currentInputIndex: number
    ) {
        this.symbolContainer.removeAll(true);

        const symbolStyle = {
            fontSize: "32px",
            fontFamily: "RuneScape",
            color: "#777777",
        };
        const currentStyle = {
            ...symbolStyle,
            color: "#000000",
        };
        const pastStyle = { ...symbolStyle, color: "#CC2D39" };

        const symbolSpacing = 36;
        let xPosition = 0;

        // Прошлые символы
        const pastStart = Math.max(0, currentInputIndex - 9);
        fullSequence.slice(pastStart, currentInputIndex).forEach((symbol) => {
            this.symbolContainer.add(
                this.scene.add
                    .text(xPosition, 0, symbol, pastStyle)
                    .setOrigin(0.5)
            );
            xPosition += symbolSpacing;
        });

        // Текущий символ
        if (currentInputIndex < fullSequence.length) {
            this.symbolContainer.add(
                this.scene.add
                    .text(
                        xPosition,
                        0,
                        fullSequence[currentInputIndex],
                        currentStyle
                    )
                    .setOrigin(0.5)
            );
            xPosition += symbolSpacing;
        }

        // Будущие символы
        fullSequence
            .slice(
                currentInputIndex + 1,
                currentInputIndex +
                    1 +
                    (19 - (currentInputIndex - pastStart + 1))
            )
            .forEach((symbol) => {
                this.symbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, symbolStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        this.symbolContainer.x = this.scene.scale.width / 2 - symbolSpacing * 9;
    }

    private createModalContainers() {
        // Удаляем старые контейнеры, если есть
        const oldPause = document.getElementById('pause-modal-container');
        const oldResults = document.getElementById('results-modal-container');
        if (oldPause) oldPause.remove();
        if (oldResults) oldResults.remove();

        // Создаем новые контейнеры
        this.pauseModalContainer = document.createElement('div');
        this.pauseModalContainer.id = 'pause-modal-container';
        this.pauseModalContainer.style.display = 'none'; // Скрываем по умолчанию

        this.resultsModalContainer = document.createElement('div');
        this.resultsModalContainer.id = 'results-modal-container';
        this.resultsModalContainer.style.display = 'none'; // Скрываем по умолчанию

        // Добавляем в DOM
        document.getElementById('game-container')?.appendChild(this.pauseModalContainer);
        document.getElementById('game-container')?.appendChild(this.resultsModalContainer);
    }

    public createPauseSystem(togglePause: () => void, toggleAudio: () => void, returnToMap: () => void) {
        this.createModalContainers(); // Контейнеры создаются со стилем display: none
        
        const pauseButton = this.scene.add
            .image(window.innerWidth / 7, 140, "pause_button")
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(10000)
            .setScale(5)
            .on("pointerdown", () => {
                togglePause(); // Вызовет setPauseMenuVisible с нужным значением
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

        // Показываем контейнер перед рендерингом
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

    // Обновим метод cleanup:
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
        this.livesText?.destroy();
    }
}
