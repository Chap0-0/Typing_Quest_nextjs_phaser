import { Scene, GameObjects, Tilemaps, Sound } from "phaser";
import { Character } from "../../entities/Character";
import { EventBus } from "../../EventBus";

export class Level_1 extends Scene {
    private readonly distancePerKey: number = 100; // Дистанция за один символ
    
    private backgroundMusic: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private character: Character;
    private currentInputIndex: number = 0;
    private symbolContainer: Phaser.GameObjects.Container;
    private isGamePaused: boolean = false;
    private pauseMenu: Phaser.GameObjects.DOMElement;
    private autojumpZones: Phaser.Types.Tilemaps.TiledObject[] = [];
    private fullSequence: string[] = [];
    private symbols: string[];
    background: GameObjects.Image;
    backgroundLayer: Tilemaps.Layer;
    map: Tilemaps.Tilemap;

    constructor() {
        super("Level_1");
    }

    create() {
        this.initScene();
        this.createLevelMap();
        this.createCharacter();
        this.createAudio();
        this.createInputSystem();
        this.createPauseSystem();

        // Блокируем функции в окне
        this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
            if (event.key === "/") {
                event.preventDefault();
            }
            if (event.key === "'") {
                event.preventDefault();
            }
        });
    }

    private initScene() {
        this.background = this.add
            .image(0, 0, "Level_1_bg")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setScrollFactor(0);
    }

    private createLevelMap() {
        this.map = this.make.tilemap({ key: "Level_1_map" });
        const decors = this.map.addTilesetImage("2", "decors_Level_1");
        const tileset = this.map.addTilesetImage("1", "tiles_Level_1");

        const backgroundLayer = this.map.createLayer(
            "bg",
            [decors, tileset],
            0,
            0
        );
        const collidersLayer = this.map.createLayer("main", tileset, 0, 0);

        this.autojumpZones = this.map.getObjectLayer("autojump")?.objects || [];
        // Создаем графический слой для отладки
        this.debugGraphics = this.add.graphics();

        collidersLayer.setDepth(1).setCollisionByExclusion([-1]);
        backgroundLayer.setDepth(1);

        const scaleRatio = this.scale.height / this.map.heightInPixels;
        collidersLayer.setScale(scaleRatio);
        backgroundLayer.setScale(scaleRatio);

        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels * scaleRatio,
            this.map.heightInPixels * scaleRatio
        );
    }

    private createCharacter() {
        this.character = new Character(this, 100, 200, "character");

        // Получаем слой с коллизиями правильно
        const collidersLayer = this.map.getLayer("main");
        if (collidersLayer && collidersLayer.tilemapLayer) {
            this.physics.add.collider(
                this.character,
                collidersLayer.tilemapLayer
            );
        } else {
            console.error("Не найден слой коллизий 'main'");
        }

        // Камера должна следовать за уже созданным персонажем!
        this.cameras.main
            .startFollow(this.character)
            .setZoom(1.3)
            .setBounds(
                0,
                0,
                this.map.widthInPixels *
                    (this.scale.height / this.map.heightInPixels),
                this.map.heightInPixels *
                    (this.scale.height / this.map.heightInPixels)
            );
    }

    private createAudio() {
        this.backgroundMusic = this.sound.add("backgroundMusic", {
            loop: true,
        });
        this.backgroundMusic.play();
    }

    private createInputSystem() {
        const sequences = this.cache.json.get("input_sequences").sequences;

        // Генерируем полную последовательность (10 шаблонов)
        this.fullSequence = this.generateSequence(sequences, 10);

        // Отображаемая часть (например, 7 символов)
        this.visibleSequence = this.fullSequence.slice(0, 7);
        this.currentInputIndex = 0;

        this.createInputInterface();
        this.input.keyboard.on("keydown", this.handleInput.bind(this));
    }
    private generateSequence(templates: string[], count: number): string[] {
        let result: string[] = [];

        for (let i = 0; i < count; i++) {
            const randomTemplate =
                templates[Math.floor(Math.random() * templates.length)];
            result.push(...randomTemplate.split(""));
        }

        return result.map((char) => (char === "_" ? " " : char)); // Заменяем _ на пробелы
    }
    private createPauseSystem() {
        // 1. Кнопка паузы
        const pauseButton = this.add
            .image(this.scale.width - 1300, 140, "pause_button")
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(10000)
            .setScale(5)
            .on("pointerdown", () => {
                this.togglePause();
            });

        // 2. Создаем DOM-элемент для меню
        this.pauseMenu = this.add
            .dom(this.scale.width / 2, this.scale.height / 2)
            .createFromHTML(
                `
            <div style="
                background: rgba(0, 0, 0, 0.8);
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                width: 300px;
                z-index: 1000;
            ">
                <button id="toggleSound" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    margin-bottom: 20px;
                ">🔊</button>
                <button id="resumeGame" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    margin: 10px;
                    cursor: pointer;
                    width: 80%;
                ">Продолжить</button>
                <button id="returnToMap" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    margin: 10px;
                    cursor: pointer;
                    width: 80%;
                ">Вернуться на карту</button>
            </div>

        `
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);

        // 3. Получаем ссылки на кнопки
        const toggleSoundBtn = this.pauseMenu.getChildByID("toggleSound");
        const resumeBtn = this.pauseMenu.getChildByID("resumeGame");
        const returnBtn = this.pauseMenu.getChildByID("returnToMap");

        // 4. Добавляем обработчики напрямую к элементам
        toggleSoundBtn?.addEventListener("click", () => {
            this.toggleAudio();
            toggleSoundBtn.textContent = this.isAudioPlaying ? "🔊" : "🔇";
        });

        resumeBtn?.addEventListener("click", () => {
            this.togglePause();
        });

        returnBtn?.addEventListener("click", () => {
            this.scene.start("Map");
        });

    }

    private togglePause() {
        this.isGamePaused = !this.isGamePaused;

        if (this.isGamePaused) {
            this.physics.pause();
            this.pauseMenu.setVisible(true);
            console.log("Меню паузы показано");
        } else {
            this.physics.resume();
            this.pauseMenu.setVisible(false);
            console.log("Меню паузы скрыто");
        }
    }

    update() {
        if (this.isGamePaused) return;
        this.checkAutoJump();
        this.character.updateState();
    }

    private checkAutoJump() {
        const player = this.character;
        const scaleRatio = this.scale.height / this.map.heightInPixels;
        const playerBounds = new Phaser.Geom.Rectangle(
            player.body.x,
            player.body.y,
            player.body.width,
            player.body.height
        );

        // Проверяем только если персонаж на земле
        if (!player.body.blocked.down && !player.body.touching.down) return;

        for (const zone of this.autojumpZones) {
            const zoneRect = new Phaser.Geom.Rectangle(
                zone.x * scaleRatio,
                zone.y * scaleRatio,
                zone.width * scaleRatio,
                zone.height * scaleRatio
            );

            if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                    playerBounds,
                    zoneRect
                )
            ) {
                player.jump();
                break;
            }
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

        this.symbolBox = this.add
            .image(
                interfaceWidth / 2,
                interfaceY + interfaceHeight / 2,
                "input_bg"
            )
            .setDisplaySize(800, 120)
            .setDepth(101)
            .setScrollFactor(0);

        this.symbolContainer = this.add
            .container(interfaceWidth / 2, interfaceY + interfaceHeight / 2)
            .setDepth(102)
            .setScrollFactor(0);

        this.updateSymbolDisplay();
    }

    updateSymbolDisplay() {
        this.symbolContainer.removeAll(true);
    
        const symbolStyle = {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#777777' // Серый - будущие символы
        };
    
        const currentSymbolStyle = {
            ...symbolStyle,
            color: '#000000', // Черный - текущий
            fontWeight: 'bold'
        };
    
        const pastSymbolStyle = {
            ...symbolStyle,
            color: '#CC2D39' // Красный - введенные
        };
    
        const symbolSpacing = 36;
        let xPosition = 0;
    
        // 1. Введенные символы (красные) - максимум 9 слева
        const pastStart = Math.max(0, this.currentInputIndex - 9);
        const pastSymbols = this.fullSequence.slice(pastStart, this.currentInputIndex);
        
        pastSymbols.forEach(symbol => {
            const text = this.add.text(
                xPosition,
                0,
                symbol,
                pastSymbolStyle
            )
            .setOrigin(0.5, 0.5);
            
            this.symbolContainer.add(text);
            xPosition += symbolSpacing;
        });
    
        // 2. Текущий символ (черный)
        if (this.currentInputIndex < this.fullSequence.length) {
            const currentText = this.add.text(
                xPosition,
                0,
                this.fullSequence[this.currentInputIndex],
                currentSymbolStyle
            )
            .setOrigin(0.5, 0.5);
            
            this.symbolContainer.add(currentText);
            xPosition += symbolSpacing;
        }
    
        // 3. Будущие символы (серые) - оставшиеся до 19
        const futureSymbols = this.fullSequence.slice(
            this.currentInputIndex + 1,
            this.currentInputIndex + 1 + (19 - (pastSymbols.length + 1))
        );
        
        futureSymbols.forEach(symbol => {
            const text = this.add.text(
                xPosition,
                0,
                symbol,
                symbolStyle
            )
            .setOrigin(0.5, 0.5);
            
            this.symbolContainer.add(text);
            xPosition += symbolSpacing;
        });
    
        // Центрируем контейнер
        this.symbolContainer.x = this.scale.width / 2 - (symbolSpacing * 9); // Смещаем на 9 символов
    }

    private createCompletionWindow() {
        // Создаем DOM-элемент
        const completionWindow = this.add.dom(this.scale.width / 2, this.scale.height / 2)
        .createFromHTML(`
            <div style="
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #4CAF50;
                border-radius: 10px;
                color: white;
                padding: 20px;
                text-align: center;
                width: 300px;
            ">
                <h2>Уровень пройден!</h2>
                <p>Все последовательности введены</p>
                <button id="nextLevelBtn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    margin-top: 15px;
                    cursor: pointer;
                    border-radius: 5px;
                ">На карту</button>
            </div>
        `).setOrigin(0.5).setDepth(10000).setScrollFactor(0);
    
        // Обработчик кнопки
        const nextLevelBtn = completionWindow.getChildByID('nextLevelBtn');
        nextLevelBtn?.addEventListener('click', () => {
            this.scene.start('Map'); // Или другая логика перехода
        });
    
        return completionWindow;
    }

    private showLevelComplete() {
        // Останавливаем игру
        this.physics.pause();
        this.isGamePaused = true;
        
        // Показываем окно
        this.createCompletionWindow();
        
        // Останавливаем музыку (опционально)
        this.backgroundMusic.stop();
    }


    private processCorrectInput() {
        this.currentInputIndex++;
        this.updateSymbolDisplay();
        
        this.character.move(this.distancePerKey);
    
        if (this.currentInputIndex < this.fullSequence.length) {
            this.time.delayedCall(300, () => {
                const nextChar = this.fullSequence[this.currentInputIndex];
                this.handleInput({ key: nextChar });
            });
        }
    }
    
    private handleInput(event: KeyboardEvent | { key: string }) {
        if (this.isGamePaused) return;
        
        const expectedChar = this.fullSequence[this.currentInputIndex];
        const inputChar = event.key.toLowerCase();
    
        if (inputChar === expectedChar) {
            this.processCorrectInput();
            
            if (this.currentInputIndex >= this.fullSequence.length) {
                this.showLevelComplete();
            }
        }
    }
}
