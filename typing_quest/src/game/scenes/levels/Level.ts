import { Scene, GameObjects, Tilemaps, Sound, Physics } from "phaser";
import { Character } from "../../entities/Character";
import { EventBus } from "../../EventBus";
import { EnemyManager } from "../../systems/EnemyManager";
import { ScoreManager } from "@/game/systems/ScoreManager";
import { BattleSystem } from "@/game/systems/BattleSystem";
import { InputSystem } from "@/game/systems/InputSystem";
import { UISystem } from "@/game/systems/UISystem";

export class Level extends Scene {
    private readonly distancePerKey: number = 100;
    private backgroundMusic!: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private character!: Character;
    private isGamePaused: boolean = false;
    private autojumpZones: Phaser.Types.Tilemaps.TiledObject[] = [];
    private finishZone: Phaser.Types.Tilemaps.TiledObject | null = null;
    private enemyManager!: EnemyManager;
    private level_config: any;
    private scoreManager!: ScoreManager;
    private battleDistance: number = 50;
    private battleSystem: BattleSystem;
    private inputSystem!: InputSystem;
    private uiSystem!: UISystem;
    private levelName: string;

    constructor() {
        super("Level");
    }
    init(data: { levelName: string }) {
        this.levelName = data.levelName;
    }
    create() {
        console.log(this.levelName);
        this.initScene();
        this.createLevelMap();
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
        this.uiSystem.createInputInterface();

        this.scoreManager = new ScoreManager(this);
        this.inputSystem = new InputSystem(
            this,
            this.scoreManager,
            this.level_config.sequences,
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
                this.level_config.battleSequences
            );
        }
        this.uiSystem.updateStatsDisplay(this.scoreManager, this.character);
        this.checkZoneIntersections();
        this.character.updateState();
    }

    private initScene() {
        this.background = this.add
            .image(0, 0, `${this.levelName}_bg`)
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setScrollFactor(0);

        this.level_config = this.cache.json.get(this.levelName);
    }

    private createLevelMap() {
        this.map = this.make.tilemap({ key: `${this.levelName}_map` });
        const decors = this.map.addTilesetImage("2", `decors_${this.levelName}`, 0, 0);
        const tileset = this.map.addTilesetImage("1", `tiles_${this.levelName}`, 0, 0);

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


    private togglePause() {
        this.isGamePaused = !this.isGamePaused;
        this.isGamePaused ? this.physics.pause() : this.physics.resume();
        this.uiSystem.pauseMenu.setVisible(this.isGamePaused);
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
        this.physics.pause();
        this.isGamePaused = true;
        this.character.stopMoving();
        this.backgroundMusic.stop();
        this.battleSystem.cleanup();
        const chartCanvas = this.uiSystem.createSpeedChart(this.scoreManager.getTypingSpeedHistory());
        
        const stats = {
            time: this.scoreManager.getTimeFormatted(),
            accuracy: this.scoreManager.getAccuracy().toFixed(1),
            speed: this.scoreManager.getAverageSpeed().toFixed(1),
            score: this.scoreManager.calculateScore(),
            chart: chartCanvas.toDataURL(),
        };

        this.uiSystem.showResultsWindow(stats, () => {
            this.scene.start("Map");
        });
    }
}
