import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { Intro } from './game/scenes/Intro';

function App() {
    // Ссылка на компонент PhaserGame
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
        </div>
    );
}

export default App;
