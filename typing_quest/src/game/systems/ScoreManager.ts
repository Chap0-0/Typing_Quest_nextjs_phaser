import { Scene } from "phaser";

export class ScoreManager {
    private startTime: number;
    private endTime: number;
    private correctChars: number = 0;
    private incorrectChars: number = 0;
    private totalChars: number = 0;
    private typingSpeedHistory: { time: number; speed: number }[] = [];
    private lastKeyTime: number;
    private lastRecordedTime: number = 0;
    private speedSamples: {time: number, cpm: number}[] = [];
    private lastSampleTime: number = 0;
    private correctCharsInSample: number = 0;
    private sampleInterval: number = 2000;
    private sampleStartTime: number = 0;

    constructor(private scene: Scene) {
        this.startTime = Date.now();
        this.lastKeyTime = this.startTime;
        this.sampleStartTime = this.startTime;
    }

public recordCorrectChar(isBattle: boolean = false) {
        const now = Date.now();
        if (now - this.lastRecordedTime < 50) return;

        this.lastRecordedTime = now;
        this.correctChars++;
        this.totalChars++;
        this.correctCharsInSample++;
        
        if (now - this.lastSampleTime >= this.sampleInterval) {
            const timeElapsed = (now - this.sampleStartTime) / 1000;
            const minutesElapsed = timeElapsed / 60;
            
            const cpm = this.correctCharsInSample / Math.max(minutesElapsed, 0.0167);
            
            this.speedSamples.push({
                time: (now - this.startTime) / 1000,
                cpm: cpm
            });
            
            this.correctCharsInSample = 0;
            this.lastSampleTime = now;
            this.sampleStartTime = now;
        }
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
        const timeDiff = (now - this.lastKeyTime) / 1000;
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
        if (this.speedSamples.length === 0) return 0;
        
        const sum = this.speedSamples.reduce((acc, curr) => acc + curr.cpm, 0);
        return sum / this.speedSamples.length;
    }

    public getSpeedHistory(): Array<{time: number, speed: number}> {
        return this.speedSamples.map(sample => ({
            time: sample.time,
            speed: sample.cpm
        }));
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
        const cpm = this.getAverageSpeed();
        const errorsCount = this.getIncorrectCount();
        
        const accuracyMultiplier = accuracy;
        const timeMultiplier = 1 + (1 - timeTaken / 180);
        const errorsPenalty = errorsCount * 5;

        const score = cpm * accuracyMultiplier * timeMultiplier - errorsPenalty;
        
        return Math.max(0, Math.round(score));
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
