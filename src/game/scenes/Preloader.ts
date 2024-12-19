import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        const barWidth = 468;
        const barHeight = 32;
        const barX = this.scale.width / 2;
        const barY = this.scale.height / 2; 

        this.add.rectangle(barX, barY, barWidth, barHeight).setStrokeStyle(1, 0x602b2c);

        const bar = this.add.rectangle(barX - barWidth / 2 + 2, barY, 4, barHeight - 4, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (barWidth - 8) * progress;
        });
    }

    preload() {
        // Загрузка активов для игры
        this.load.setPath('assets/intro');
        this.load.tilemapTiledJSON('intro-bg-map', 'intro-bg-map.tmj');
        this.load.image('intro-tiles', 'Intro-tiles.png');
        this.load.image('logo', 'logo.png');
        this.load.image('bg-sky', 'intro-bg-sky.png');
        this.load.image('bg-clouds', 'intro-bg-clouds.png');
        this.load.image('bg-mounts', 'intro-bg-mounts.png');

    }

    create() {
        // this.scene.start('Intro');
        this.scene.start('LevelPreloader', { targetLevel: `Level_1` });
    }
}
