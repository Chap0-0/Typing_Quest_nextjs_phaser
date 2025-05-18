import { Scene, Physics } from "phaser";

export class Character extends Physics.Arcade.Sprite {
    private isMoving: boolean = false;
    private isRunning: boolean = false;
    private walkSpeed: number = 200;
    private runSpeed: number = 400;
    private runThreshold: number = 300;
    private targetX = this.x;
    private numberAnim: number[]= [1,2,3];
    private battleMode: boolean = false;

    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Настройки отображения
        this.setScale(2);
        this.setDepth(100);

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

        scene.load.spritesheet("run", "assets/character/RUN.png", {
            frameWidth: 96,
            frameHeight: 60,
        });

        scene.load.spritesheet("attack_1", "assets/character/ATTACK 1.png", {
            frameWidth: 96,
            frameHeight: 60,
        });
        
        scene.load.spritesheet("attack_2", "assets/character/ATTACK 2.png", {
            frameWidth: 96,
            frameHeight: 60,
        });

        scene.load.spritesheet("attack_3", "assets/character/ATTACK 3.png", {
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
                end: 6,
            }),
            frameRate: 10,
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
            frames: scene.anims.generateFrameNumbers("jump", {
                start: 0,
                end: 2,
            }),
            frameRate: 15,
            repeat: 0,
        });

        // Анимация падения (только вниз)
        scene.anims.create({
            key: "fall",
            frames: [{ key: "jump", frame: 3 }],
            frameRate: 2,
            repeat: 0,
        });

        scene.anims.create({
            key: "attack_1",
            frames: scene.anims.generateFrameNumbers("attack_1", {
                start: 0,
                end: 5,
            }),
            frameRate: 16,
            repeat: 0,
        });
        
        scene.anims.create({
            key: "attack_2",
            frames: scene.anims.generateFrameNumbers("attack_2", {
                start: 0,
                end: 4,
            }),
            frameRate: 16,
            repeat: 0,
        });

        scene.anims.create({
            key: "attack_3",
            frames: scene.anims.generateFrameNumbers("attack_3", {
                start: 0,
                end: 5,
            }),
            frameRate: 16,
            repeat: 0,
        });

        scene.anims.create({
            key: "run",
            frames: scene.anims.generateFrameNumbers("run", {
                start: 0,
                end: 7,
            }),
            frameRate: 12,
        });

    }

    updateState() {
        const isOnGround = this.body.blocked.down || this.body.touching.down;

        if (isOnGround) {
            this.isJumping = false;
            if (this.isMoving) {
                // Автоматически определяем режим движения
                const distanceToTarget = this.targetX - this.x;
                this.isRunning = distanceToTarget > this.runThreshold;
                
                this.play(this.isRunning ? "run" : "walk", true);
                
                // Автоматическая остановка при достижении цели
                if (distanceToTarget <= 0) {
                    this.stopMoving();
                }
            } else if (!this.battleMode) {
                this.play("idle", true);
            }
        } else {
            if (this.body.velocity.y < 0 && !this.isJumping) {
                this.isJumping = true;
                this.play("jump_up", true);
            } else if (this.body.velocity.y > 0) {
                this.play("fall", true);
            }
        }

        this.updateHitbox(
            isOnGround
                ? this.isMoving
                    ? this.isRunning
                        ? "run"
                        : "walk"
                    : "idle"
                : this.body.velocity.y < 0
                ? "jump"
                : "fall"
        );
    }

    move(distanceToAdd: number) {
        this.targetX += distanceToAdd;
        this.isMoving = true;
        
        // Определяем скорость движения
        const speed = this.isRunning ? this.runSpeed : this.walkSpeed;
        this.setVelocityX(speed);
    }


    private updateHitbox(state: "idle" | "walk" | "jump" | "fall" | "run") {
        switch (state) {
            case "idle":
                this.body.setSize(32, 35);
                this.body.setOffset(32, 25);
                break;

            case "walk":
                this.body.setSize(32, 35);
                this.body.setOffset(32, 25);
                break;

            case "run":
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

    stopMoving() {
        this.isMoving = false;
        this.isRunning = false;
        this.setVelocityX(0);
        this.play("idle", true);
    }

    attack(){
        this.battleMode = true;
        const number = this.numberAnim[Math.floor(Math.random() * this.numberAnim.length)];
        console.log(number);
        this.play(`attack_${number}`, true);
        this.once(`animationcomplete-attack_${number}`, () => {
            this.battleMode = false;
        });
    };

    jump() {
        if (this.body.blocked.down || this.body.touching.down) {
            this.targetX += 100;
            this.setVelocityY(-450);
            this.isJumping = true;
            this.play("jump_up", true);
            this.updateHitbox("jump");
        }
    }
}
