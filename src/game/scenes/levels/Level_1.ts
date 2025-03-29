import { Scene, GameObjects, Tilemaps, Sound } from "phaser";
import { Character } from "../Character";

export class Level_1 extends Scene {
    private backgroundMusic: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private character: Character;
    private symbols: string[] = ["a", "s", "d", "f", "h", "j", "k", "l"]; // Массив символов
    private currentInputIndex: number = 0; // Индекс текущего символа
    private inputDisplay: Phaser.GameObjects.Text; // Текстовый объект для ввода
    private inputBox: Phaser.GameObjects.Rectangle; // Прямоугольник интерфейса

    background: GameObjects.Image;
    backgroundLayer: Tilemaps.Layer;
    map: Tilemaps.Tilemap;

    constructor() {
        super("Level_1");
    }

    create() {
        // Задний фон
        this.background = this.add.image(0, 0, "Level_1_bg").setOrigin(0, 0);
        this.background.setDisplaySize(this.scale.width, this.scale.height);
        this.background.setScrollFactor(0);

        // Карта уровня
        this.map = this.make.tilemap({ key: "Level_1_map" });
        const decors = this.map.addTilesetImage("2", "decors_Level_1");
        const tileset = this.map.addTilesetImage("1", "tiles_Level_1");

        const backgroundLayer = this.map.createLayer("bg", [decors, tileset], 0, 0);
        const collidersLayer = this.map.createLayer("main", tileset, 0, 0);
        
        collidersLayer.setDepth(1);
        backgroundLayer.setDepth(1);
        collidersLayer.setCollisionByExclusion([-1]);

        const mapHeight = this.map.heightInPixels;
        const scaleRatio = this.scale.height / mapHeight;
        collidersLayer.setScale(scaleRatio);
        backgroundLayer.setScale(scaleRatio);

        // Создаём персонажа
        this.character = new Character(this, 100, 200, "character");

        // Камера
        this.cameras.main.startFollow(this.character);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        // Границы мира
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        // Коллизии
        this.physics.add.collider(this.character, collidersLayer);

        // Музыка
        this.backgroundMusic = this.sound.add("backgroundMusic", { loop: true });
        this.backgroundMusic.play();

        const pauseButton = this.add.text(16, 16, "Pause Music", { fontSize: "18px", color: "#ffffff" })
            .setScrollFactor(0)
            .setDepth(20)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.toggleAudio());

        // Интерфейс
        this.createInputInterface();

        // Генерация случайных символов
        const symbolCount = Math.floor(this.scale.width / 32); // Количество символов по ширине
        this.symbols = this.generateRandomSymbols(symbolCount);

        // Обновление интерфейса ввода
        this.updateInputDisplay();

        // Обработка ввода
        this.input.keyboard.on("keydown", (event: KeyboardEvent) => this.handleInput(event));
    }

    update() {
        this.character.handleMovement();
    }

    // Функция для генерации случайных символов
    generateRandomSymbols(length: number): string[] {
        const randomSymbols = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * this.symbols.length);
            randomSymbols.push(this.symbols[randomIndex]);
        }
        return randomSymbols;
    }

    createInputInterface() {
        this.updateInputInterface();
    
        // Обновляем интерфейс при изменении размера экрана или зума камеры
        this.scale.on("resize", () => this.updateInputInterface());
        this.cameras.main.on("zoom", () => this.updateInputInterface());
    } 
    
    updateInputInterface() {
        const camera = this.cameras.main;
        const view = camera.worldView; // Получаем область видимости камеры
        const boxHeight = view.height / 3; // Теперь зависит от области камеры
        const screenWidth = view.width;
    
        if (this.inputBox) this.inputBox.destroy();
        if (this.inputDisplay) this.inputDisplay.destroy();
    
        // Прямоугольный блок интерфейса
        this.inputBox = this.add.rectangle(
            view.x, view.bottom - boxHeight, 
            screenWidth, boxHeight, 
            0x000000
        ).setOrigin(0, 0).setDepth(10);
    
        // Динамический размер шрифта (не менее 24px)
        const fontSize = Math.max(24, screenWidth / (this.symbols.length * 10));
    
        // Текст
        this.inputDisplay = this.add.text(
            view.centerX,
            this.inputBox.y + boxHeight / 2,
            "",
            { fontSize: `${fontSize}px`, color: "#ffffff", align: "center" }
        ).setOrigin(0.5, 0.5).setDepth(11);
    
        this.inputBox.setScrollFactor(0);
        this.inputDisplay.setScrollFactor(0);
    }
    

    updateInputDisplay() {
        const spacing = "  ";  // Пробел для равномерного распределения символов
        const displayText = this.symbols
            .map((char, index) => (index < this.currentInputIndex ? `[${char}]` : char))
            .join(spacing);
        this.inputDisplay.setText(displayText);
    }

    handleInput(event: KeyboardEvent) {
        const expectedChar = this.symbols[this.currentInputIndex];
        
        // Проверяем, соответствует ли введенный символ ожидаемому
        if (event.key === expectedChar) {
            // Если введенный символ правильный, увеличиваем индекс
            this.currentInputIndex++;
    
            // Сдвигаем символы (удаляем первый символ и добавляем новый)
            this.symbols.push(this.generateRandomSymbols(1)[0]); // Добавляем новый символ в конец
    
            // Даем команду персонажу начать двигаться
            this.character.startMoving();
        } else {
            // Ошибка: можно добавить эффект или звук для неправильного ввода
        }
    
        // Обновление отображения текста
        this.updateInputDisplay();
    }
    

    private toggleAudio() {
        if (this.isAudioPlaying) {
            this.backgroundMusic.pause();
            this.isAudioPlaying = false;
        } else {
            this.backgroundMusic.resume();
            this.isAudioPlaying = true;
        }
    }
}
