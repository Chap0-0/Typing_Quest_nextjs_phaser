import { Scene, GameObjects, Sound, Physics } from "phaser";
import { Character } from "../entities/Character";
import { Enemy } from "@/game/entities/Enemy";
import { ScoreManager } from "@/game/systems/ScoreManager";
import { InputSystem } from "./InputSystem";

export class BattleSystem {
    private scene: Scene;
    private character: Character;
    private scoreManager: ScoreManager;
    private enemyManager: any;
    private inputSystem: InputSystem;
    public isBattleMode: boolean = false;
    private battleEnemy: Enemy | null = null;
    private battleSequence: string[] = [];
    private battleInputIndex: number = 0;
    private battleSymbolContainer!: GameObjects.Container;
    private battleBackground!: GameObjects.Rectangle;
    private isProcessingInput: boolean = false;
    private attackTimer!: Phaser.Time.TimerEvent;
    private timeToAttack: number = 5000;
    private timeLeft: number = this.timeToAttack;
    private timerBar!: Phaser.GameObjects.Graphics;
    private isBattleInputActive: boolean = false;
    private battleStartText!: Phaser.GameObjects.Text;
    private battleStartTimer!: Phaser.Time.TimerEvent;
    private characterHpContainer!: GameObjects.Container;
    private characterHpText!: GameObjects.Text;
    private characterHpHearts: GameObjects.Image[] = [];

    constructor(
            scene: Scene,
            character: Character,
            enemyManager: any,
            scoreManager: ScoreManager,
            inputSystem: InputSystem
        ) {
        this.scene = scene;
        this.character = character;
        this.enemyManager = enemyManager;
        this.scoreManager = scoreManager;
        this.inputSystem = inputSystem;
    }

    public checkBattleStart(
        battleDistance: number = 100,
        availableChars: string
    ) {
        if (this.isBattleMode) return;
        
        this.enemyManager
            .getEnemies()
            .getChildren()
            .forEach((enemy: Enemy) => {
                if (
                    enemy.isAlive &&
                    Phaser.Math.Distance.Between(
                        this.character.x,
                        this.character.y,
                        enemy.x,
                        enemy.y
                    ) <= battleDistance
                ) {
                    this.startBattle(enemy, availableChars);
                }
            });
    }

    public startBattle(enemy: Enemy, availableChars: string) {
        this.inputSystem.unregisterInputHandler();
        this.isBattleMode = true;
        this.battleEnemy = enemy;
        this.character.stopMoving();
        enemy.stopForBattle(this.character.x);
        this.character.setFlipX(enemy.x < this.character.x);
        this.createCharacterHpDisplay();
        this.createBattleStartText();

        this.battleStartTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.beginActualBattle(availableChars);
            },
            callbackScope: this
        });
    }

    private createBattleStartText() {
        this.battleStartText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'БОЙ НАЧИНАЕТСЯ!',
            {
                fontFamily: 'RuneScape',
                fontSize: '72px',
                color: '#FF0000',
                stroke: '#FFFFFF',
                strokeThickness: 5,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 2,
                    stroke: true
                }
            }
        )
        .setOrigin(0.5)
        .setDepth(200)
        .setScrollFactor(0);

        this.scene.tweens.add({
            targets: this.battleStartText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
private createCharacterHpDisplay() {
        this.characterHpContainer?.destroy();
        this.characterHpHearts = [];

        this.characterHpContainer = this.scene.add.container(
            this.character.x,
            this.character.y - 60
        ).setDepth(150);

        this.characterHpText = this.scene.add.text(0, -10, this.character.getLives().toString(), {
            fontFamily: 'RuneScape',
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const heartOffset = 25;
        const heartPositions = [
            { x: -heartOffset, y: 0 },
            { x: heartOffset, y: 0 }
        ];

        heartPositions.forEach(pos => {
            const heart = this.scene.add.image(pos.x, pos.y, 'heart_full')
                .setScale(0.5);
            this.characterHpHearts.push(heart);
            this.characterHpContainer.add(heart);
        });

        this.characterHpContainer.add(this.characterHpText);
    }

    private updateCharacterHpDisplay() {
        if (!this.characterHpText) return;
        
        this.characterHpText.setText(this.character.getLives().toString());
        
        this.characterHpContainer.setPosition(this.character.x, this.character.y - 60);
    }
    private beginActualBattle(availableChars: string) {
        this.battleStartText?.destroy();

        this.battleSequence = this.generateBattleSequence(availableChars, 6);
        this.battleInputIndex = 0;

        this.scene.cameras.main.zoomTo(2, 500);

        this.createBattleInterface();
        this.createTimerBar();
        this.resetAttackTimer();
        
        this.isBattleInputActive = true;
        this.inputSystem.setInputActive(false);

        this.scene.input.keyboard?.off('keydown');
        this.scene.input.keyboard?.on('keydown', this.handleBattleInput.bind(this));
    }

    private generateBattleSequence(availableChars: string, length: number): string[] {
        const sequence = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            sequence.push(availableChars[randomIndex]);
        }
        return sequence;
    }

    private createBattleInterface() {
        this.battleBackground = this.scene.add
            .rectangle(
                this.scene.scale.width / 2,
                this.scene.scale.height * 0.3,
                this.scene.scale.width,
                80,
                0x222222,
                0.8
            )
            .setDepth(103)
            .setScrollFactor(0);

        this.battleSymbolContainer = this.scene.add
            .container(
                this.scene.scale.width / 2,
                this.scene.scale.height * 0.3
            )
            .setDepth(104)
            .setScrollFactor(0);

        this.updateBattleSymbolDisplay();
    }

    private updateBattleSymbolDisplay() {
        this.battleSymbolContainer.removeAll(true);

        const symbolStyle = {
            fontSize: "48px",
            fontFamily: "RuneScape",
            color: "#FF5555",
        };
        const currentStyle = {
            ...symbolStyle,
            color: "#FFFFFF",
            fontWeight: "bold",
        };
        const pastStyle = { ...symbolStyle, color: "#FF0000" };

        const symbolSpacing = 36;
        let xPosition = -((this.battleSequence.length - 1) * symbolSpacing) / 2;

        this.battleSequence
            .slice(0, this.battleInputIndex)
            .forEach((symbol) => {
                this.battleSymbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, pastStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        if (this.battleInputIndex < this.battleSequence.length) {
            this.battleSymbolContainer.add(
                this.scene.add
                    .text(
                        xPosition,
                        0,
                        this.battleSequence[this.battleInputIndex],
                        currentStyle
                    )
                    .setOrigin(0.5)
            );
            xPosition += symbolSpacing;
        }

        this.battleSequence
            .slice(this.battleInputIndex + 1)
            .forEach((symbol) => {
                this.battleSymbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, symbolStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });
    }


    private createTimerBar() {
        this.timerBar?.destroy();
        
        this.timerBar = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(105);
        
        this.updateTimerBar();
    }
    
    private updateTimerBar() {
        const width = 400;
        const height = 10;
        const x = this.scene.scale.width / 2 - width / 2;
        const y = this.scene.scale.height * 0.3 + 40;
        
        this.timerBar.clear();
        this.timerBar.fillStyle(0x333333, 0.8);
        this.timerBar.fillRect(x, y, width, height);
        
        const progressWidth = width * (this.timeLeft / this.timeToAttack);
        this.timerBar.fillStyle(0xff0000, 1);
        this.timerBar.fillRect(x, y, progressWidth, height);
        this.updateCharacterHpDisplay();
    }
    
    private resetAttackTimer() {
        this.timeLeft = this.timeToAttack;
        this.attackTimer?.destroy();
        
        this.attackTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.isBattleInputActive) return;
                
                this.timeLeft -= 100;
                this.updateTimerBar();
                
                if (this.timeLeft <= 0) {
                    this.enemyAttack();
                    this.resetAttackTimer();
                }
            },
            loop: true
        });
    }
    
    private enemyAttack() {
        if (!this.isBattleMode || !this.battleEnemy) return;
        
        this.battleEnemy.playAttackAnimation();
        
        this.character.takeDamage();
        
    }

    private handleBattleInput(event: KeyboardEvent) {
        if (!this.isBattleInputActive || this.isProcessingInput) return;

        if (event.key.toLowerCase() === this.battleSequence[this.battleInputIndex]) {
            
            this.scoreManager.recordCorrectChar(true);
            
            this.character.attack();
            
            if (this.battleEnemy) {
                this.battleEnemy.takeHit();
            }

            this.battleInputIndex++;
            this.updateBattleSymbolDisplay();

            if (this.battleInputIndex >= this.battleSequence.length) {
                this.finishBattle(true);
            }
        } else {
            this.scoreManager.recordIncorrectChar(true);
        }

        this.scene.time.delayedCall(50, () => {
            this.isProcessingInput = false;
        });
    }

    private finishBattle(success: boolean) {
        if (success && this.battleEnemy) {
            this.battleEnemy.takeDamage();
        }
        this.characterHpContainer?.destroy();
        this.characterHpText?.destroy();
        this.characterHpHearts = [];
        this.isBattleMode = false;
        this.isBattleInputActive = false;
        this.battleEnemy = null;
        this.attackTimer?.destroy();

        this.battleBackground?.destroy();
        this.battleSymbolContainer?.destroy();
        this.timerBar?.destroy();
        this.battleStartTimer?.destroy();
        this.battleStartText?.destroy();

        this.scene.cameras.main.pan(this.character.x, this.character.y, 500);
        this.scene.cameras.main.zoomTo(1.3, 500);

        this.scene.input.keyboard?.off('keydown', this.handleBattleInput);

        this.scene.time.delayedCall(100, () => {
            this.inputSystem.resetSequence();
            this.inputSystem.registerInputHandler();
            this.inputSystem.setInputActive(true);
        });
    }   

    public cleanup() {
        if (this.isBattleMode) {
            this.finishBattle(false);
        }
    }
}
