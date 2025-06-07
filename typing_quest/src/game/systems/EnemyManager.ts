import { Enemy } from "@/game/entities/Enemy";
import { Physics, Scene, Tilemaps } from "phaser";

export class EnemyManager {
    private scene: Scene;
    private enemies: Physics.Arcade.Group;

    constructor(scene: Scene, private enemyConfig: any) {
        this.scene = scene;
        this.enemies = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
    }

    public createFromTilemap(map: Tilemaps.Tilemap,offsetY: number = 0) {
        const enemiesLayer = map.getObjectLayer('enemies');
        if (!enemiesLayer) return;

        enemiesLayer.objects.forEach((enemyObj: any) => {
            const type = enemyObj.properties.find((p: any) => p.name === 'type')?.value;
            if (!type) return;
            
            const config = this.enemyConfig.enemyTypes.find((e: any) => e.type === type);
            if (!config) return;

            this.createEnemy(
                enemyObj.x , 
                enemyObj.y + offsetY, 
                type,
                config
            );
        });
    }

    public createEnemy(x: number, y: number, type: string, config: any) {
        const enemy = new Enemy(this.scene, x, y, type, config).setDepth(2);
        this.enemies.add(enemy);
        return enemy;
    }

    public getEnemies() {
        return this.enemies;
    }

    public cleanup() {
        if (this.enemies instanceof Phaser.GameObjects.Group) {
            this.enemies.clear(true, true);
        } else if (Array.isArray(this.enemies)) {
            this.enemies.forEach(enemy => enemy.destroy());
            this.enemies = [];
        } else {
            this.enemies = [];
        }
    }
}