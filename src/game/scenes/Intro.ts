import { Scene, Tilemaps, GameObjects } from 'phaser';

export class Intro extends Scene {
    logo: GameObjects.Image;
    startButton: GameObjects.Container;
    aboutButton: GameObjects.Container;
    background: GameObjects.Image;
    map: Tilemaps.Tilemap;
    tileset: Tilemaps.Tileset;
    backgroundLayer: Tilemaps.Layer;

    constructor() {
        super('Intro');
    }

    create() {
        this.map = this.make.tilemap({ key: 'intro-bg-map' });
        this.tileset = this.map.addTilesetImage('1', 'tiles');
        this.backgroundLayer = this.map.createLayer(1, this.tileset, 0, 0);
        this.backgroundLayer.setDisplaySize(this.scale.width, this.scale.height).setDepth(1);

        // Фоновое изображение
        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        // Логотип с адаптивным размером
        this.logo = this.add.image(this.scale.width / 2, this.scale.height / 4, 'logo').setOrigin(0.5).setDepth(2);
        this.resizeLogo();  // Устанавливаем размер логотипа

        // Кнопка "Начать"
        this.startButton = this.createButton(this.scale.width / 2, this.logo.y + 250, 'Начать', () => {
            this.scene.start('Map');
        }).setDepth(2);

        // Кнопка "О проекте"
        this.aboutButton = this.createButton(this.scale.width / 2, this.startButton.y + 100, 'О проекте', () => {
            window.open('/about', '_blank');
        }).setDepth(2);

        // Обработчик изменения размера экрана
        this.scale.on('resize', this.resize, this);
    }

    // Функция для создания кнопок
    createButton(x: number, y: number, text: string, callback: () => void): GameObjects.Container {
        const buttonBackground = this.add.rectangle(0, 0, 200, 60, 0xead4aa)
            .setStrokeStyle(2, 0x602b2c)
            .setOrigin(0.5);

        const buttonText = this.add.text(0, 0, text, {
            font: '24px Arial',
            color: '#602b2c',
        }).setOrigin(0.5);

        const button = this.add.container(x, y, [buttonBackground, buttonText]);
        button.setSize(200, 60);
        button.setInteractive({ useHandCursor: true })
            .on('pointerdown', callback);

        return button;
    }

    resizeLogo() {
        const logoScale = this.scale.width * 0.3;  // Логотип будет занимать 30% ширины экрана
        this.logo.setDisplaySize(logoScale, this.logo.height * (logoScale / this.logo.width));
    }

    resize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;
        this.background.setDisplaySize(width, height);

        // Перемещаем элементы при изменении размера экрана
        this.logo.setPosition(width / 2, height / 4);
        this.resizeLogo();  // Пересчитываем размер логотипа

        this.startButton.setPosition(width / 2, this.logo.y + 250);
        this.aboutButton.setPosition(width / 2, this.startButton.y + 100);
    }
}
