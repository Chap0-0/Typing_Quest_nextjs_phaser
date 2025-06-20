import { Boot } from './scenes/Boot';
import { Intro } from './scenes/Intro';
import { Map } from './scenes/Map';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { Level } from './scenes/Level';
import { LevelPreloader } from './scenes/LevelPreloader';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [
        Boot,
        Preloader,
        Intro,
        Map,
        LevelPreloader,
        Level
    ],
    
    dom: {
        createContainer: true
    },
    render: {
        antialias: false,  // Отключает сглаживание
    },
    physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,  // Автоматическое изменение размера
        autoCenter: Phaser.Scale.CENTER_BOTH,  // Центрирование
    },
    pixelArt:true,
    fps: {
            min: 30,
            target: 60,
    }
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
