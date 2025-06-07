import { Scene, GameObjects, Tilemaps, Sound, Physics } from "phaser";
import { Character } from "../entities/Character";
import { EventBus } from "../EventBus";
import { EnemyManager } from "../systems/EnemyManager";
import { ScoreManager } from "@/game/systems/ScoreManager";
import { BattleSystem } from "@/game/systems/BattleSystem";
import { InputSystem } from "@/game/systems/InputSystem";
import { UISystem } from "@/game/systems/UISystem";


export class Level extends Scene {
    private readonly distancePerKey: number = 40;
    private backgroundMusic!: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private character!: Character;
    private isGamePaused: boolean = false;
    private autojumpZones: Phaser.Types.Tilemaps.TiledObject[] = [];
    private finishZone: Phaser.Types.Tilemaps.TiledObject | null = null;
    private enemyManager!: EnemyManager;
    private scoreManager!: ScoreManager;
    private battleDistance: number = 25;
    private battleSystem: BattleSystem;
    private inputSystem!: InputSystem;
    private uiSystem!: UISystem;
    private level_id: string;
    private levelConfig: any;
    private accessToken: string | null = null;
    public mapOffsetY: number = 0;
    constructor() {
        super("Level");
    }
    init(data: { levelConfig: string; accessToken: string }) {
        this.levelConfig = data.levelConfig;
        this.accessToken = data.accessToken;
    }
    create() {
        this.level_id = this.levelConfig.levelId.slice(-1);
        this.isGamePaused = false;
        this.initScene();
        this.createLevelMap();
        this.adjustMapPosition();
        this.createCharacter();
        this.createAudio();
        this.createEnemies();
        this.uiSystem = new UISystem(this);
        this.uiSystem.createStatsDisplay();
        this.uiSystem.createPauseSystem(
            () => this.togglePause(),
            () => this.toggleAudio(),
            () => this.scene.start("Map")
        );
        
        this.scoreManager = new ScoreManager(this);
        
        const charSet = this.levelConfig[this.levelConfig.selectedLanguage || 'ru'];
        this.inputSystem = new InputSystem(
            this,
            this.scoreManager,
            [charSet],
            this.distancePerKey
        );
        this.inputSystem.setOnCorrectInputCallback((distance) => {
            this.character.move(distance);
        });
        this.inputSystem.initialize();

        this.battleSystem = new BattleSystem(
            this,
            this.character,
            this.enemyManager,
            this.scoreManager,
            this.inputSystem
        );
    }

    update() {
        if (this.isGamePaused) return;

        if (!this.battleSystem.isBattleMode) {
            this.battleSystem.checkBattleStart(
                this.battleDistance,
                this.levelConfig[this.levelConfig.selectedLanguage || 'ru']
            );
        }
        this.uiSystem.updateStatsDisplay(this.scoreManager, this.character);
        this.checkZoneIntersections();
        this.character.updateState();
    }
private createCharacter() {
    // Получаем слой character из карты
    const characterLayer = this.map.getObjectLayer("character");
    if (!characterLayer || characterLayer.objects.length === 0) {
        console.error("Character layer not found or empty in the tilemap!");
        this.character = new Character(this, 100, 200 + this.mapOffsetY, "character");
    } else {
        // Берем первый объект из слоя character
        const charData = characterLayer.objects[0];
        this.character = new Character(
            this, 
            charData.x, 
            charData.y + this.mapOffsetY,
            "character"
        );
    }


    const collidersLayer = this.map.getLayer("main");
    if (collidersLayer && collidersLayer.tilemapLayer) {
        this.physics.add.collider(
            this.character,
            collidersLayer.tilemapLayer
        );
    }

    this.cameras.main
        .startFollow(this.character)
        .setZoom(2.8)
        .setBounds(
            0,
            0,
            this.map.widthInPixels, 
            this.map.heightInPixels *
                (this.scale.height / this.map.heightInPixels)
        );
    this.background.setScrollFactor(0);
}


private adjustMapPosition() {
    // Вычисляем насколько нужно поднять карту
    const offsetY = this.scale.height - this.map.heightInPixels;
    this.mapOffsetY = offsetY; // Сохраняем смещение для последующего использования
    
    // Смещаем все слои карты
    this.map.layers.forEach(layer => {
        if (layer.tilemapLayer) {
            layer.tilemapLayer.y += offsetY;
        }
    });

    // Обновляем границы физического мира
    this.physics.world.setBounds(
        0,
        offsetY,
        this.map.widthInPixels,
        this.map.heightInPixels
    );
}
    private initScene() {
        this.background = this.add
            .image(0, 0, `${this.levelConfig.levelId}_bg`)
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setScrollFactor(0);
    }

    private createLevelMap() {
        this.map = this.make.tilemap({ key: `${this.levelConfig.levelId}_map` });
        
        const decors = this.map.addTilesetImage("2", `decors_${this.levelConfig.levelId}`);
        const tileset = this.map.addTilesetImage("1", `tiles_${this.levelConfig.levelId}`);

        // Создаем слои без масштабирования
        const backgroundLayer = this.map.createLayer("bg", [decors, tileset], 0, 0);
        const collidersLayer = this.map.createLayer("main", tileset, 0, 0);
        this.autojumpZones = this.map.getObjectLayer("autojump")?.objects || [];
        this.finishZone = this.map.getObjectLayer("finish")?.objects[0] || null;
        collidersLayer.setCollisionByExclusion([-1]);

        // Фиксируем границы мира в пикселях карты
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    private createEnemies() {
        this.enemyManager = new EnemyManager(this, this.levelConfig);
        this.enemyManager.createFromTilemap(
            this.map,
            this.mapOffsetY
        );
        
        const collidersLayer = this.map.getLayer("main");
        if (collidersLayer && collidersLayer.tilemapLayer) {
            this.physics.add.collider(
                this.enemyManager.getEnemies(),
                collidersLayer.tilemapLayer
            );
        }
    }

    private togglePause() {
        this.isGamePaused = !this.isGamePaused;
        this.isGamePaused ? this.physics.pause() : this.physics.resume();
        this.uiSystem.setPauseMenuVisible(this.isGamePaused);
    }

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

    private checkZoneIntersections() {
    const player = this.character;
    const playerBounds = new Phaser.Geom.Rectangle(
        player.body.x,
        player.body.y,
        player.body.width,
        player.body.height
    );

    if (player.body.blocked.down || player.body.touching.down) {
        for (const zone of this.autojumpZones) {
            const zoneRect = new Phaser.Geom.Rectangle(
                zone.x,
                zone.y + this.mapOffsetY,
                zone.width,
                zone.height
            );
            
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, zoneRect)) {
                player.autoJump();
                break;
            }
        }
    }

        // Финиш
        if (this.finishZone) {
            const finishRect = new Phaser.Geom.Rectangle(
                this.finishZone.x,
                this.finishZone.y + this.mapOffsetY,
                this.finishZone.width,
                this.finishZone.height
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

    cleanupScene() {
        // Останавливаем музыку
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic.destroy();
        }

        // Уничтожаем системы
        this.battleSystem?.cleanup();
        this.enemyManager?.cleanup();
        this.inputSystem?.cleanup();
        this.uiSystem?.cleanup();

        // Уничтожаем тайлмапы
        if (this.map) {
            this.map.destroy();
        }

        // Уничтожаем физический мир
        this.physics.world.shutdown();

        // Очищаем все объекты сцены
        this.children.removeAll();

        // Удаляем все слушатели событий
        EventBus.off("event-name");
    }

    shutdown() {
        this.cleanupScene();
    }

    private async showLevelComplete() {
        this.physics.pause();
        this.isGamePaused = true;
        this.character.stopMoving();
        this.backgroundMusic.stop();
        // this.battleSystem.cleanup();
        this.scoreManager.recordCorrectChar();

        const stats = {
            levelId: parseInt(this.level_id),
            time: this.scoreManager.getTimeFormatted(),
            accuracy: this.scoreManager.getAccuracy().toFixed(1),
            speed: this.scoreManager.getAverageSpeed().toFixed(1),
            score: this.scoreManager.calculateScore(),
            errors: this.scoreManager.getIncorrectCount(),
            speedHistory: this.scoreManager.getSpeedHistory(),
        };
        this.saveResultToServer(stats);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/achievements/check`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to check achievements:", error);
        } else {
            const result = await response.json();
        }
    } catch (error) {
        console.error("Error checking achievements:", error);
    }
        // Показываем окно результатов
        this.uiSystem.showResultsWindow(stats, () => {
            this.cleanupScene();
            this.scene.start("Map");
        });
    }

    private async saveResultToServer(stats: any) {
        try {
            const timeTaken = this.scoreManager.getTimeTaken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({
                    levelId: parseInt(this.level_id),
                    cpm: parseFloat(stats.speed),
                    accuracy: parseFloat(stats.accuracy),
                    completionTime: timeTaken,
                    errorsCount: stats.errors,
                    timeTaken: timeTaken
                }),
            });
        } catch (error) {
            console.error('Error saving result:', error);
        }
    }
}
