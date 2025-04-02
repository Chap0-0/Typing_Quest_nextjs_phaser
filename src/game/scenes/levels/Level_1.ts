import { Scene, GameObjects, Tilemaps, Sound } from "phaser";
import { Character } from "../Character";

export class Level_1 extends Scene {
    private backgroundMusic: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private character: Character;
    private symbols: string[] = ["a", "s", "d"," ", "f", "h", "j", "k", "l"];
    private currentInputIndex: number = 0;
    private inputDisplay: Phaser.GameObjects.Text;
    private inputBox: Phaser.GameObjects.Rectangle;
    private symbolBox: Phaser.GameObjects.Rectangle;
    private symbolContainer: Phaser.GameObjects.Container;
    private visibleSymbolsCount: number = 21;
    private maxLeftSymbols: number = 9;
    private maxRightSymbols: number = 9;

    background: GameObjects.Image;
    backgroundLayer: Tilemaps.Layer;
    map: Tilemaps.Tilemap;

    constructor() {
        super("Level_1");
    }

    create() {
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
        this.cameras.main.setZoom(1.3);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        // Границы мира
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        // Коллизии
        this.physics.add.collider(this.character, collidersLayer);

        // Музыка
        this.backgroundMusic = this.sound.add("backgroundMusic", { loop: true });
        this.backgroundMusic.play();

        const pauseButton = this.add.text(16, 16, "Pause Music", { 
            fontSize: "18px", 
            color: "#ffffff",
            fontFamily: "Arial"
        })
        .setScrollFactor(0)
        .setDepth(20)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.toggleAudio());

        this.symbols = this.generateSymbolSequence(this.visibleSymbolsCount);

        this.createInputInterface();

        // Обработка ввода
        this.input.keyboard.on("keydown", (event: KeyboardEvent) => this.handleInput(event));
    }

    update() {
        this.character.handleMovement();
    }

    generateSymbolSequence(length: number): string[] {
        const sequence = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * this.symbols.length);
            sequence.push(this.symbols[randomIndex]);
        }
        return sequence;
    }

    createInputInterface() {
        const interfaceHeight = this.scale.height * 0.4;
        const interfaceWidth = this.scale.width;
        const interfaceY = this.scale.height - interfaceHeight;

        this.inputBox = this.add.rectangle(
            0, interfaceY,
            interfaceWidth, interfaceHeight,
            0x000000, 0.7
        )
        .setOrigin(0, 0)
        .setDepth(100)
        .setScrollFactor(0);

        const symbolBoxWidth = 800; 
        const symbolBoxHeight = 80;
        this.symbolBox = this.add.rectangle(
            interfaceWidth / 2,
            interfaceY + interfaceHeight / 2,
            symbolBoxWidth,
            symbolBoxHeight,
            0xf0dccb
        )
        .setDepth(101)
        .setScrollFactor(0);

        // Контейнер для символов
        this.symbolContainer = this.add.container(
            interfaceWidth / 2,
            interfaceY + interfaceHeight / 2
        )
        .setDepth(102)
        .setScrollFactor(0);

        this.updateSymbolDisplay();
    }

    updateSymbolDisplay() {
        this.symbolContainer.removeAll(true);
    
        const symbolStyle = {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#777777'
        };
    
        const centerSymbolStyle = {
            ...symbolStyle,
            color: '#000000'
        };
    
        const pastSymbolStyle = {
            ...symbolStyle,
            color: '#CC2D39'
        };
    
        const symbolSpacing = 36;
        let xPosition = 0;
    
        // Определяем диапазон отображаемых символов
        const startIdx = Math.max(0, this.currentInputIndex - this.maxLeftSymbols);
        const endIdx = Math.min(this.symbols.length, this.currentInputIndex + this.maxRightSymbols + 1);
    
        for (let i = startIdx; i <= endIdx; i++) {
            if (i >= this.symbols.length) break;
    
            const isCurrent = i === this.currentInputIndex;
            const isPast = i < this.currentInputIndex;
            const symbol = this.symbols[i];
    
            const text = this.add.text(
                xPosition,
                0,
                symbol,
                isCurrent ? centerSymbolStyle : (isPast ? pastSymbolStyle : symbolStyle)
            )
            .setOrigin(0.5, 0.5)
            .setPadding(4, 4, 4, 4);
    
            this.symbolContainer.add(text);
            xPosition += symbolSpacing;
        }
    
        // Центрируем текущий символ
        const currentSymbolOffset = (this.currentInputIndex - startIdx) * symbolSpacing;
        this.symbolContainer.x = this.scale.width / 2 - currentSymbolOffset;
    }

    handleInput(event: KeyboardEvent) {
        const expectedChar = this.symbols[this.currentInputIndex].toLowerCase();
        const inputChar = event.key.toLowerCase();
        
        if (inputChar === expectedChar) {
            this.currentInputIndex++;
            
            // Добавляем новый символ в конец, если приближаемся к правой границе
            if (this.currentInputIndex + this.maxRightSymbols >= this.symbols.length) {
                this.symbols.push(this.generateSymbolSequence(1)[0]);
            }
            
            // Удаляем символы слева, если их стало слишком много
            if (this.currentInputIndex > this.maxLeftSymbols + 5) {
                this.symbols.shift();
                this.currentInputIndex--;
            }
            
            this.character.startMoving();
            this.updateSymbolDisplay();
        }
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