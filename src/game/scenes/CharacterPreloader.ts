import { Scene } from "phaser";

export class CharacterPreloader extends Scene {
    private targetLevel: string;

    constructor() {
        super("CharacterPreloader");
    }

    init(data: { targetLevel: string }) {
        this.targetLevel = data.targetLevel;
        const barWidth = 468;
        const barHeight = 32;
        const barX = this.scale.width / 2;
        const barY = this.scale.height / 2;

        this.add
            .rectangle(barX, barY, barWidth, barHeight)
            .setStrokeStyle(1, 0x602b2c);

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
        this.load.setPath("assets/character");
        this.load.spritesheet("character", "character-sprite.png", {
            frameWidth: 32,
            frameHeight: 48,
        });
    }

    create() {
        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("character", {
                start: 0,
                end: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "turn",
            frames: [{ key: "character", frame: 4 }],
            frameRate: 20,
        });
        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("character", {
                start: 5,
                end: 8,
            }),
            frameRate: 10,
            repeat: -1,
        });

        // Переход на сцену выбранного уровня
        this.scene.start(this.targetLevel);
    }
}
