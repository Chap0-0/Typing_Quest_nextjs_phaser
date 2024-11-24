import { Scene, GameObjects,Tilemaps,  Sound } from 'phaser';

export class Level_1 extends Scene {
    private backgroundMusic: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private player: Phaser.Physics.Arcade.Sprite;
    background: GameObjects.Image;
    backgroundLayer: Tilemaps.Layer;
    map: Tilemaps.Tilemap;

    constructor() {
        super('Level_1');
    }

    preload() {
        this.load.setPath('assets/levels/level_1');
        this.load.tilemapTiledJSON('level_1-map', 'level_1.tmj');
        this.load.image('tiles_level_1', 'Tileset.png');
        this.load.image('decors_level_1', 'Decors.png');
        this.load.image('level_1-bg', 'level_1-bg.png');
        this.load.audio('backgroundMusic', 'level_1.mp3');
    }

    create() {
        // Загружаем фон
        this.background = this.add.image(0, 0, 'level_1-bg').setOrigin(0, 0);
        this.background.setDisplaySize(this.scale.width, this.scale.height); // Растягиваем фон по размеру экрана
        this.background.setScrollFactor(0); // Фон не движется с камерой

        // Загружаем tilemap
        this.map = this.make.tilemap({ key: 'level_1-map' });
        const decors = this.map.addTilesetImage('2','decors_level_1');
        const tileset = this.map.addTilesetImage('1','tiles_level_1');
        
        // Создаем слой карты и устанавливаем коллайдеры
        const backgroundLayer = this.map.createLayer('bg', [decors, tileset], 0, 0);
        const collidersLayer = this.map.createLayer('main', tileset, 0, 0);

        collidersLayer.setDepth(1);
        backgroundLayer.setDepth(1);
        collidersLayer.setCollisionByExclusion([-1]);

        // Масштабируем карту по высоте экрана
        const mapHeight = this.map.heightInPixels;
        const scaleRatio = this.scale.height / mapHeight;
        collidersLayer.setScale(scaleRatio); // Растягиваем слой карты
        backgroundLayer.setScale(scaleRatio);
        // Создаем игрока
        this.player = this.physics.add.sprite(100, 400, 'character').setDepth(10);
        this.player.setScale(1.5);
        this.player.setCollideWorldBounds(true);

        // Камера будет следовать за игроком
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1); // Устанавливаем начальное приближение

        // Устанавливаем правильные границы для камеры
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio); // Устанавливаем границы камеры с учетом масштаба

        // Устанавливаем границы мира для игрока вручную
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        // Применяем коллизию
        this.physics.add.collider(this.player, collidersLayer);

        // Управление персонажем
        this.cursors = this.input.keyboard.createCursorKeys();
        // Воспроизведение музыки
        this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
        this.backgroundMusic.play();

        const pauseButton = this.add.text(16, 16, 'Pause Music', { fontSize: '18px', color: '#ffffff' })
            .setScrollFactor(0) // Фиксация кнопки на экране
            .setDepth(20) // Установим глубину, чтобы кнопка была над всеми объектами
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleAudio());
    }

    update() {
        // Управление движением
        const speed = 300;
        this.player.setVelocityX(0);

        if(this.cursors.left.isDown){
            this.player.setVelocityX(-speed);
            this.player.anims.play('left', true);
          }else if(this.cursors.right.isDown){
            this.player.setVelocityX(speed);
            this.player.anims.play('right', true);
          }else{
            this.player.setVelocityX(0);
            this.player.anims.play('turn', true);
          }
  
          if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.setVelocityY(-500); // Значение отрицательной скорости прыжка
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