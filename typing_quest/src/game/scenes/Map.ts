import { Scene, GameObjects } from 'phaser';

export class Map extends Scene {
    private levelNodes: GameObjects.Graphics[] = [];
    private readonly levelPositions = [
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.45 },
        { x: 0.5, y: 0.7 },
        { x: 0.7, y: 0.35 },
        { x: 0.9, y: 0.5 },
    ];

    constructor() {
        super('Map');
    }

    create() {
        const { width: screenWidth, height: screenHeight } = this.scale;

        this.levelPositions.forEach((pos, index) => {
            // Создание круга уровня
            const node = this.createLevelNode(pos, screenWidth, screenHeight);
            node.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectLevel(index + 1));
            this.levelNodes.push(node);

            // Создание пунктирной линии к следующему узлу, если он существует
            if (index < this.levelPositions.length - 1) {
                const nextPos = this.levelPositions[index + 1];
                this.addDottedLine(
                    this.getPosition(pos, screenWidth, screenHeight),
                    this.getPosition(nextPos, screenWidth, screenHeight)
                );
            }
        });

        // Обработчик изменения размера экрана
        this.scale.on('resize', this.onResize, this);
    }

    // Функция для создания круга уровня
    private createLevelNode(pos: { x: number; y: number }, screenWidth: number, screenHeight: number) {
        const { x, y } = this.getPosition(pos, screenWidth, screenHeight);
        const radius = screenWidth * 0.04; // Размер круга, 3% от ширины экрана

        return this.add.circle(x, y, radius, 0x1e90ff).setStrokeStyle(2, 0x602b2c);
    }

    // Функция для добавления пунктирной линии между уровнями
    private addDottedLine(start: { x: number; y: number }, end: { x: number; y: number }) {
        const line = this.add.graphics();
        line.lineStyle(2, 0x602b2c, 1);

        const distance = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
        const dashSize = 10;
        const gapSize = 5;

        for (let i = 0; i < distance; i += dashSize + gapSize) {
            const progress = i / distance;
            const x = Phaser.Math.Interpolation.Linear([start.x, end.x], progress);
            const y = Phaser.Math.Interpolation.Linear([start.y, end.y], progress);
            line.fillCircle(x, y, 2); // Точки для пунктирной линии
        }

        line.strokePath();
    }

    // Обработчик выбора уровня
    private selectLevel(level: number) {
        console.log(`Переход к уровню ${level}`);
        this.scene.start('LevelPreloader', { targetLevel: `Level_${level}` });
    }

    // Обработчик изменения размера экрана
    private onResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Перерасчёт положения и радиуса узлов уровня
        this.levelNodes.forEach((node, index) => {
            const pos = this.getPosition(this.levelPositions[index], width, height);
            node.setPosition(pos.x, pos.y);
        });
    }

    // Функция для преобразования относительных позиций в координаты на экране
    private getPosition(pos: { x: number; y: number }, screenWidth: number, screenHeight: number) {
        return {
            x: pos.x * screenWidth,
            y: pos.y * screenHeight,
        };
    }
}
