import { Enemy } from "../entities/Enemy";
import { EventBus } from "../EventBus";

interface BattleConfig {
    sequences: string[];
    distance: number;
}

export class BattleSystem {
    private currentEnemy: Enemy | null = null;
    private currentSequence: string[] = [];
    private currentIndex = 0;
    private isActive = false;

    constructor(private config: BattleConfig) {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        EventBus.on('enemy-detected', (enemy: Enemy, characterPos: { x: number }) => {
            if (this.isInBattleRange(enemy, characterPos)) {
                this.startBattle(enemy);
            }
        });

        EventBus.on('battle-input', (key: string) => {
            if (this.isActive) this.processInput(key);
        });
    }

    private isInBattleRange(enemy: Enemy, characterPos: { x: number }): boolean {
        return Phaser.Math.Distance.Between(
            enemy.x, enemy.y,
            characterPos.x, enemy.y
        ) <= this.config.distance;
    }

    private startBattle(enemy: Enemy) {
        this.currentEnemy = enemy;
        this.isActive = true;
        this.currentSequence = this.generateSequence();
        this.currentIndex = 0;

        EventBus.emit('battle-toggle', true);
        EventBus.emit('sequence-update', {
            type: 'battle',
            sequence: this.currentSequence,
            currentIndex: this.currentIndex
        });

        // Оповещаем других о начале боя
        EventBus.emit('battle-state', { isActive: true, enemy });
    }

    private generateSequence(): string[] {
        const randomSeq = Phaser.Utils.Array.GetRandom(this.config.sequences);
        return randomSeq.replace(/_/g, '').split('');
    }

    private processInput(key: string) {
        if (key === this.currentSequence[this.currentIndex]) {
            this.currentIndex++;
            
            EventBus.emit('sequence-update', {
                type: 'battle',
                sequence: this.currentSequence,
                currentIndex: this.currentIndex
            });

            if (this.currentIndex >= this.currentSequence.length) {
                this.completeBattle(true);
            }
        }
    }

    private completeBattle(victory: boolean) {
        if (victory && this.currentEnemy) {
            EventBus.emit('enemy-defeated', this.currentEnemy);
        }

        this.reset();
        EventBus.emit('battle-toggle', false);
        EventBus.emit('battle-state', { isActive: false });
    }

    private reset() {
        this.currentEnemy = null;
        this.currentSequence = [];
        this.currentIndex = 0;
        this.isActive = false;
    }

    destroy() {
        EventBus.off('enemy-detected');
        EventBus.off('battle-input');
    }
}