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
        this.setScale(2);

        // Добавляем управление
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Устанавливаем стандартную гравитацию для персонажа
        this.body.setGravityY(2000); // Базовая гравитация
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
        const speed = 300; // Скорость движения влево/вправо
        this.setVelocityX(0); // Сбрасываем горизонтальную скорость

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
            this.setVelocityY(-400); // Устанавливаем начальную силу прыжка
        }

        // Динамическая гравитация
        if (this.body.velocity.y < 0) {
            // Персонаж поднимается - уменьшаем влияние гравитации
            this.setGravityY(1000);
        } else {
            // Персонаж падает - увеличиваем гравитацию
            this.setGravityY(3000);
        }

        // Ограничиваем максимальную скорость падения
        const maxFallSpeed = 600;
        if (this.body.velocity.y > maxFallSpeed) {
            this.setVelocityY(maxFallSpeed);
        }
    }
}
