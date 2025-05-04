import { Scene, Physics } from "phaser";

export class Character extends Physics.Arcade.Sprite {
    private isMoving: boolean = false;

    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Настройки отображения
        this.setScale(2);
        this.setDepth(100);
        this.setCollideWorldBounds(true);

        // Физические настройки
        this.body.setGravityY(1000);
        this.setMaxVelocity(600, 1200);

        // Изначальный хитбокс
        this.updateHitbox("idle");
    }

    static preload(scene: Scene) {
        scene.load.spritesheet("idle", "assets/character/IDLE.png", {
            frameWidth: 96,
            frameHeight: 60,
        });

        scene.load.spritesheet("walk", "assets/character/WALK.png", {
            frameWidth: 96,
            frameHeight: 60,
        });

        scene.load.spritesheet("jump", "assets/character/JUMP.png", {
            frameWidth: 96,
            frameHeight: 60,
        });
    }

    static createAnimations(scene: Scene) {
        // Анимация покоя
        scene.anims.create({
            key: "idle",
            frames: scene.anims.generateFrameNumbers("idle", {
                start: 0,
                end: 7,
            }),
            frameRate: 8,
        });

        // Анимация ходьбы
        scene.anims.create({
            key: "walk",
            frames: scene.anims.generateFrameNumbers("walk", {
                start: 0,
                end: 7,
            }),
            frameRate: 10,
        });

        // Анимация прыжка (только вверх)
        scene.anims.create({
            key: "jump_up",
            frames: scene.anims.generateFrameNumbers("jump", { start: 0, end: 2 }),
            frameRate: 15,
            repeat: 0
        });

        // Анимация падения (только вниз)
        scene.anims.create({
            key: "fall",
            frames: [{ key: "jump", frame: 3 }],
            frameRate: 2,
            repeat: 0
        });
    }


    updateState() {
        const isOnGround = this.body.blocked.down || this.body.touching.down;

        if (isOnGround) {
            this.isJumping = false;
            this.play(this.isMoving ? "walk" : "idle", true);
        } else {
            if (this.body.velocity.y < 0 && !this.isJumping) {
                this.isJumping = true;
                this.play("jump_up", true);
            } else if (this.body.velocity.y > 0) {
                this.play("fall", true);
            }
        }

        this.updateHitbox(isOnGround ? (this.isMoving ? "walk" : "idle") : 
                          (this.body.velocity.y < 0 ? "jump" : "fall"));
    }

    private updateHitbox(state: "idle" | "walk" | "jump" | "fall") {
        switch (state) {
            case "idle":
                this.body.setSize(32, 35);
                this.body.setOffset(32, 25);
                break;

            case "walk":
                this.body.setSize(32, 35);
                this.body.setOffset(32, 25);
                break;

            case "jump":
                this.body.setSize(28, 40);
                this.body.setOffset(34, 20);
                break;

            case "fall":
                this.body.setSize(28, 30);
                this.body.setOffset(34, 30);
                break;
        }
    }

    go() {
        this.isMoving = true;
        // Движение только во время анимации
        this.setVelocityX(200);

        // Автоматическая остановка после анимации
        this.once("animationcomplete-walk", () => {
            this.stopMoving();
        });
    }

    stopMoving() {
        this.isMoving = false;
        this.setVelocityX(0);
        this.setAccelerationX(0);
        this.play("idle", true); // Возврат к анимации покоя
    }


    jump() {
        if (this.body.blocked.down || this.body.touching.down) {
            this.setVelocityY(-400);
            this.isJumping = true;
            this.play("jump_up", true);
            this.updateHitbox("jump");
        }
    }
}
