import { Scene } from 'phaser';

export class Map extends Scene {
    private map!: Phaser.Tilemaps.Tilemap;
    private levelMarkers: Phaser.GameObjects.Arc[] = [];
    private levelInfo: Phaser.GameObjects.Text | null = null;
    private currentLevelIndex: number = 0;

    constructor() {
        super('Map');
    }

    preload() {
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

        // 3. Создаем слои
        this.map.createLayer('bg', tilesets, 0, 0).setScale(2);
        this.map.createLayer('rivers', tilesets, 0, 0).setScale(2);
        this.map.createLayer('main', tilesets, 0, 0).setScale(2);

        // 4. Обрабатываем объекты уровней
        this.processLevelObjects();
        const logoutButton = this.add.text(200, 200, 'Выход', { 
            fontSize: '24px', 
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .on('pointerdown', async () => {
            try {
            await fetch('http://localhost:3000/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            localStorage.removeItem('user');
            this.scene.start('Intro');
            } catch (error) {
            console.error('Ошибка выхода:', error);
            }
        });
        // 5. Фокусируемся на первом уровне
        if (this.levelMarkers.length > 0) {
            this.focusOnLevel(0);
        }
    }

    private processLevelObjects() {
        const levelObjects = this.map.getObjectLayer('levels')?.objects;
        if (!levelObjects || levelObjects.length === 0) {
            console.warn('Не найдены объекты уровней');
            return;
        }

        levelObjects.forEach((obj, index) => {
            const worldPos = this.map.tileToWorldXY(
                obj.x / this.map.tileWidth, 
                obj.y / this.map.tileHeight
            );
            
            if (!worldPos) {
                console.error('Не удалось преобразовать координаты для уровня', index);
                return;
            }

            // Создаем маркер уровня
            const marker = this.createLevelMarker(worldPos.x, worldPos.y, index, obj.properties);
            this.levelMarkers.push(marker);
        });
    }

    private createLevelMarker(x: number, y: number, index: number, properties: any): Phaser.GameObjects.Arc {
        // Основной маркер
        const marker = this.add.circle(x, y, 25, 0xff0000, 0.7)
            .setInteractive()
            .setData('levelData', properties)
            .setData('levelIndex', index)
            .setDepth(1000);

        // Обводка маркера
        this.add.circle(x, y, 25, 0x000000, 0)
            .setStrokeStyle(3, 0xffffff)
            .setDepth(1000);

        // Текст с номером уровня
        const levelText = this.add.text(x, y - 15, `${index + 1}`, {
            font: '20px Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setDepth(1001);

        // Обработчики событий
        marker.on('pointerover', () => {
            this.focusOnLevel(index);
            this.showLevelInfo(marker);
        });
        
        marker.on('pointerout', () => {
            this.hideLevelInfo();
        });
        
        marker.on('pointerdown', () => {
            this.loadLevelDescription(marker);
        });

        return marker;
    }

    private focusOnLevel(levelIndex: number) {
        if (levelIndex < 0 || levelIndex >= this.levelMarkers.length) return;

        this.currentLevelIndex = levelIndex;
        const marker = this.levelMarkers[levelIndex];
        
        // Плавное перемещение камеры к уровню
        this.cameras.main.pan(
            marker.x,
            marker.y,
            500,
            'Power2'
        ).setZoom(1.5);
        // Подсветка текущего уровня
        this.levelMarkers.forEach((m, i) => {
            m.fillColor = i === levelIndex ? 0x00ff00 : 0xff0000;
            m.fillAlpha = i === levelIndex ? 0.9 : 0.7;
        });
    }

    private showLevelInfo(marker: Phaser.GameObjects.Arc) {
        const levelData = marker.getData('levelData');
        const levelName = levelData.find((prop: any) => prop.name === 'name')?.value || `Уровень ${marker.getData('levelIndex') + 1}`;

        if (this.levelInfo) {
            this.levelInfo.destroy();
        }

        this.levelInfo = this.add.text(
            marker.x,
            marker.y + 40,
            levelName,
            { 
                font: '18px Arial',
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

    private async loadLevelDescription(marker: Phaser.GameObjects.Arc) {
        const levelData = marker.getData('levelData');
        const levelName = levelData.find((prop: any) => prop.name === 'name')?.value;
        
        if (!levelName) {
            console.error('У уровня нет свойства name');
            return;
        }

        try {
            // Здесь можно добавить загрузку данных уровня
            console.log(`Загрузка уровня: ${levelName}`);
            
            // Пример перехода на сцену уровня
        this.scene.start('LevelPreloader', { targetLevel: `${levelName}` });
            
        } catch (error) {
            console.error('Ошибка загрузки уровня:', error);
        }
    }
}