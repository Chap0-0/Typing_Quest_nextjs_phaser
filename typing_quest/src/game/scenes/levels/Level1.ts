import { Scene, GameObjects, Tilemaps, Sound, Physics } from "phaser";
import { Character } from "../../entities/Character";
import { EventBus } from "../../EventBus";
import { Enemy } from "@/game/entities/Enemy";
import { EnemyManager } from "./../../systems/EnemyManager";
import { ScoreManager } from "@/game/systems/ScoreManager";

export class Level_1 extends Scene {
    private readonly distancePerKey: number = 100;
    private backgroundMusic!: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private character!: Character;
    private currentInputIndex: number = 0;
    private symbolContainer!: GameObjects.Container;
    private isGamePaused: boolean = false;
    private pauseMenu!: GameObjects.DOMElement;
    private autojumpZones: Phaser.Types.Tilemaps.TiledObject[] = [];
    private finishZone: Phaser.Types.Tilemaps.TiledObject | null = null;
    private background!: GameObjects.Image;
    private map!: Tilemaps.Tilemap;
    private enemyManager!: EnemyManager;
    private level_config: any;
    private scoreManager!: ScoreManager;
    private isBattleMode: boolean = false;
    private battleEnemy: Enemy | null = null;
    private battleSequence: string[] = [];
    private battleInputIndex: number = 0;
    private battleSymbolContainer!: GameObjects.Container;
    private battleBackground!: GameObjects.Rectangle;
    private battleDistance: number = 100;
    private fullSequence: string[] = [];
    private statsText!: Phaser.GameObjects.Text;
    private isProcessingInput: boolean = false;

    constructor() {
        super("Level_1");
    }

    create() {
        // Инициализация основных систем
        this.initScene();
        this.createLevelMap();
        this.createCharacter();
        this.createAudio();
        this.createInputSystem();
        this.createPauseSystem();
        this.createEnemies();
        this.createStatsDisplay();

        this.scoreManager = new ScoreManager(this);
        // Блокировка специальных клавиш
        this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
            if (event.key === "/" || event.key === "'") {
                event.preventDefault();
            }
        });
    }

    update() {
        if (this.isGamePaused) return;
        if (!this.isBattleMode) {
            this.checkBattleStart();
        }
        this.updateStatsDisplay();
        this.checkZoneIntersections();
        this.character.updateState();
    }
    private updateStatsDisplay() {
        if (!this.statsText) return;

        this.statsText.setText(
            [
                `Точность: ${this.scoreManager.getAccuracy().toFixed(1)}%`,
                `Правильно: ${this.scoreManager.getCorrectCount()}`,
                `Ошибки: ${this.scoreManager.getIncorrectCount()}`,
                `Всего: ${this.scoreManager.getTotalCount()}`,
            ].join("  |  ")
        );
    }
    private initScene() {
        this.background = this.add
            .image(0, 0, "Level_1_bg")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setScrollFactor(0);

        this.level_config = this.cache.json.get("Level_1");
    }
    private createStatsDisplay() {
        const interfaceHeight = this.scale.height * 0.4;
        const interfaceY = this.scale.height - interfaceHeight;

        const statsBg = this.add
            .rectangle(
                this.scale.width / 2,
                interfaceY - 40,
                350,
                40,
                0x333333,
                0.8
            )
            .setScrollFactor(0)
            .setDepth(99);

        // Создаем текст статистики
        this.statsText = this.add
            .text(this.scale.width / 2, interfaceY - 50, "", {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                padding: { x: 10, y: 5 },
                align: "center",
            })
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(100);
    }
    private createLevelMap() {
        this.map = this.make.tilemap({ key: "Level_1_map" });
        const decors = this.map.addTilesetImage("2", "decors_Level_1");
        const tileset = this.map.addTilesetImage("1", "tiles_Level_1");

        const backgroundLayer = this.map.createLayer(
            "bg",
            [decors, tileset],
            0,
            0
        );
        const collidersLayer = this.map.createLayer("main", tileset, 0, 0);

        this.autojumpZones = this.map.getObjectLayer("autojump")?.objects || [];
        this.finishZone = this.map.getObjectLayer("finish")?.objects[0] || null;

        collidersLayer.setDepth(1).setCollisionByExclusion([-1]);
        backgroundLayer.setDepth(1);

        const scaleRatio = this.scale.height / this.map.heightInPixels;
        collidersLayer.setScale(scaleRatio);
        backgroundLayer.setScale(scaleRatio);

        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels * scaleRatio,
            this.map.heightInPixels * scaleRatio
        );
    }

    private createCharacter() {
        this.character = new Character(this, 100, 200, "character");

        const collidersLayer = this.map.getLayer("main");
        if (collidersLayer && collidersLayer.tilemapLayer) {
            this.physics.add.collider(
                this.character,
                collidersLayer.tilemapLayer
            );
        }

        this.cameras.main
            .startFollow(this.character)
            .setZoom(1.3)
            .setBounds(
                0,
                0,
                this.map.widthInPixels *
                    (this.scale.height / this.map.heightInPixels),
                this.map.heightInPixels *
                    (this.scale.height / this.map.heightInPixels)
            );
    }

    private createEnemies() {
        const enemyConfig = this.cache.json.get("enemy-config");
        this.enemyManager = new EnemyManager(this, enemyConfig);
        this.enemyManager.createFromTilemap(
            this.map,
            this.scale.height / this.map.heightInPixels
        );
        const collidersLayer = this.map.getLayer("main");

        if (collidersLayer && collidersLayer.tilemapLayer) {
            this.physics.add.collider(
                this.enemyManager.getEnemies(),
                collidersLayer.tilemapLayer
            );
        }
    }

    // ===== Система ввода =====
    private createInputSystem() {
        const sequences = this.level_config.sequences;
        this.fullSequence = this.generateSequence(sequences, 30);
        this.currentInputIndex = 0;

        this.createInputInterface();
        this.input.keyboard.on("keydown", this.handleInput.bind(this));
    }

    private generateSequence(templates: string[], count: number): string[] {
        let result: string[] = [];
        for (let i = 0; i < count; i++) {
            const randomTemplate =
                templates[Math.floor(Math.random() * templates.length)];
            result.push(...randomTemplate.split(""));
        }
        return result.map((char) => (char === "_" ? " " : char));
    }

    private createInputInterface() {
        const interfaceHeight = this.scale.height * 0.4;
        const interfaceY = this.scale.height - interfaceHeight;

        this.add
            .image(
                this.scale.width / 2,
                interfaceY + interfaceHeight / 2,
                "input_bg"
            )
            .setDisplaySize(800, 120)
            .setDepth(101)
            .setScrollFactor(0);

        this.symbolContainer = this.add
            .container(this.scale.width / 2, interfaceY + interfaceHeight / 2)
            .setDepth(102)
            .setScrollFactor(0);

        this.updateSymbolDisplay();
    }

    private updateSymbolDisplay() {
        this.symbolContainer.removeAll(true);

        const symbolStyle = {
            fontSize: "32px",
            fontFamily: "Arial",
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
                    this.add
                        .text(xPosition, 0, symbol, pastStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        // Текущий символ
        if (this.currentInputIndex < this.fullSequence.length) {
            this.symbolContainer.add(
                this.add
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
                this.currentInputIndex +
                    1 +
                    (19 - (this.currentInputIndex - pastStart + 1))
            )
            .forEach((symbol) => {
                this.symbolContainer.add(
                    this.add
                        .text(xPosition, 0, symbol, symbolStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        this.symbolContainer.x = this.scale.width / 2 - symbolSpacing * 9;
    }

    // ===== Система паузы =====
    private createPauseSystem() {
        const pauseButton = this.add
            .image(this.scale.width - 1300, 140, "pause_button")
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(10000)
            .setScale(5)
            .on("pointerdown", () => this.togglePause());

        this.pauseMenu = this.add
            .dom(this.scale.width / 2, this.scale.height / 2)
            .createFromHTML(
                `
                <div style="background: rgba(0,0,0,0.8); border-radius:10px; padding:20px; text-align:center; width:300px;">
                    <button id="toggleSound" style="background:none; border:none; color:white; font-size:24px; cursor:pointer; margin-bottom:20px;">🔊</button>
                    <button id="resumeGame" style="background:#4CAF50; color:white; border:none; padding:10px 20px; margin:10px; cursor:pointer; width:80%;">Продолжить</button>
                    <button id="returnToMap" style="background:#f44336; color:white; border:none; padding:10px 20px; margin:10px; cursor:pointer; width:80%;">Вернуться на карту</button>
                </div>
            `
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);

        const toggleSoundBtn = this.pauseMenu.getChildByID("toggleSound");
        const resumeBtn = this.pauseMenu.getChildByID("resumeGame");
        const returnBtn = this.pauseMenu.getChildByID("returnToMap");

        toggleSoundBtn?.addEventListener("click", () => {
            this.toggleAudio();
            toggleSoundBtn.textContent = this.isAudioPlaying ? "🔊" : "🔇";
        });

        resumeBtn?.addEventListener("click", () => this.togglePause());
        returnBtn?.addEventListener("click", () => this.scene.start("Map"));
    }

    private togglePause() {
        this.isGamePaused = !this.isGamePaused;
        this.isGamePaused ? this.physics.pause() : this.physics.resume();
        this.pauseMenu.setVisible(this.isGamePaused);
    }

    // ===== Аудио система =====
    private createAudio() {
        this.backgroundMusic = this.sound.add("backgroundMusic", {
            loop: true,
        });
        this.backgroundMusic.play();
    }

    private toggleAudio() {
        this.isAudioPlaying = !this.isAudioPlaying;
        this.isAudioPlaying
            ? this.backgroundMusic.resume()
            : this.backgroundMusic.pause();
    }

    // ===== Проверка зон =====
    private checkZoneIntersections() {
        const player = this.character;
        const scaleRatio = this.scale.height / this.map.heightInPixels;
        const playerBounds = new Phaser.Geom.Rectangle(
            player.body.x,
            player.body.y,
            player.body.width,
            player.body.height
        );

        // Автопрыжки
        if (player.body.blocked.down || player.body.touching.down) {
            for (const zone of this.autojumpZones) {
                const zoneRect = new Phaser.Geom.Rectangle(
                    zone.x * scaleRatio,
                    zone.y * scaleRatio,
                    zone.width * scaleRatio,
                    zone.height * scaleRatio
                );
                if (
                    Phaser.Geom.Intersects.RectangleToRectangle(
                        playerBounds,
                        zoneRect
                    )
                ) {
                    player.jump();
                    break;
                }
            }
        }

        // Финиш
        if (this.finishZone) {
            const finishRect = new Phaser.Geom.Rectangle(
                this.finishZone.x * scaleRatio,
                this.finishZone.y * scaleRatio,
                this.finishZone.width * scaleRatio,
                this.finishZone.height * scaleRatio
            );
            if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                    playerBounds,
                    finishRect
                )
            ) {
                this.showLevelComplete();
            }
        }
    }

    private showLevelComplete() {
        // Останавливаем физику и ввод
        this.physics.pause();
        this.isGamePaused = true;
        this.character.stopMoving();
        this.backgroundMusic.stop();

        // Отключаем все обработчики ввода
        this.input.keyboard.off("keydown", this.handleInput);
        this.input.keyboard.off("keydown", this.handleBattleInput);

        // Записываем результаты
        this.scoreManager.completeLevel();

        // Создаем график скорости печати
        const chartCanvas = this.createSpeedChart();

        const stats = {
            time: this.scoreManager.getTimeFormatted(),
            accuracy: this.scoreManager.getAccuracy().toFixed(1),
            speed: this.scoreManager.getAverageSpeed().toFixed(1),
            score: this.scoreManager.calculateScore(),
            chart: chartCanvas.toDataURL(),
        };

        // Показываем окно с результатами
        this.showResultsWindow(stats);
    }

    private createSpeedChart(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;

        const history = this.scoreManager.getTypingSpeedHistory();
        if (history.length === 0) return canvas;

        // Настройки графика
        const padding = 20;
        const graphWidth = canvas.width - 2 * padding;
        const graphHeight = canvas.height - 2 * padding;

        // Находим максимальные значения
        const maxTime = Math.max(...history.map((h) => h.time));
        const maxSpeed = Math.max(...history.map((h) => h.speed), 1);

        // Рисуем оси
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Подписи осей
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px Arial";
        ctx.fillText("Скорость (симв/сек)", padding + 5, padding + 10);
        ctx.fillText("Время (сек)", canvas.width - 40, canvas.height - 5);

        // Рисуем график
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 2;
        ctx.beginPath();

        history.forEach((point, i) => {
            const x = padding + (point.time / maxTime) * graphWidth;
            const y =
                canvas.height -
                padding -
                (point.speed / maxSpeed) * graphHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        return canvas;
    }

    private showResultsWindow(stats: any) {
        const completionWindow = this.add
            .dom(this.scale.width / 2, this.scale.height / 2)
            .createFromHTML(
                `
                <div style="background:rgba(0,0,0,0.9); border:2px solid #4CAF50; border-radius:10px; color:white; padding:20px; text-align:center; width:500px;">
                    <h2>Уровень пройден!</h2>
                    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                        <div style="text-align: left;">
                            <p>Время: ${stats.time}</p>
                            <p>Точность: ${stats.accuracy}%</p>
                            <p>Скорость: ${stats.speed} сим/сек</p>
                            <p style="font-size: 24px; font-weight: bold; margin-top: 10px;">Очки: ${stats.score}</p>
                        </div>
                        <div>
                            <img src="${stats.chart}" style="width: 200px; height: 100px; background: white;" />
                            <p style="font-size: 12px; margin-top: 5px;">График скорости печати</p>
                        </div>
                    </div>
                    <button id="nextLevelBtn" style="background:#4CAF50; color:white; border:none; padding:10px 20px; margin-top:15px; cursor:pointer; border-radius:5px;">На карту</button>
                </div>
            `
            )
            .setOrigin(0.5)
            .setDepth(10000)
            .setScrollFactor(0);

        completionWindow
            .getChildByID("nextLevelBtn")
            ?.addEventListener("click", () => {
                this.saveScore(stats);
                this.scene.start("Map");
            });
    }

    private saveScore(stats: any) {
        // Здесь можно сохранить результаты в localStorage или отправить на сервер
        const leaderboard = JSON.parse(
            localStorage.getItem("leaderboard") || []
        );
        leaderboard.push({
            level: "Level_1",
            score: stats.score,
            time: stats.time,
            date: new Date().toISOString(),
        });
        localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    }
    private checkBattleStart() {
        if (this.isBattleMode) return;

        this.enemyManager
            .getEnemies()
            .getChildren()
            .forEach((enemy: any) => {
                if (
                    enemy.isAlive &&
                    Phaser.Math.Distance.Between(
                        this.character.x,
                        this.character.y,
                        enemy.x,
                        enemy.y
                    ) <= this.battleDistance
                ) {
                    this.startBattle(enemy);
                }
            });
    }

    private startBattle(enemy: Enemy) {
        this.isBattleMode = true;
        this.battleEnemy = enemy;
        this.character.stopMoving();
        enemy.stopForBattle(this.character.x);
        this.character.setFlipX(enemy.x < this.character.x);

        // Берем случайную последовательность из JSON
        const randomSequence = Phaser.Utils.Array.GetRandom(
            this.level_config.battleSequences
        );
        this.battleSequence = randomSequence.replace(/_/g, " ").split("");
        this.battleInputIndex = 0;

        // Настраиваем камеру для боя
        this.cameras.main.zoomTo(2, 500);

        // Создаем интерфейс боя
        this.createBattleInterface();

        // Останавливаем обычный ввод
        this.input.keyboard.off("keydown", this.handleInput);
        this.input.keyboard.on("keydown", this.handleBattleInput.bind(this));
    }

    private createBattleInterface() {
        // Фон для боя
        this.battleBackground = this.add
            .rectangle(
                this.scale.width / 2,
                this.scale.height * 0.3,
                this.scale.width,
                80,
                0x222222,
                0.8
            )
            .setDepth(103)
            .setScrollFactor(0);

        // Контейнер для символов боя
        this.battleSymbolContainer = this.add
            .container(this.scale.width / 2, this.scale.height * 0.3)
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
                    this.add
                        .text(xPosition, 0, symbol, pastStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        // Текущий символ
        if (this.battleInputIndex < this.battleSequence.length) {
            this.battleSymbolContainer.add(
                this.add
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
                    this.add
                        .text(xPosition, 0, symbol, symbolStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });
    }
    private handleInput(event: KeyboardEvent | { key: string }) {
        if (this.isGamePaused || this.isBattleMode || this.isProcessingInput)
            return;

        this.isProcessingInput = true;

        if (
            event.key.toLowerCase() ===
            this.fullSequence[this.currentInputIndex]
        ) {
            this.scoreManager.recordCorrectChar(false);
            this.processCorrectInput();
        } else {
            this.scoreManager.recordIncorrectChar(false);
        }

        // Снимаем блокировку после обработки
        this.time.delayedCall(50, () => {
            this.isProcessingInput = false;
        });
    }

    private handleBattleInput(event: KeyboardEvent | { key: string }) {
        if (this.isProcessingInput) return;
        this.isProcessingInput = true;

        if (
            event.key.toLowerCase() ===
            this.battleSequence[this.battleInputIndex]
        ) {
            // Всегда записываем правильный ввод, кроме последнего символа
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

        this.time.delayedCall(50, () => {
            this.isProcessingInput = false;
        });
    }
    private processCorrectInput() {
        this.currentInputIndex++;
        this.updateSymbolDisplay();
        this.character.move(this.distancePerKey);

        // if (this.currentInputIndex < this.fullSequence.length) {
        //     this.time.delayedCall(300, () => {
        //         this.handleInput({
        //             key: this.fullSequence[this.currentInputIndex],
        //         });
        //     });
        // }
    }
    private finishBattle(success: boolean) {
        if (success && this.battleEnemy) {
            this.battleEnemy.takeDamage();
            this.battleEnemy.body.checkCollision.none = true;
        }

        // Восстанавливаем обычный режим с очисткой состояния
        this.isBattleMode = false;
        this.battleEnemy = null;

        // Удаляем интерфейс боя
        this.battleBackground.destroy();
        this.battleSymbolContainer.destroy();

        // Восстанавливаем камеру
        this.cameras.main.pan(this.character.x, this.character.y, 500);
        this.cameras.main.zoomTo(1.3, 500);

        // Полностью сбрасываем обработчики ввода
        this.input.keyboard.off("keydown", this.handleBattleInput);

        // Важно: обновляем отображение основной последовательности
        this.updateSymbolDisplay();

        // Переустанавливаем обработчик с небольшой задержкой
        this.time.delayedCall(100, () => {
            this.input.keyboard.on("keydown", this.handleInput.bind(this));
        });
    }
}
