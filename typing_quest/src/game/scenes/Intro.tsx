import { Scene, Tilemaps, GameObjects } from "phaser";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RegisterModal } from '../../components/auth/RegisterModal';
import { AuthModal } from '../../components/auth/AuthModal';

export class Intro extends Scene {
    logo: GameObjects.Image;
    startButton: GameObjects.DOMElement;
    aboutButton: GameObjects.DOMElement;
    map: Tilemaps.Tilemap;
    tileset: Tilemaps.Tileset;
    backgroundLayer: Tilemaps.Layer;
    backgroundLayer_2: Tilemaps.Layer;
    bg_clouds_1: GameObjects.Image;
    bg_clouds_2: GameObjects.Image;
    private currentForm: "auth" | "register" | null = null;
    private isFormOpen: boolean = false;
    private interactiveElements: GameObjects.GameObject[] = [];

    constructor() {
        super("Intro");
    }

    create() {
    this.map = this.make.tilemap({ key: "intro-bg-map" });
        this.tileset = this.map.addTilesetImage("1", "intro-tiles");

        this.backgroundLayer = this.map
            .createLayer("main", this.tileset)
            .setDepth(2);
        this.backgroundLayer_2 = this.map
            .createLayer("background", this.tileset)
            .setDepth(1);

        const mapWidth = this.map.widthInPixels;
        const scaleRatio = this.scale.width / mapWidth;
        this.backgroundLayer.setScale(scaleRatio);
        this.backgroundLayer_2.setScale(scaleRatio);
        const layerHeight = this.backgroundLayer.displayHeight;
        const layerY = this.scale.height - layerHeight;
    
        this.backgroundLayer.setY(layerY);
    this.backgroundLayer_2.setY(layerY);
        this.add.image(0, 0, "bg-sky")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
        
            this.bg_clouds_1 = this.add.image(0, 0, "bg-clouds")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
        this.bg_clouds_2 = this.add.image(this.scale.width, 0, "bg-clouds")
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);

        this.add.image(0, 0, "bg-mounts")
        .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.logo = this.add.image(this.scale.width / 2, this.scale.height / 4, "logo")
        .setOrigin(0.5)
        .setDepth(2)
        .setScale(0.6);
        
        this.startButton = this.createButton(
            this.scale.width / 2,
            this.logo.y + 250,
            "Начать",
            async () => {
                if (!this.isFormOpen) {
                    const isAuthenticated = await this.checkAuth();
                    if (isAuthenticated) {
                        this.scene.start('Map', { accessToken: isAuthenticated});
                    } else {
                        this.showAuthForm();
                    }
                }
            }
        ).setDepth(3);
        
        this.aboutButton = this.createButton(
            this.scale.width / 2,
            this.startButton.y + 100,
            "О проекте",
            () => {
                if (!this.isFormOpen) window.open("/about", "_blank");
            }
        ).setDepth(3);
        
        this.interactiveElements.push(this.startButton, this.aboutButton);
        if (this.startButton && this.aboutButton) {
            this.interactiveElements.push(this.startButton, this.aboutButton);
        }
        this.events.on('destroy', () => {
            this.interactiveElements = [];
        });
    }
    
    createButton(
        x: number,
        y: number,
        text: string,
        callback: () => void
    ): GameObjects.Container {
        const buttonBackground = this.add
            .rectangle(0, 0, 200, 60, 0xead4aa)
            .setStrokeStyle(2, 0x602b2c)
            .setOrigin(0.5);

        const buttonText = this.add
            .text(0, 0, text, {
                font: "36px RuneScape",
                color: "#602b2c",
            })
            .setOrigin(0.5);

        const button = this.add.container(x, y, [buttonBackground, buttonText]);
        button.setSize(200, 60);
        button
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", callback);

        return button;
    }

    update() {
        const cloudSpeed = 0.2;
        this.bg_clouds_1.x += cloudSpeed;
        this.bg_clouds_2.x += cloudSpeed;

        if (this.bg_clouds_1.x >= this.scale.width) {
            this.bg_clouds_1.x = this.bg_clouds_2.x - this.scale.width;
        }

        if (this.bg_clouds_2.x >= this.scale.width) {
            this.bg_clouds_2.x = this.bg_clouds_1.x - this.scale.width;
        }
    }


    private async checkAuth(): Promise<string | false> {
        try {
            const response = await fetch('http://localhost:3000/auth/check', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.authenticated && data.accessToken) {
                    return data.accessToken;
                }
                
                if (data.authenticated) {
                    const tokensResponse = await fetch('http://localhost:3000/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                    });
                    
                    if (tokensResponse.ok) {
                        const tokensData = await tokensResponse.json();
                        return tokensData.accessToken;
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            return false;
        }
    }

    private showAuthForm() {
        this.hideForm();
        this.currentForm = "auth";
        this.isFormOpen = true;
        this.disableBackgroundInteractivity();
        
        const container = document.createElement('div');
        container.id = 'auth-modal-container';
        document.getElementById('game-container')?.appendChild(container);
        
        const root = createRoot(container);
        root.render(
            <AuthModal 
                scene={this}
                onClose={() => this.hideForm()}
                onSwitchToRegister={() => {
                    this.hideForm();
                    this.showRegisterForm();
                }}
            />
        );
    }

    private showRegisterForm() {
        this.hideForm();
        this.currentForm = "register";
        this.isFormOpen = true;
        this.disableBackgroundInteractivity();
        
        const container = document.createElement('div');
        container.id = 'register-modal-container';
        document.getElementById('game-container')?.appendChild(container);
        
        const root = createRoot(container);
        root.render(
            <RegisterModal 
                scene={this}
                onClose={() => this.hideForm()}
                onSwitchToAuth={() => {
                    this.hideForm();
                    this.showAuthForm();
                }}
            />
        );
    }

    private hideForm() {
        if (this.currentForm === "auth") {
            const container = document.getElementById('auth-modal-container');
            if (container) {
                container.remove();
            }
        } else if (this.currentForm === "register") {
            const container = document.getElementById('register-modal-container');
            if (container) {
                container.remove();
            }
        }
        
        this.isFormOpen = false;
        this.enableBackgroundInteractivity();
        this.currentForm = null;
    }

     private disableBackgroundInteractivity() {
        this.interactiveElements.forEach(element => {
            if (element && typeof element.setInteractive === 'function') {
                this.removeInteractiveElement(element);
            }
        });
        
        this.tweens.add({
            targets: [this.logo, this.startButton, this.aboutButton],
            alpha: 0.5,
            duration: 300
        });
    }
    private removeInteractiveElement(element: GameObjects.GameObject) {
        this.interactiveElements = this.interactiveElements.filter(el => el !== element);
    }
    private enableBackgroundInteractivity() {
    this.interactiveElements.forEach(element => {
        if (element && element.scene && typeof element.setInteractive === 'function') {
            try {
                if (element instanceof Phaser.GameObjects.Container) {
                    element.setInteractive({ useHandCursor: true });
                } else {
                    element.setInteractive();
                }
            } catch (error) {
                console.warn('Failed to set interactive on element:', element, error);
            }
        }
    });
    
    this.tweens.add({
        targets: [this.logo, this.startButton, this.aboutButton],
        alpha: 1,
        duration: 300
    });
}
        private async handleAuthSubmit(username: string, password: string) {
            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Ошибка авторизации');
                }

                const data = await response.json();
                
                this.hideForm();
                this.scene.start('Map', { accessToken: data.accessToken });
            } catch (error) {
                console.error('Ошибка авторизации:', error);
                alert(error.message);
            }
        }

        private async handleRegisterSubmit(username: string, email: string, password: string) {
            try {
                const response = await fetch('http://localhost:3000/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Ошибка регистрации');
                }

                const data = await response.json();
                this.hideForm();
                this.scene.start('Map', { accessToken: data.accessToken });
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                alert(error.message);
            }
        }
}
