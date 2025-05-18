// managers/EnemyManager.ts
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

    public createFromTilemap(map: Tilemaps.Tilemap, scaleRatio: number) {
        const enemiesLayer = map.getObjectLayer('enemies');
        if (!enemiesLayer) return;
        enemiesLayer.objects.forEach((enemyObj: any) => {
            const type = enemyObj.properties[0].value;
            if (!type) return;
            
            const config = this.enemyConfig.enemyTypes.find((e: any) => e.type === type);
            if (!config) return;

            this.createEnemy(
                enemyObj.x! * scaleRatio + enemyObj.width! * scaleRatio / 2,
                enemyObj.y! * scaleRatio - enemyObj.height! * scaleRatio,
                type,
                config
            );
        });
    }

    public createEnemy(x: number, y: number, type: string, config: any) {
        const enemy = new Enemy(this.scene, x, y, type, config);
        this.enemies.add(enemy);
        return enemy;
    }

    public getEnemies() {
        return this.enemies;
    }
}