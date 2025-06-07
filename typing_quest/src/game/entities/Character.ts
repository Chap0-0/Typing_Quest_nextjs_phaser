import { Scene, Physics } from "phaser";
import { Level } from "../scenes/Level";

export class Character extends Physics.Arcade.Sprite {
    private isMoving: boolean = false;
    private isRunning: boolean = false;
    private walkSpeed: number = 50;
    private runSpeed: number = 100;
    private runThreshold: number = 80;
    private targetX = this.x;
    private numberAnim: number[]= [1,2,3];
    private battleMode: boolean = false;
    private attackCooldown: boolean = false;
    private lives: number = 5;
    private isTakingDamage: boolean = false;
    private isJumping: boolean = false;
    private isAutoJumping: boolean = false;
    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.8);
        this.setDepth(100);

        this.body.setGravityY(500);
        this.setMaxVelocity(400, 800);

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

        scene.load.spritesheet("die", "assets/character/DEATH.png", {
            frameWidth: 96,
            frameHeight: 60,
        });
    }

    static createAnimations(scene: Scene) {
        scene.anims.create({
            key: "idle",
            frames: scene.anims.generateFrameNumbers("idle", {
                start: 0,
                end: 6,
            }),
            frameRate: 10,
        });

        scene.anims.create({
            key: "walk",
            frames: scene.anims.generateFrameNumbers("walk", {
                start: 0,
                end: 7,
            }),
            frameRate: 10,
        });

        scene.anims.create({
            key: "jump_up",
            frames: scene.anims.generateFrameNumbers("jump", {
                start: 0,
                end: 2,
            }),
            frameRate: 15,
            repeat: 0,
        });

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

        scene.anims.create({
            key: "die",
            frames: scene.anims.generateFrameNumbers("die", {
                start: 0,
                end: 11,
            }),
            frameRate: 15,
        });

    }

    public setTargetXZero(){
        this.targetX = this.x;
    }

    updateState() {
        const isOnGround = this.body.blocked.down || this.body.touching.down;

        if (isOnGround) {
            this.isJumping = false;
            const distanceToTarget = this.targetX - this.x;
            if (this.isMoving) {
                this.isRunning = distanceToTarget > this.runThreshold;
                
                this.play(this.isRunning ? "run" : "walk", true);
                
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
        
        if (!this.isJumping) {
            const speed = this.isRunning ? this.runSpeed : this.walkSpeed;
            this.setVelocityX(speed);
        } else {
            const currentVelocityX = this.body.velocity.x;
            const direction = distanceToAdd > 0 ? 1 : -1;
            const newVelocityX = (this.isRunning ? this.runSpeed : this.walkSpeed) * direction;
            
            if (Math.abs(currentVelocityX) < Math.abs(newVelocityX)) {
                this.setVelocityX(newVelocityX);
            }
        }
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

    attack() {
        if (this.attackCooldown) return;
        
        this.battleMode = true;
        this.attackCooldown = true;
        
        const number = this.numberAnim[Math.floor(Math.random() * this.numberAnim.length)];
        this.play(`attack_${number}`, true);
        
        this.once(`animationcomplete-attack_${number}`, () => {
            this.battleMode = false;
            this.attackCooldown = false;
        });
    }

    public autoJump() {
        if ((this.body.blocked.down || this.body.touching.down) && !this.isAutoJumping) {
            this.isAutoJumping = true;
            const newTargetX = this.x + 80;
            if (newTargetX > this.targetX) {
                this.targetX = newTargetX;
            }
            this.setVelocity(100, -200);
            this.isJumping = true;
            this.play("jump_up", true);
            this.updateHitbox("jump");

            this.scene.time.delayedCall(1000, () => {
                this.isAutoJumping = false;
            });
        }
    }
    public takeDamage() {
        if (this.isTakingDamage) return;
        
        this.isTakingDamage = true;
        this.lives = Math.max(0, this.lives - 1);
        
        this.setTint(0xff0000);
        this.scene.time.delayedCall(300, () => {
            this.clearTint();
            this.isTakingDamage = false;
        });
        
        if (this.lives < 1) {
            this.die();
        }
    }

    private die() {
        this.play("die", true);
        this.scene.time.delayedCall(2000, () => {
            if (this.scene instanceof Level) {
                this.scene.cleanupScene();
                this.scene.scene.start("Map");
            }
        });
    }
    
    public getLives(): number {
        return this.lives;
    }
}
