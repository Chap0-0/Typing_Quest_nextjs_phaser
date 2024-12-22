import { Scene, GameObjects, Tilemaps, Sound } from "phaser";
import { Character } from "../Character";

export class Level_1 extends Scene {
    private backgroundMusic: Sound.BaseSound;
    private isAudioPlaying: boolean = true;
    private Character: Character;
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
        
        this.Character = new Character(this, 100, 400, "character");

        this.cameras.main.startFollow(this.Character);
        this.cameras.main.setZoom(1);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        this.physics.world.setBounds(0, 0, this.map.widthInPixels * scaleRatio, this.map.heightInPixels * scaleRatio);

        this.physics.add.collider(this.Character, collidersLayer);

        this.backgroundMusic = this.sound.add("backgroundMusic", { loop: true });
        this.backgroundMusic.play();

        const pauseButton = this.add.text(16, 16, "Pause Music", { fontSize: "18px", color: "#ffffff" })
            .setScrollFactor(0)
            .setDepth(20)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.toggleAudio());
    }

    update() {
        this.Character.handleMovement();
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
