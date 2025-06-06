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
    private isInputActive: boolean = true;
    private inputHandler?: (event: KeyboardEvent) => void;

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

        let expectedChar = this.fullSequence[this.currentInputIndex];
        
        if (expectedChar === '_') {
            if (event.code === 'Space') {
                this.scoreManager.recordCorrectChar(false);
                const distance = this.processCorrectInput();
                
                if (this.onCorrectInputCallback) {
                    this.onCorrectInputCallback(distance);
                }
            } else {
                this.scoreManager.recordIncorrectChar(false);
            }
        } 
        else if (event.key.toLowerCase() === expectedChar.toLowerCase()) {
            this.scoreManager.recordCorrectChar(false);
            const distance = this.processCorrectInput();
            
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