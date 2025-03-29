import { Scene, Physics } from "phaser";

export class Character extends Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private isMoving: boolean = false;  // Новый флаг для управления движением

    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        // Добавляем игрока в физическую группу сцены
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(2);
        this.setDepth(100);
        this.setCollideWorldBounds(true);
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
        const speed = 300; // Скорость движения

        if (this.isMoving) {
            this.setVelocityX(speed);
            this.anims.play("right", true);            // Движение вправо
        } else {
            this.setVelocityX(0);
            this.anims.play("turn", true);            // Остановка
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
    startMoving() {
        this.isMoving = true;
        this.scene.time.delayedCall(500, () => {
            this.stopMoving();  // Останавливаем движение через 0,5 секунд
        });
    }

    stopMoving() {
        this.isMoving = false;
    }
}
