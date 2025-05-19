import { Scene, GameObjects, Sound, Physics } from "phaser";
import { Character } from "../entities/Character";
import { Enemy } from "@/game/entities/Enemy";
import { ScoreManager } from "@/game/systems/ScoreManager";
import { InputSystem } from "./InputSystem";

export class BattleSystem {
    private scene: Scene;
    private character: Character;
    private scoreManager: ScoreManager;
    private enemyManager: any; // Можно типизировать точнее
    private inputSystem: InputSystem;
    public isBattleMode: boolean = false;
    private battleEnemy: Enemy | null = null;
    private battleSequence: string[] = [];
    private battleInputIndex: number = 0;
    private battleSymbolContainer!: GameObjects.Container;
    private battleBackground!: GameObjects.Rectangle;
    private isProcessingInput: boolean = false;
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
        battleSequences: string[] = []
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
                    this.startBattle(enemy, battleSequences);
                }
            });
    }

    public startBattle(enemy: Enemy, battleSequences: string[] = []) {
        // Сохраняем оригинальный обработчик
        this.inputSystem.unregisterInputHandler();
        this.isBattleMode = true;
        this.battleEnemy = enemy;
        this.character.stopMoving();
        enemy.stopForBattle(this.character.x);
        this.character.setFlipX(enemy.x < this.character.x);

        // Выбираем случайную последовательность для боя
        const randomSequence = Phaser.Utils.Array.GetRandom(battleSequences);
        this.battleSequence = randomSequence.replace(/_/g, " ").split("");
        this.battleInputIndex = 0;

        // Настройка камеры для боя
        this.scene.cameras.main.zoomTo(2, 500);

        // Создание интерфейса боя
        this.createBattleInterface();

        // Переключение обработчиков ввода
        this.scene.input.keyboard?.off('keydown');
        this.scene.input.keyboard?.on('keydown', this.handleBattleInput.bind(this));
    }

    private createBattleInterface() {
        // Фон для интерфейса боя
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

        // Контейнер для символов
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
            fontSize: "32px",
            fontFamily: "Arial",
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

        // Прошлые символы
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

        // Текущий символ
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

        // Будущие символы
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

    public handleBattleInput(event: KeyboardEvent) {
        if (this.isProcessingInput) return;
        this.isProcessingInput = true;

        if (
            event.key.toLowerCase() ===
            this.battleSequence[this.battleInputIndex]
        ) {
            // Записываем правильный ввод (кроме последнего символа)
            if (this.battleInputIndex < this.battleSequence.length - 1) {
                this.scoreManager.recordCorrectChar(true);
            }

            this.battleInputIndex++;
            this.updateBattleSymbolDisplay();

            if (this.battleInputIndex >= this.battleSequence.length) {
                this.character.attack();
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
            this.battleEnemy.body.checkCollision.none = true;
        }

        // Сброс состояния боя
        this.isBattleMode = false;
        this.battleEnemy = null;

        // Удаление интерфейса боя
        this.battleBackground.destroy();
        this.battleSymbolContainer.destroy();

        // Восстановление камеры
        this.scene.cameras.main.pan(this.character.x, this.character.y, 500);
        this.scene.cameras.main.zoomTo(1.3, 500);

        // Сброс обработчиков ввода
        this.scene.input.keyboard!.off("keydown", this.handleBattleInput);

        // Восстанавливаем обычный обработчик ввода
        this.scene.time.delayedCall(100, () => {
            this.inputSystem.resetSequence();
            this.inputSystem.registerInputHandler();
        });
    }

    public cleanup() {
        if (this.isBattleMode) {
            this.finishBattle(false);
        }
    }
}
