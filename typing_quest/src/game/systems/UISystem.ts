import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

interface SequenceDisplayConfig {
    position: { x: number; y: number };
    style: {
        normal: Phaser.Types.GameObjects.Text.TextStyle;
        current: Phaser.Types.GameObjects.Text.TextStyle;
        completed: Phaser.Types.GameObjects.Text.TextStyle;
    };
}

export class UISystem {
    private mainSequence: GameObjects.Container;
    private battleSequence: GameObjects.Container;
    private battleBackground: GameObjects.Rectangle;

    constructor(
        private scene: Scene,
        private config: {
            mainSequence: SequenceDisplayConfig;
            battleSequence: SequenceDisplayConfig;
        }
    ) {
        this.createMainUI();
        this.createBattleUI();
        this.setupEventListeners();
    }

    private createMainUI() {
        this.mainSequence = this.scene.add.container(
            this.config.mainSequence.position.x,
            this.config.mainSequence.position.y
        );
        
        // Добавляем фон для основного интерфейса
        const bg = this.scene.add.rectangle(0, 0, 800, 120, 0x333333, 0.7)
            .setOrigin(0.5);
        this.mainSequence.add(bg);
    }

    private createBattleUI() {
        this.battleBackground = this.scene.add.rectangle(
            this.config.battleSequence.position.x,
            this.config.battleSequence.position.y - 50,
            600, 80, 0x222222, 0.8
        ).setVisible(false);

        this.battleSequence = this.scene.add.container(
            this.config.battleSequence.position.x,
            this.config.battleSequence.position.y
        ).setVisible(false);
    }

    private setupEventListeners() {
        EventBus.on('sequence-update', (data: {
            type: 'main' | 'battle';
            sequence: string[];
            currentIndex: number;
        }) => {
            this.updateSequenceDisplay(
                data.type === 'main' ? this.mainSequence : this.battleSequence,
                data.sequence,
                data.currentIndex,
                data.type === 'main' 
                    ? this.config.mainSequence.style 
                    : this.config.battleSequence.style
            );
        });

        EventBus.on('battle-toggle', (visible: boolean) => {
            this.battleSequence.setVisible(visible);
            this.battleBackground.setVisible(visible);
            this.mainSequence.setVisible(!visible);
        });
    }

    private updateSequenceDisplay(
        container: GameObjects.Container,
        sequence: string[],
        currentIndex: number,
        style: SequenceDisplayConfig['style']
    ) {
        container.removeAll(true);

        const symbolSpacing = 36;
        let xPosition = -((sequence.length - 1) * symbolSpacing) / 2;

        sequence.forEach((symbol, index) => {
            let textStyle: Phaser.Types.GameObjects.Text.TextStyle;
            
            if (index < currentIndex) {
                textStyle = style.completed;
            } else if (index === currentIndex) {
                textStyle = style.current;
            } else {
                textStyle = style.normal;
            }

            const text = this.scene.add.text(xPosition, 0, symbol, textStyle)
                .setOrigin(0.5);
            
            container.add(text);
            xPosition += symbolSpacing;
        });
    }

    destroy() {
        EventBus.off('sequence-update');
        EventBus.off('battle-toggle');
    }
}