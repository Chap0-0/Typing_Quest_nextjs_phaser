import { Scene } from "phaser";
import { Character } from "./Character";

export class LevelPreloader extends Scene {
    private targetLevel: string;

    constructor() {
        super("LevelPreloader");
    }

    init(data: { targetLevel: string }) {
        this.targetLevel = data.targetLevel;

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
        console.log(this.targetLevel);
        // Загрузка ресурсов уровня
        this.loadResourcesForLevel(this.targetLevel);

        // Загрузка ресурсов персонажа
        Character.preload(this);
    }

    create() {
        // Создание анимаций персонажа
        Character.createAnimations(this);

        // Переход к целевому уровню
        this.scene.start(this.targetLevel);
    }

    private loadResourcesForLevel(levelName: string) {
        const levelPath = `assets/levels/${levelName}`;
        
        this.load.setPath(levelPath);
        this.load.tilemapTiledJSON(`${levelName}_map`, `${levelName}.tmj`);
        this.load.image(`tiles_${levelName}`, `tiles_${levelName}.png`);
        this.load.image(`decors_${levelName}`, `decors_${levelName}.png`);
        this.load.image(`${levelName}_bg`, `${levelName}_bg.png`);
        this.load.audio("backgroundMusic", `${levelName}.mp3`);

        // После загрузки уровня, сброс пути, чтобы не затрагивать другие ресурсы
        this.load.setPath(""); 
    }
}
