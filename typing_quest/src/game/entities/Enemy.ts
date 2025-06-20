import { Physics, Scene } from "phaser";

export class Enemy extends Physics.Arcade.Sprite {
    public isAlive: boolean = true;
    private bodyWidth: number;
    private bodyHeight: number;
    private currentDirection: number = -1;
    private patrolDistance: number;
    private startX: number;
    private moveSpeed: number;
    private isPatrolling: boolean = true;
    private patrolTimer: Phaser.Time.TimerEvent | null = null;
    private isInBattle: boolean = false;
    private isTakingHit: boolean = false;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        private type: string,
        private config: any
    ) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.startX = x;
        this.moveSpeed = config.speed;
        this.patrolDistance = config.patrolDistance;
        this.bodyWidth = this.config.bodyWidth || this.config.frameWidth * 0.6;
        this.bodyHeight =
            this.config.bodyHeight || this.config.frameHeight * 0.8;
        this.setScale(0.8);
        this.y -= 40;
        this.setSize(this.bodyWidth, this.bodyHeight).setOffset(
            (this.config.frameWidth - this.bodyWidth) / 2,
            this.config.frameHeight - this.bodyHeight
        );

        scene.time.delayedCall(0, () => {
            this.setGravityY(this.config.gravity);
            this.setCollideWorldBounds(true);
            this.setImmovable(true);
            this.startPatrol();
        });
    }

    private startPatrol() {
        if (!this.isAlive || this.isInBattle) return;
        this.isPatrolling = true;
        this.setVelocityX(this.moveSpeed * this.currentDirection);

        if (this.config.animations?.walk) {
            this.play(`enemy_${this.type}_walk`);
        }
        this.patrolTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.isAlive || !this.isPatrolling) return;
                if (Math.abs(this.x - this.startX) >= this.patrolDistance) {
                    this.stopAndWait();
                }
            },
            loop: true,
        });
    }
    private stopAndWait() {
        if (this.isInBattle) return;

        this.isPatrolling = false;
        if (this.config.animations?.idle) {
            this.play(`enemy_${this.type}_idle`);
        }
        this.setVelocityX(0);

        this.scene.time.delayedCall(2000, () => {
            if (!this.isAlive || this.isInBattle) return;
            this.currentDirection *= -1;
            this.startX = this.x;
            this.startPatrol();
        });
    }
    update() {
        if (!this.isAlive) return;

        if (!this.isInBattle) {
            this.setFlipX(this.currentDirection > 0);
        }    
    }

    public takeDamage() {
        if (!this.isAlive) return;

        this.isAlive = false;
        this.setVelocity(0, -200);
        this.setRotation(0.1);
        this.setAlpha(0.7);

        this.scene.time.delayedCall(1000, () => {
            this.destroy();
        });
    }

    public playAttackAnimation() {
        if (!this.isAlive) return;
        
        if (this.config.animations?.attack) {
            this.play(`enemy_${this.type}_attack`, true);
        }
        
        this.scene.time.delayedCall(500, () => {
            if (this.config.animations?.idle) {
                this.play(`enemy_${this.type}_idle`, true);
            }
        });
    }

    public takeHit() {
        if (!this.isAlive || this.isTakingHit) return;
        
        this.isTakingHit = true;
        
        if (this.config.animations?.hit) {
            this.play(`enemy_${this.type}_hit`, true);
        }
        
        this.scene.time.delayedCall(300, () => {
            this.isTakingHit = false;
            if (this.config.animations?.idle) {
                this.play(`enemy_${this.type}_idle`, true);
            }
        });
    }

    public stopForBattle(characterX: number) {
        this.isInBattle = true;
        this.isPatrolling = false;
        this.setDepth(3);
        this.faceTo(characterX);
        if (this.config.animations?.idle) {
            this.play(`enemy_${this.type}_idle`);
        }
        this.setVelocityX(0);

        if (this.patrolTimer) {
            this.patrolTimer.destroy();
            this.patrolTimer = null;
        }
    }
    public faceTo(targetX: number) {
        const direction = targetX > this.x ? 1 : -1;
        this.setFlipX(direction > 0);
        this.currentDirection = direction;
    }
}
