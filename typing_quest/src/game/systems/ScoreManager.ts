import { Scene } from "phaser";

// ScoreManager.ts
export class ScoreManager {
    private startTime: number;
    private endTime: number;
    private correctChars: number = 0;
    private incorrectChars: number = 0;
    private totalChars: number = 0;
    private typingSpeedHistory: { time: number; speed: number }[] = [];
    private lastKeyTime: number;
    private lastRecordedTime: number = 0;

    constructor(private scene: Scene) {
        this.startTime = Date.now();
        this.lastKeyTime = this.startTime;
    }

    public recordCorrectChar(isBattle: boolean = false) {
        const now = Date.now();
        // Игнорируем слишком быстрые повторные нажатия
        if (now - this.lastRecordedTime < 50) return;

        this.lastRecordedTime = now;
        this.correctChars++;
        this.totalChars++;
        this.recordTypingSpeed();
    }

    public recordIncorrectChar(isBattle: boolean = false) {
        const now = Date.now();
        if (now - this.lastRecordedTime < 50) return;

        this.lastRecordedTime = now;
        this.incorrectChars++;
        this.totalChars++;
    }

    public getAccuracy(): number {
        return this.totalChars > 0 ? (this.correctChars / this.totalChars) * 100 : 0;
    }

    // Добавляем методы для получения раздельной статистики
    public getBattleAccuracy(): number {
        return this.battleTotal > 0
            ? (this.battleCorrect / this.battleTotal) * 100
            : 0;
    }

    public getMovementAccuracy(): number {
        return this.movementTotal > 0
            ? (this.movementCorrect / this.movementTotal) * 100
            : 0;
    }

    private recordTypingSpeed() {
        const now = Date.now();
        const timeDiff = (now - this.lastKeyTime) / 1000; // в секундах
        const speed = 1 / timeDiff; // символы в секунду

        this.typingSpeedHistory.push({
            time: (now - this.startTime) / 1000,
            speed: speed,
        });

        this.lastKeyTime = now;
    }

    public completeLevel() {
        this.endTime = Date.now();
    }

    public getAverageSpeed(): number {
        if (this.typingSpeedHistory.length === 0) return 0;
        const sum = this.typingSpeedHistory.reduce(
            (acc, curr) => acc + curr.speed,
            0
        );
        return sum / this.typingSpeedHistory.length;
    }

    public getTimeTaken(): number {
        return ((this.endTime || Date.now()) - this.startTime) / 1000;
    }

    public getTimeFormatted(): string {
        const seconds = Math.floor(this.getTimeTaken());
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }

    public calculateScore(): number {
        const timeTaken = this.getTimeTaken();
        const accuracy = this.getAccuracy() / 100;
        const speed = this.getAverageSpeed();

        // Базовые очки за правильные символы
        let score = this.correctChars * 10;

        // Бонус за скорость (чем быстрее, тем больше бонус)
        score += speed * 50;

        // Бонус за точность
        score *= accuracy;

        // Бонус за время (чем быстрее прошел уровень, тем больше бонус)
        const timeBonus = Math.max(0, 300 - timeTaken) * 5; // 300 секунд (5 минут) - максимальное время для бонуса
        score += timeBonus;

        return Math.floor(score);
    }

    public getTypingSpeedHistory() {
        return this.typingSpeedHistory;
    }

    public getCorrectCount(): number {
        return this.correctChars;
    }

    public getIncorrectCount(): number {
        return this.incorrectChars;
    }

    public getTotalCount(): number {
        return this.totalChars;
    }

}
