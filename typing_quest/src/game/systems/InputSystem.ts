import { Scene } from "phaser";
import { ScoreManager } from "@/game/systems/ScoreManager";

export class InputSystem {
    private scene: Scene;
    private scoreManager: ScoreManager;
    private currentInputIndex: number = 0;
    private fullSequence: string[] = [];
    private isProcessingInput: boolean = false;
    private symbolContainer!: Phaser.GameObjects.Container;
    private sequences: string[];
    private distancePerKey: number;
    private onCorrectInputCallback?: (distance: number) => void;
    constructor(
        scene: Scene,
        scoreManager: ScoreManager,
        sequences: string[],
        distancePerKey: number = 100
    ) {
        this.scene = scene;
        this.scoreManager = scoreManager;
        this.sequences = sequences;
        this.distancePerKey = distancePerKey;
        this.fullSequence = this.generateSequence(sequences, 30);
    }

    public initialize() {
        this.createInputInterface();
        this.registerInputHandler();
    }

    private generateSequence(templates: string[], count: number): string[] {
        let result: string[] = [];
        for (let i = 0; i < count; i++) {
            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            result.push(...randomTemplate.split(""));
        }
        return result.map((char) => (char === "_" ? " " : char));
    }

    private createInputInterface() {
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
            .container(this.scene.scale.width / 2, interfaceY + interfaceHeight / 2)
            .setDepth(102)
            .setScrollFactor(0);

        this.updateSymbolDisplay();
    }

    private updateSymbolDisplay() {
        this.symbolContainer.removeAll(true);

        const symbolStyle = {
            fontSize: "48px",
            fontFamily: "RuneScape",
            color: "#777777",
        };
        const currentStyle = {
            ...symbolStyle,
            color: "#000000",
            fontWeight: "bold",
        };
        const pastStyle = { ...symbolStyle, color: "#CC2D39" };

        const symbolSpacing = 36;
        let xPosition = 0;

        // Прошлые символы
        const pastStart = Math.max(0, this.currentInputIndex - 9);
        this.fullSequence
            .slice(pastStart, this.currentInputIndex)
            .forEach((symbol) => {
                this.symbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, pastStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        // Текущий символ
        if (this.currentInputIndex < this.fullSequence.length) {
            this.symbolContainer.add(
                this.scene.add
                    .text(
                        xPosition,
                        0,
                        this.fullSequence[this.currentInputIndex],
                        currentStyle
                    )
                    .setOrigin(0.5)
            );
            xPosition += symbolSpacing;
        }

        // Будущие символы
        this.fullSequence
            .slice(
                this.currentInputIndex + 1,
                this.currentInputIndex + 1 + (19 - (this.currentInputIndex - pastStart + 1)))
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

    public registerInputHandler() {
        this.scene.input.keyboard?.on('keydown', this.handleInput.bind(this));
    }

    public unregisterInputHandler() {
        this.scene.input.keyboard?.off('keydown', this.handleInput.bind(this));
    }

    public setOnCorrectInputCallback(callback: (distance: number) => void) {
        this.onCorrectInputCallback = callback;
    }

    private handleInput(event: KeyboardEvent) {
        if (this.isProcessingInput) return;
        this.isProcessingInput = true;

        if (event.key.toLowerCase() === this.fullSequence[this.currentInputIndex]) {
            this.scoreManager.recordCorrectChar(false);
            const distance = this.processCorrectInput();
            
            // Вызываем callback при правильном вводе
            if (this.onCorrectInputCallback) {
                this.onCorrectInputCallback(distance);
            }
        } else {
            this.scoreManager.recordIncorrectChar(false);
        }

        this.scene.time.delayedCall(50, () => {
            this.isProcessingInput = false;
        });
    }

    private processCorrectInput() {
        this.currentInputIndex++;
        this.updateSymbolDisplay();
        // Возвращаем дистанцию для движения персонажа
        return this.distancePerKey;
    }

    public getCurrentSequence(): string[] {
        return [...this.fullSequence];
    }

    public resetSequence() {
        this.currentInputIndex = 0;
        this.fullSequence = this.generateSequence(this.sequences, 30);
        this.updateSymbolDisplay();
    }

    public cleanup() {
        this.unregisterInputHandler();
        this.symbolContainer.destroy();
    }
}