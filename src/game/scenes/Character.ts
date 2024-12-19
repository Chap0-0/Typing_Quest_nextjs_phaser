import { Scene, Physics } from "phaser";

export class Character extends Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        // Добавляем игрока в физическую группу сцены
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(10);
        this.setCollideWorldBounds(true);
        this.setScale(1.5);

        // Добавляем управление
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    static preload(scene: Scene) {
        scene.load.spritesheet("character", "assets/character/character-sprite.png", {
            frameWidth: 32,
            frameHeight: 48,
        });
    }

    static createAnimations(scene: Scene) {
        scene.anims.create({
            key: "left",
            frames: scene.anims.generateFrameNumbers("character", { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1,
        });

        scene.anims.create({
            key: "turn",
            frames: [{ key: "character", frame: 4 }],
            frameRate: 20,
        });

        scene.anims.create({
            key: "right",
            frames: scene.anims.generateFrameNumbers("character", { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1,
        });
    }

    handleMovement() {
        const speed = 300;
        this.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.setVelocityX(-speed);
            this.anims.play("left", true);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(speed);
            this.anims.play("right", true);
        } else {
            this.anims.play("turn", true);
        }

        if (this.cursors.up.isDown && this.body.blocked.down) {
            this.setVelocityY(-5000);
        }
    }
}
