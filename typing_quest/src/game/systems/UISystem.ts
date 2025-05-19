import { Scene, GameObjects } from "phaser";
import { ScoreManager } from "@/game/systems/ScoreManager";

export class UISystem {
    private scene: Scene;
    private statsText!: GameObjects.Text;
    private pauseMenu!: GameObjects.DOMElement;
    private completionWindow!: GameObjects.DOMElement;
    private symbolContainer!: GameObjects.Container;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    // ===== Система статистики =====
    public createStatsDisplay() {
        const interfaceHeight = this.scene.scale.height * 0.4;
        const interfaceY = this.scene.scale.height - interfaceHeight;

        // Фон статистики
        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            interfaceY - 40,
            350,
            40,
            0x333333,
            0.8
        )
        .setScrollFactor(0)
        .setDepth(99);

        // Текст статистики
        this.statsText = this.scene.add.text(
            this.scene.scale.width / 2, 
            interfaceY - 50, 
            "", 
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                padding: { x: 10, y: 5 },
                align: "center",
            }
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(100);
    }

    public updateStatsDisplay(scoreManager: ScoreManager) {
        if (!this.statsText) return;

        this.statsText.setText(
            [
                `Точность: ${scoreManager.getAccuracy().toFixed(1)}%`,
                `Правильно: ${scoreManager.getCorrectCount()}`,
                `Ошибки: ${scoreManager.getIncorrectCount()}`,
                `Всего: ${scoreManager.getTotalCount()}`,
            ].join("  |  ")
        );
    }

    // ===== Система паузы =====
    public createPauseSystem(
        togglePause: () => void, 
        toggleAudio: () => void,
        returnToMap: () => void
    ) {
        const pauseButton = this.scene.add
            .image(window.innerWidth / 7, 140, "pause_button")
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(10000)
            .setScale(5)
            .on("pointerdown", togglePause);

        this.pauseMenu = this.scene.add
            .dom(this.scene.scale.width / 2, this.scene.scale.height / 2)
            .createFromHTML(`
                <div style="background: rgba(0,0,0,0.8); border-radius:10px; padding:20px; text-align:center; width:300px;">
                    <button id="toggleSound" style="background:none; border:none; color:white; font-size:24px; cursor:pointer; margin-bottom:20px;">🔊</button>
                    <button id="resumeGame" style="background:#4CAF50; color:white; border:none; padding:10px 20px; margin:10px; cursor:pointer; width:80%;">Продолжить</button>
                    <button id="returnToMap" style="background:#f44336; color:white; border:none; padding:10px 20px; margin:10px; cursor:pointer; width:80%;">Вернуться на карту</button>
                </div>
            `)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);

        const toggleSoundBtn = this.pauseMenu.getChildByID("toggleSound");
        const resumeBtn = this.pauseMenu.getChildByID("resumeGame");
        const returnBtn = this.pauseMenu.getChildByID("returnToMap");

        toggleSoundBtn?.addEventListener("click", toggleAudio);
        resumeBtn?.addEventListener("click", togglePause);
        returnBtn?.addEventListener("click", returnToMap);
    }

    public setPauseMenuVisible(visible: boolean) {
        this.pauseMenu?.setVisible(visible);
    }

    // ===== Интерфейс ввода =====
    public createInputInterface() {
        const interfaceHeight = this.scene.scale.height * 0.4;
        const interfaceY = this.scene.scale.height - interfaceHeight;

        this.scene.add
            .image(
                this.scene.scale.width / 2,
                interfaceY + interfaceHeight / 2,
                "input_bg"
            )
            .setDisplaySize(800, 120)
            .setDepth(101)
            .setScrollFactor(0);

        this.symbolContainer = this.scene.add
            .container(this.scene.scale.width / 2, interfaceY + interfaceHeight / 2)
            .setDepth(102)
            .setScrollFactor(0);
    }

    public updateSymbolDisplay(
        fullSequence: string[],
        currentInputIndex: number
    ) {
        this.symbolContainer.removeAll(true);

        const symbolStyle = {
            fontSize: "32px",
            fontFamily: "Arial",
            color: "#777777",
        };
        const currentStyle = {
            ...symbolStyle,
            color: "#000000",
            fontWeight: "bold",
        };
        const pastStyle = { ...symbolStyle, color: "#CC2D39" };

        const symbolSpacing = 36;
        let xPosition = 0;

        // Прошлые символы
        const pastStart = Math.max(0, currentInputIndex - 9);
        fullSequence
            .slice(pastStart, currentInputIndex)
            .forEach((symbol) => {
                this.symbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, pastStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        // Текущий символ
        if (currentInputIndex < fullSequence.length) {
            this.symbolContainer.add(
                this.scene.add
                    .text(
                        xPosition,
                        0,
                        fullSequence[currentInputIndex],
                        currentStyle
                    )
                    .setOrigin(0.5)
            );
            xPosition += symbolSpacing;
        }

        // Будущие символы
        fullSequence
            .slice(
                currentInputIndex + 1,
                currentInputIndex + 1 + (19 - (currentInputIndex - pastStart + 1))
            )
            .forEach((symbol) => {
                this.symbolContainer.add(
                    this.scene.add
                        .text(xPosition, 0, symbol, symbolStyle)
                        .setOrigin(0.5)
                );
                xPosition += symbolSpacing;
            });

        this.symbolContainer.x = this.scene.scale.width / 2 - symbolSpacing * 9;
    }

    // ===== Окно результатов =====
    public showResultsWindow(stats: any, onComplete: () => void) {
        this.completionWindow = this.scene.add
            .dom(this.scene.scale.width / 2, this.scene.scale.height / 2)
            .createFromHTML(`
                <div style="background:rgba(0,0,0,0.9); border:2px solid #4CAF50; border-radius:10px; color:white; padding:20px; text-align:center; width:500px;">
                    <h2>Уровень пройден!</h2>
                    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                        <div style="text-align: left;">
                            <p>Время: ${stats.time}</p>
                            <p>Точность: ${stats.accuracy}%</p>
                            <p>Скорость: ${stats.speed} сим/сек</p>
                            <p style="font-size: 24px; font-weight: bold; margin-top: 10px;">Очки: ${stats.score}</p>
                        </div>
                        <div>
                            <img src="${stats.chart}" style="width: 200px; height: 100px; background: white;" />
                            <p style="font-size: 12px; margin-top: 5px;">График скорости печати</p>
                        </div>
                    </div>
                    <button id="nextLevelBtn" style="background:#4CAF50; color:white; border:none; padding:10px 20px; margin-top:15px; cursor:pointer; border-radius:5px;">На карту</button>
                </div>
            `)
            .setOrigin(0.5)
            .setDepth(10000)
            .setScrollFactor(0);

        this.completionWindow
            .getChildByID("nextLevelBtn")
            ?.addEventListener("click", onComplete);
    }

    public createSpeedChart(history: any[]): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;

        if (history.length === 0) return canvas;

        // Настройки графика
        const padding = 20;
        const graphWidth = canvas.width - 2 * padding;
        const graphHeight = canvas.height - 2 * padding;

        // Находим максимальные значения
        const maxTime = Math.max(...history.map((h) => h.time));
        const maxSpeed = Math.max(...history.map((h) => h.speed), 1);

        // Рисуем оси
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Подписи осей
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px Arial";
        ctx.fillText("Скорость (симв/сек)", padding + 5, padding + 10);
        ctx.fillText("Время (сек)", canvas.width - 40, canvas.height - 5);

        // Рисуем график
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 2;
        ctx.beginPath();

        history.forEach((point, i) => {
            const x = padding + (point.time / maxTime) * graphWidth;
            const y = canvas.height - padding - (point.speed / maxSpeed) * graphHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        return canvas;
    }

    public cleanup() {
        this.pauseMenu?.destroy();
        this.completionWindow?.destroy();
        this.symbolContainer?.destroy();
    }
}