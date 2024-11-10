import { Boot } from './scenes/Boot';
import { Intro } from './scenes/Intro';
import { Map } from './scenes/Map';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        Intro,
        Map,
    ],
    scale: {
        mode: Phaser.Scale.RESIZE,  // Автоматическое изменение размера
        autoCenter: Phaser.Scale.CENTER_BOTH,  // Центрирование
    },
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
