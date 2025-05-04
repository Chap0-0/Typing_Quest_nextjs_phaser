import { Scene, GameObjects, Tweens } from 'phaser';

export class Map extends Scene {
    private levelNodes: GameObjects.Sprite[] = [];
    private levelLabels: GameObjects.Text[] = [];
    private background: GameObjects.TileSprite;
    private clouds: GameObjects.TileSprite;
    private title: GameObjects.Text;
    private selectedNode: number = -1;
    private lockIcon: GameObjects.Sprite;

    private readonly levelConfig = [
        { x: 0.2, y: 0.3, name: "Уровень 1", locked: false },
        { x: 0.4, y: 0.5, name: "Уровень 2", locked: true },
        { x: 0.6, y: 0.3, name: "Уровень 3", locked: true },
        { x: 0.8, y: 0.5, name: "Уровень 4", locked: true }
    ];

    constructor() {
        super('Map');
    }

    preload() {
        this.load.image('mapBackground', 'assets/intro/intro-bg.png');
        this.load.image('clouds', 'assets/intro/intro-bg-clouds.png');
        this.load.image('levelIcon', 'assets/intro/logo.png');
        this.load.image('levelLocked', 'assets/intro/logo.png');
    }

    create() {
        // Фон с параллакс-эффектом
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'mapBackground')
            .setOrigin(0, 0)
            .setScrollFactor(0);

        this.clouds = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'clouds')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setAlpha(0.7);

        // Заголовок
        this.title = this.add.text(this.scale.width/2, 80, 'Выберите уровень', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, fill: true }
        }).setOrigin(0.5);

        // Создание узлов уровней
        this.levelConfig.forEach((config, index) => {
            const { x, y } = this.getPosition(config.x, config.y);
            const node = this.add.sprite(x, y, 'levelIcon')
                .setScale(0.5)
                .setInteractive({ useHandCursor: true })
                .setData('locked', config.locked);

            if (config.locked) {
                this.lockIcon = this.add.sprite(x, y, 'levelLocked').setScale(0.5);
                node.setTint(0x666666);
            }

            // Анимация при наведении
            node.on('pointerover', () => this.hoverNode(node, index));
            node.on('pointerout', () => this.unhoverNode(node, index));
            node.on('pointerdown', () => this.selectLevel(index));

            // Метка уровня
            const label = this.add.text(x, y + 60, config.name, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: config.locked ? '#888888' : '#ffffff',
                align: 'center',
                wordWrap: { width: 150, useAdvancedWrap: true }
            }).setOrigin(0.5).setAlpha(0);

            this.levelNodes.push(node);
            this.levelLabels.push(label);
        });


        // Анимация появления
        this.tweens.add({
            targets: this.levelNodes,
            scale: { from: 0, to: 0.5 },
            duration: 600,
            ease: 'Back.out',
            stagger: 150
        });

        this.tweens.add({
            targets: this.levelLabels,
            alpha: { from: 0, to: 1 },
            duration: 800,
            delay: 1000
        });

        // Параллакс-эффект
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.background.tilePositionX = pointer.x * 0.02;
            this.background.tilePositionY = pointer.y * 0.02;
            this.clouds.tilePositionX = pointer.x * 0.05;
        });
    }

    update() {
        // Плавное движение облаков
        this.clouds.tilePositionX += 0.2;
    }

    private hoverNode(node: GameObjects.Sprite, index: number) {
        if (node.getData('locked')) return;

        this.tweens.add({
            targets: node,
            scale: 0.6,
            duration: 200,
            ease: 'Sine.out'
        });

        this.tweens.add({
            targets: this.levelLabels[index],
            y: this.levelLabels[index].y + 10,
            duration: 200,
            ease: 'Sine.out'
        });
    }

    private unhoverNode(node: GameObjects.Sprite, index: number) {
        if (node.getData('locked')) return;

        this.tweens.add({
            targets: node,
            scale: 0.5,
            duration: 200,
            ease: 'Sine.in'
        });

        this.tweens.add({
            targets: this.levelLabels[index],
            y: this.levelLabels[index].y - 10,
            duration: 200,
            ease: 'Sine.in'
        });
    }

    private selectLevel(index: number) {
        const node = this.levelNodes[index];
        
        if (node.getData('locked')) {
            // Анимация заблокированного уровня
            this.tweens.add({
                targets: node,
                x: '+=10',
                yoyo: true,
                duration: 80,
                repeat: 3
            });
            return;
        }

        this.selectedNode = index;
        
        // Анимация выбора
        this.tweens.add({
            targets: node,
            scale: 0.7,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                this.scene.start('LevelPreloader', { 
                    targetLevel: `Level_${index + 1}`,
                    levelName: this.levelConfig[index].name
                });
            }
        });
    }

    private getPosition(relX: number, relY: number) {
        return {
            x: relX * this.scale.width,
            y: relY * this.scale.height
        };
    }
}