import { Scene, Tilemaps, GameObjects } from 'phaser';

export class Intro extends Scene {
    logo: GameObjects.Image;
    startButton: GameObjects.Container;
    aboutButton: GameObjects.Container;
    map: Tilemaps.Tilemap;
    tileset: Tilemaps.Tileset;
    backgroundLayer: Tilemaps.Layer;
    bg_clouds_1: GameObjects.Image;  // Первое изображение облаков
    bg_clouds_2: GameObjects.Image;  // Второе изображение облаков
    
    constructor() {
        super('Intro');
    }

    create() {
        this.map = this.make.tilemap({ key: 'intro-bg-map' });
        this.tileset = this.map.addTilesetImage('1', 'intro-tiles');

        this.backgroundLayer = this.map.createLayer("main", this.tileset, 0, 0).setDepth(2);
        this.backgroundLayer_2 = this.map.createLayer("background", this.tileset, 0, 0).setDepth(1);

        console.log(this.tileset);

        // Вычисляем соотношение для масштабирования карты по ширине
        const mapWidth = this.map.widthInPixels;
        const scaleRatio = this.scale.width / mapWidth;
        this.backgroundLayer.setScale(scaleRatio); // Масштабируем по ширине экрана
        this.backgroundLayer_2.setScale(scaleRatio);
        
        // Фоновое изображение
        const bg_sky = this.add.image(0, 0, 'bg-sky').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
        this.bg_clouds_1 = this.add.image(0, 0, 'bg-clouds').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
        this.bg_clouds_2 = this.add.image(this.scale.width, 0, 'bg-clouds').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        const bg_mounts = this.add.image(0, 0, 'bg-mounts').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Логотип с адаптивным размером
        this.logo = this.add.image(this.scale.width / 2, this.scale.height / 4, 'logo').setOrigin(0.5).setDepth(2);
        this.resizeLogo();  // Устанавливаем размер логотипа

        // Кнопка "Начать"
        this.startButton = this.createButton(this.scale.width / 2, this.logo.y + 250, 'Начать', () => {
            this.scene.start('Map');
        }).setDepth(3);

        // Кнопка "О проекте"
        this.aboutButton = this.createButton(this.scale.width / 2, this.startButton.y + 100, 'О проекте', () => {
            window.open('/about', '_blank');
        }).setDepth(3);

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
    update() {
        const cloudSpeed = 0.2;
        // Двигаем оба изображения облаков вправо
        this.bg_clouds_1.x += cloudSpeed;
        this.bg_clouds_2.x += cloudSpeed;

        // Если первое изображение полностью вышло за экран справа, перемещаем его за второе
        if (this.bg_clouds_1.x >= this.scale.width) {
            this.bg_clouds_1.x = this.bg_clouds_2.x - this.scale.width;
        }

        // Если второе изображение полностью вышло за экран справа, перемещаем его за первое
        if (this.bg_clouds_2.x >= this.scale.width) {
            this.bg_clouds_2.x = this.bg_clouds_1.x - this.scale.width;
        }
    }
    resizeLogo() {
        const logoScale = this.scale.width * 0.3;  // Логотип будет занимать 30% ширины экрана
        this.logo.setDisplaySize(logoScale, this.logo.height * (logoScale / this.logo.width));
    }

    resize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Перемещаем элементы при изменении размера экрана
        this.logo.setPosition(width / 2, height / 4);
        this.resizeLogo();  // Пересчитываем размер логотипа

        this.startButton.setPosition(width / 2, this.logo.y + 250);
        this.aboutButton.setPosition(width / 2, this.startButton.y + 100);
    }
}
