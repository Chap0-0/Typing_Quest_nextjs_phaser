import { Scene } from 'phaser';

export class Map extends Scene {
    private map!: Phaser.Tilemaps.Tilemap;
    private levelMarkers: Phaser.GameObjects.Arc[] = [];
    private levelInfo: Phaser.GameObjects.Text | null = null;
    private isDragging: boolean = false;
    private dragStart: { x: number, y: number } | null = null;
    private cameraStart: { x: number, y: number } | null = null;
    private levelModal!: HTMLDivElement;
    private currentLevelData: any = null;

    constructor() {
        super('Map');
    }

    preload() {
        this.load.image('levelMarkerOff', 'assets/map/map_marker_off.png');
        this.load.image('levelMarkerOn', 'assets/map/map_marker_on.png');
        this.load.image('tiles_1', 'assets/map/fantasyhextiles_v3.png');
        this.load.image('tiles_2', 'assets/map/fantasyhextiles_randr_4_v1.png');
        this.load.tilemapTiledJSON('map', 'assets/map/Main_Map.tmj');
    }

    create() {
        // 1. Создаем тайлмап
        this.map = this.make.tilemap({ key: 'map' });
        
        // 2. Добавляем тайлсеты
        const tileset1 = this.map.addTilesetImage('tiles_1', 'tiles_1');
        const tileset2 = this.map.addTilesetImage('tiles_2', 'tiles_2');
        const tilesets = [tileset1, tileset2];

        // 3. Создаем слои (только те, что нужны)
        const bgLayer = this.map.createLayer('bg', tilesets, 0, 0).setScale(2);
        this.map.createLayer('rivers', tilesets, 0, 0).setScale(2);
        const mainLayer = this.map.createLayer('main', tilesets, 0, 0).setScale(2);

        // 4. Устанавливаем границы камеры
        this.setupCameraBounds(bgLayer);

        // 5. Настраиваем управление камерой
        this.setupCameraControls();

        // 6. Обрабатываем объекты уровней
        this.processLevelObjects();

        // 7. Кнопка выхода (фиксированная)
        this.createLogoutButton();

        this.createLevelModal();
        // 8. Синий фон за пределами карты
        this.add.rectangle(0, 0, this.game.scale.width * 2, this.game.scale.height * 2, 0x0b589e)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(-1);
    }

    private createLevelModal() {
        this.levelModal = document.createElement("div");
        this.levelModal.id = "level-modal";
        this.levelModal.className = "game-form";
        this.levelModal.style.display = "none";
        this.levelModal.innerHTML = `
            <div class="form-container">
                <img src="assets/ui/info-ui.png" class="form-background">
                <div class="form-content">
                    <div class="title-background">
                        <h2 class="form-title" id="level-title">Название уровня</h2>
                    </div>
                    
                    <div style="width: 85%; margin: 15px 0; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #f9ddb4; font-family: 'RuneScape'; font-size: 28px;">Сложность:</span>
                            <span style="color: white; font-family: 'RuneScape'; font-size: 28px;" id="level-difficulty">Средняя</span>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #f9ddb4; font-family: 'RuneScape'; font-size: 28px;">Лимит времени:</span>
                            <span style="color: white; font-family: 'RuneScape'; font-size: 28px;" id="level-time-limit">5:00</span>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <div style="color: #f9ddb4; font-family: 'RuneScape'; font-size: 28px; margin-bottom: 8px;">Символы:</div>
                            <div id="level-symbols" style="color: white; font-family: 'RuneScape'; font-size: 28px;">фывапролджэ</div>
                        </div>
                    </div>
                    
                    <div style="width: 85%; margin: 15px 0; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; min-height: 100px;">
                        <p id="level-description" style="color: white; font-family: 'RuneScape'; font-size: 20px; margin: 0; line-height: 1.4;">
                            Описание уровня будет здесь...
                        </p>
                    </div>
                    
                    <div style="width: 85%; display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
                        <button id="level-start-button" 
                                style="background: #4a752c; 
                                    border: none;
                                    padding: 12px;
                                    color: white;
                                    font-family: 'RuneScape';
                                    font-size: 24px;
                                    cursor: pointer;
                                    border-radius: 5px;
                                    transition: all 0.2s;">
                            Начать уровень
                        </button>
                        <button id="level-close-button" 
                                style="background: #602b2c; 
                                    border: none;
                                    padding: 12px;
                                    color: white;
                                    font-family: 'RuneScape';
                                    font-size: 24px;
                                    cursor: pointer;
                                    border-radius: 5px;
                                    transition: all 0.2s;">
                            Вернуться на карту
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("game-container")?.appendChild(this.levelModal);

        // Обработчики событий для кнопок
        document.getElementById("level-start-button")?.addEventListener("click", () => {
            if (this.currentLevelData) {
                const levelName = this.currentLevelData.find((p: any) => p.name === 'name')?.value;
                if (levelName) {
                    this.hideLevelModal();
                    this.scene.start('LevelPreloader', { targetLevel: levelName });
                }
            }
        });

        document.getElementById("level-close-button")?.addEventListener("click", () => {
            this.hideLevelModal();
        });
    }

    private showLevelModal(levelData: any) {
        this.currentLevelData = levelData;
        
        // Заполняем данные уровня
        const title = levelData.find((p: any) => p.name === 'name')?.value || 'Уровень';
        const difficulty = levelData.find((p: any) => p.name === 'difficulty')?.value || 'Средняя';
        const timeLimit = levelData.find((p: any) => p.name === 'timeLimit')?.value || '5:00';
        const description = levelData.find((p: any) => p.name === 'description')?.value || 'Описание отсутствует';

        document.getElementById("level-title")!.textContent = title;
        document.getElementById("level-difficulty")!.textContent = difficulty;
        document.getElementById("level-time-limit")!.textContent = timeLimit;
        document.getElementById("level-description")!.textContent = description;

        // Показываем модальное окно
        this.levelModal.style.display = "block";
        this.levelModal.style.top = "50%";
        this.levelModal.style.left = "50%";
        this.levelModal.style.transform = "translate(-50%, -50%)";
        
        // Добавляем оверлей
        this.addOverlay();
        
        // Пауза игры
        this.game.loop.sleep();
    }

    private hideLevelModal() {
        this.levelModal.style.display = "none";
        this.removeOverlay();
        
        // Возобновляем игру
        this.game.loop.wake();
    }

    private addOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "game-overlay";
        overlay.id = "level-overlay";
        document.getElementById("game-container")?.appendChild(overlay);
        
        // Закрытие модального окна при клике на оверлей
        overlay.addEventListener("click", () => this.hideLevelModal());
    }

    private removeOverlay() {
        const overlay = document.getElementById("level-overlay");
        if (overlay) {
            overlay.remove();
        }
    }
    
    private setupCameraBounds(layer: Phaser.Tilemaps.TilemapLayer) {
        const mapWidth = layer.width * 1.5;
        const mapHeight = layer.height * 1.5;
        
        // Границы камеры (чтобы не выходила за пределы карты)
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        
        // Центрируем камеру на карте
        this.cameras.main.centerOn(mapWidth / 4, mapHeight / 2.25).setZoom(1.25);
    }

    private setupCameraControls() {
        // Обработчики событий мыши
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0 && !this.isDragging) {
                this.isDragging = true;
                this.dragStart = { x: pointer.x, y: pointer.y };
                this.cameraStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
            this.dragStart = null;
            this.cameraStart = null;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging && this.dragStart && this.cameraStart) {
                const dx = this.dragStart.x - pointer.x;
                const dy = this.dragStart.y - pointer.y;
                
                this.cameras.main.scrollX = this.cameraStart.x + dx;
                this.cameras.main.scrollY = this.cameraStart.y + dy;
            }
        });
    }

    private processLevelObjects() {
        const levelObjects = this.map.getObjectLayer('levels')?.objects;
        if (!levelObjects || levelObjects.length === 0) return;

        console.log('Tile width/height:', this.map.tileWidth, this.map.tileHeight);
        
        levelObjects.forEach((obj, index) => {
            console.log('Object raw coords:', obj.x, obj.y);
            const worldPos = this.map.tileToWorldXY(obj.x / this.map.tileWidth, obj.y / this.map.tileHeight);
            console.log('World position:', worldPos);
            
            if (!worldPos) return;
            this.createLevelMarker(worldPos.x, worldPos.y, index, obj.properties);
        });
    }

    private createLevelMarker(x: number, y: number, index: number, properties: any) {
        const marker = this.add.image(x, y, 'levelMarkerOff')
            .setInteractive({ cursor: 'pointer' })
            .setData('levelData', properties)
            .setDepth(1000)
            .setScale(5); // Масштабируем при необходимости

        // Изменяем обработчики событий для изображения
        marker.on('pointerover', () => {
            marker.setTexture('levelMarkerOn');
            this.showLevelInfo(marker);
        });
        
        marker.on('pointerout', () => {
            marker.setTexture('levelMarkerOff');
            this.hideLevelInfo();
        });
        
        marker.on('pointerdown', () => {
            this.showLevelModal(marker.getData('levelData'));
        });

        // Сохраняем маркер в массив
        this.levelMarkers.push(marker);
    }

    private createLogoutButton() {
        this.add.text(
            window.innerWidth - 360,
            120,
            'Выход', 
            { 
                fontSize: '24px', 
                color: '#ffffff',
                backgroundColor: '#ff0000',
                padding: { x: 10, y: 5 }
            }
        )
        .setScrollFactor(0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerdown', async () => {
            try {
                await fetch('http://localhost:3000/auth/logout', { method: 'POST', credentials: 'include' });
                this.scene.start('Intro');
            } catch (error) {
                console.error('Ошибка выхода:', error);
            }
        });
    }

    private showLevelInfo(marker: Phaser.GameObjects.Arc) {
        const levelName = marker.getData('levelData').find((p: any) => p.name === 'name')?.value || `Уровень ${marker.getData('levelIndex') + 1}`;
        
        this.levelInfo = this.add.text(
            marker.x,
            marker.y + 40,
            levelName,
            { 
                font: '18px RuneScape',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 15, y: 8 }
            }
        )
        .setOrigin(0.5)
        .setDepth(1001);
    }

    private hideLevelInfo() {
        if (this.levelInfo) {
            this.levelInfo.destroy();
            this.levelInfo = null;
        }
    }
}