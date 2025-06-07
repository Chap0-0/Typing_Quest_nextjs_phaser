import { Scene } from "phaser";
import { ScoreManager } from "@/game/systems/ScoreManager";

export class InputSystem {
    // Константы интерфейса
    private readonly INTERFACE_Y_PERCENT = 65; // 65% от высоты экрана
    private readonly BASE_HEIGHT = 160;
    private readonly BASE_WIDTH = 800;
    private readonly VISIBLE_SYMBOLS = 19; // Количество видимых символов
    private readonly PAST_SYMBOLS = 9; // Количество отображаемых пройденных символов
    private readonly FONT_SIZE = 52;
    private readonly SYMBOL_SPACING = 36;

    private scene: Scene;
    private scoreManager: ScoreManager;
    private currentInputIndex: number = 0;
    private fullSequence: string[] = [];
    private isProcessingInput: boolean = false;
    public symbolContainer!: Phaser.GameObjects.Container;
    private backgroundImage!: Phaser.GameObjects.Image;
    private sequences: string[];
    private distancePerKey: number;
    private onCorrectInputCallback?: (distance: number) => void;
    private isInputActive: boolean = true;
    private inputHandler?: (event: KeyboardEvent) => void;

    constructor(
        scene: Scene,
        scoreManager: ScoreManager,
        sequences: string[],
        distancePerKey: number = 40
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

    public setInputActive(active: boolean) {
        this.isInputActive = active;
    }

    private generateSequence(templates: string[], count: number): string[] {
        let result: string[] = [];
        const availableChars = templates[0];
        
        for (let i = 0; i < count; i++) {
            let group = [];
            for (let j = 0; j < 4; j++) {
                const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
                group.push(randomChar);
            }
            group.push("_");
            result.push(...group);
        }
        return result;
    }

    private createInputInterface() {
        // Удаляем старые элементы если они есть
        if (this.backgroundImage) this.backgroundImage.destroy();
        if (this.symbolContainer) this.symbolContainer.destroy();

        const zoom = this.scene.cameras.main.zoom;
        const interfaceY = this.scene.scale.height * (this.INTERFACE_Y_PERCENT / 100);
        const interfaceWidth = this.BASE_WIDTH / zoom;
        const interfaceHeight = this.BASE_HEIGHT / zoom;
        this.backgroundImage = this.scene.add.image(
            this.scene.scale.width / 2,
            interfaceY,
            "input_bg"
        )
        .setDisplaySize(interfaceWidth, interfaceHeight)
        .setDepth(101)
        .setScrollFactor(0);
        this.symbolContainer = this.scene.add.container(
            this.scene.scale.width / 2,
            interfaceY
        )
        .setDepth(102)
        .setScrollFactor(0);

        this.updateSymbolDisplay();
    }

    private updateSymbolDisplay() {
        this.symbolContainer.removeAll(true);

        const zoom = 2.8;
        const fontSize = this.FONT_SIZE / zoom;
        const symbolSpacing = this.SYMBOL_SPACING / zoom;

        const symbolStyle = {
            fontSize: `${fontSize}px`,
            fontFamily: "RuneScape",
            color: "#777777",
        };
        const currentStyle = {
            ...symbolStyle,
            color: "#000000",
            fontWeight: "bold",
        };
        const pastStyle = { ...symbolStyle, color: "#CC2D39" };

        let xPosition = 0;

        // Прошедшие символы (красные)
        const pastStart = Math.max(0, this.currentInputIndex - this.PAST_SYMBOLS);
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

        // Текущий символ (черный жирный)
        if (this.currentInputIndex < this.fullSequence.length) {
            this.symbolContainer.add(
                this.scene.add
                    .text(xPosition, 0, this.fullSequence[this.currentInputIndex], currentStyle)
                    .setOrigin(0.5)
            );
            xPosition += symbolSpacing;
        }

        // Будущие символы (серые)
        this.fullSequence
            .slice(
                this.currentInputIndex + 1,
                this.currentInputIndex + 1 + (this.VISIBLE_SYMBOLS - (this.currentInputIndex - pastStart + 1)))
            .forEach((symbol) => {
                this.symbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, symbolStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });
        this.symbolContainer.x = this.scene.scale.width / 2 - symbolSpacing * this.PAST_SYMBOLS;
    }

    public registerInputHandler() {
        if (this.inputHandler) {
            this.scene.input.keyboard?.off('keydown', this.inputHandler);
        }
        
        this.inputHandler = this.handleInput.bind(this);
        this.scene.input.keyboard?.on('keydown', this.inputHandler);
    }

    public unregisterInputHandler() {
        if (this.inputHandler) {
            this.scene.input.keyboard?.off('keydown', this.inputHandler);
        }
    }

    public setOnCorrectInputCallback(callback: (distance: number) => void) {
        this.onCorrectInputCallback = callback;
    }

    private handleInput(event: KeyboardEvent) {
        if (!this.isInputActive || this.isProcessingInput) return;
        this.isProcessingInput = true;

        const expectedChar = this.fullSequence[this.currentInputIndex];
        
        if (expectedChar === '_') {
            if (event.code === 'Space') {
                this.scoreManager.recordCorrectChar(false);
                const distance = this.processCorrectInput();
                this.onCorrectInputCallback?.(distance);
            } else {
                this.scoreManager.recordIncorrectChar(false);
            }
        } 
        else if (event.key.toLowerCase() === expectedChar.toLowerCase()) {
            this.scoreManager.recordCorrectChar(false);
            const distance = this.processCorrectInput();
            this.onCorrectInputCallback?.(distance);
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
        this.backgroundImage?.destroy();
        this.symbolContainer?.destroy();
    }
}