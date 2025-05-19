import { Scene } from "phaser";
import { Character } from "../entities/Character";

export class LevelPreloader extends Scene {
    private targetLevel: string;
    private enemyConfig: any;

    constructor() {
        super("LevelPreloader");
    }

    init(data: { targetLevel: string }) {
        this.targetLevel = data.targetLevel;
        this.createProgressBar();
    }

    private createProgressBar() {
        const barWidth = 468;
        const barHeight = 32;
        const barX = this.scale.width / 2;
        const barY = this.scale.height / 2;

        this.add.rectangle(barX, barY, barWidth, barHeight).setStrokeStyle(1, 0x602b2c);

        const bar = this.add.rectangle(
            barX - barWidth / 2 + 2,
            barY,
            4,
            barHeight - 4,
            0xffffff
        );

        this.load.on("progress", (progress: number) => {
            bar.width = 4 + (barWidth - 8) * progress;
        });
    }

    preload() {
        // Сначала загружаем конфиг врагов
        this.load.json('enemy-config', `assets/levels/${this.targetLevel}/enemy-config.json`);
        
        // Затем остальные ресурсы
        this.loadResourcesForLevel(this.targetLevel);
        Character.preload(this);
    }

    create() {
        this.enemyConfig = this.cache.json.get('enemy-config');
        this.loadEnemyResources();
        
        this.load.once('complete', () => {
            this.createEnemyAnimations();
            Character.createAnimations(this);
            this.scene.start('Level', { levelName: this.targetLevel });
        });
        this.load.start();
    }

    private loadEnemyResources() {
        this.load.setPath('assets/enemies/');
        
        this.enemyConfig.enemyTypes.forEach((enemyType: any) => {
            // Загружаем отдельные файлы для каждой анимации
            if (enemyType.animations) {
                Object.entries(enemyType.animations).forEach(([animName, animData]: [string, any]) => {
                    const textureKey = `enemy_${enemyType.type}_${animName}`;
                    const texturePath = `${enemyType.type}/${animData.texture || enemyType.texture}`;
                    
                    this.load.spritesheet(
                        textureKey,
                        texturePath,
                        { 
                            frameWidth: animData.frameWidth || enemyType.frameWidth || 32, 
                            frameHeight: animData.frameHeight || enemyType.frameHeight || 32 
                        }
                    );
                });
            }
            
            // Загружаем звуки если есть
            if (enemyType.sounds) {
                enemyType.sounds.forEach((sound: string) => {
                    this.load.audio(`enemy_${enemyType.type}_${sound}`, sound);
                });
            }
        });
        this.load.setPath('');
    }

    private createEnemyAnimations() {
        this.enemyConfig.enemyTypes.forEach((enemyType: any) => {
            if (enemyType.animations) {
                Object.entries(enemyType.animations).forEach(([animName, animData]: [string, any]) => {
                    this.anims.create({
                        key: `enemy_${enemyType.type}_${animName}`,
                        frames: this.anims.generateFrameNumbers(
                            `enemy_${enemyType.type}_${animName}`,
                            { 
                                start: animData.startFrame || 0, 
                                end: animData.endFrame || 3 
                            }
                        ),
                        frameRate: animData.frameRate || 10,
                        repeat: animData.repeat || -1,
                        yoyo: animData.yoyo || false
                    });
                });
            }
        });
    }
    private loadResourcesForLevel(levelName: string) {
        const levelPath = `assets/levels/${levelName}`;
        this.load.setPath(levelPath);
        this.load.tilemapTiledJSON(`${levelName}_map`, `${levelName}.tmj`);
        this.load.image(`tiles_${levelName}`, `tiles_${levelName}.png`);
        this.load.image(`decors_${levelName}`, `decors_${levelName}.png`);
        this.load.json(`${levelName}`, `${levelName}.json`);
        this.load.image(`${levelName}_bg`, `${levelName}_bg.png`);
        this.load.audio("backgroundMusic", `${levelName}.mp3`);
        this.load.setPath(""); 
        this.load.image('input_bg', 'assets/ui/scroll.png');
        this.load.image('pause_button', 'assets/ui/pause_button.png');
    }
}