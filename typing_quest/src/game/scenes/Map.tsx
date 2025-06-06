import { Scene } from "phaser";
import { createRoot } from 'react-dom/client';
import React from 'react';
import ProfileModal from '../../components/ProfileModal';
import LevelModal from '../../components/LevelModal';
import LogoutButton from '../../components/LogoutButton';
import ProfileButton from '../../components/ProfileButton';

export class Map extends Scene {
    private mapImage!: Phaser.GameObjects.Image;
    private levelMarkers: Phaser.GameObjects.Image[] = [];
    private levelInfo: Phaser.GameObjects.Text | null = null;
    private isDragging: boolean = false;
    private dragStart: { x: number; y: number } | null = null;
    private cameraStart: { x: number; y: number } | null = null;
    private levelModal!: HTMLDivElement;
    private clouds: Phaser.GameObjects.Image[] = [];
    private cloudShadows: Phaser.GameObjects.Image[] = [];
    private accessToken: string;
    private profileModalContainer!: HTMLDivElement;
    private profileModalRoot: any = null;
    private interfaceButtonsRoot: any = null;
    private tokenCheckInterval: any;
    constructor() {
        super("Map");
    }
    init(data: { accessToken: string }) {
        this.accessToken = data.accessToken;
    }
    preload() {
        this.load.image("levelMarkerOff", "assets/map/map_marker_off.png");
        this.load.image("levelMarkerOn", "assets/map/map_marker_on.png");
        this.load.image("mapBackground", "assets/map/map_background.png");

        this.load.image("cloud1", "assets/map/clouds/cloud1.png");
        this.load.image("cloud2", "assets/map/clouds/cloud2.png");
        this.load.image("cloud3", "assets/map/clouds/cloud3.png");
        this.load.image("cloud4", "assets/map/clouds/cloud4.png");
        this.load.image("cloud5", "assets/map/clouds/cloud5.png");
    }

    create() {
        this.mapImage = this.add
            .image(0, 0, "mapBackground")
            .setOrigin(0)
            .setScale(2);

        this.createInterfaceButtonsContainer();
        this.setupCameraBounds();
        this.setupCameraControls();
        this.createLevelModal();
        this.createClouds();
        this.loadLevelsFromServer();
        this.createProfileModalContainer();

        // 7. Синий фон за пределами карты
        this.add
            .rectangle(
                0,
                0,
                this.game.scale.width * 2,
                this.game.scale.height * 2,
                0x0b589e
            )
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(-1);

        this.tokenCheckInterval = setInterval(async () => {
        const newToken = await this.checkToken();
        if (newToken) {
            this.accessToken = newToken;
        }
    }, 600000);
    }

    private async checkToken(): Promise<string | null> {
    try {
        const response = await fetch('http://localhost:3000/auth/refresh', {
            method: 'POST',
            credentials: 'include',
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.accessToken;
        }
        return null;
    } catch (error) {
        console.error('Ошибка обновления токена:', error);
        return null;
    }
    }   
    private createClouds() {
        const cloudTypes = ["cloud1", "cloud2", "cloud3", "cloud4", "cloud5"];

        // Создаем 5 облаков
        for (let i = 0; i < 50; i++) {
            // Выбираем случайный тип облака
            const cloudType = Phaser.Math.RND.pick(cloudTypes);

            // Случайная позиция X (в пределах ширины карты)
            const x = Phaser.Math.Between(-200, this.mapImage.displayWidth);

            // Случайная позиция Y (в пределах видимой области)
            const y = Phaser.Math.Between(50, this.mapImage.displayHeight);

            // Создаем облако в случайной позиции
            const cloud = this.add
                .image(x, y, cloudType)
                .setScale(Phaser.Math.FloatBetween(0.5, 1.0))
                .setAlpha(0.9)
                .setDepth(900);

            // Создаем тень для облака
            const shadow = this.add
                .image(x, y + 30, cloudType)
                .setTint(0x000000)
                .setAlpha(0.2)
                .setScale(cloud.scaleX * 1.1, cloud.scaleY * 0.7)
                .setDepth(899);

            this.clouds.push(cloud);
            this.cloudShadows.push(shadow);

            // Запускаем анимацию движения для облака и его тени
            this.startCloudAnimation(cloud, shadow);
        }
    }

    private startCloudAnimation(
        cloud: Phaser.GameObjects.Image,
        shadow: Phaser.GameObjects.Image
    ) {
        // Случайная скорость движения (пикселей в секунду)
        const speed = Phaser.Math.Between(20, 50);

        // Если облако уже находится на карте (не за левой границей)
        if (cloud.x > -cloud.displayWidth) {
            // Вычисляем оставшееся расстояние до правой границы
            const remainingDistance =
                this.game.scale.width + cloud.displayWidth - cloud.x;
            const delay = Phaser.Math.Between(0, 0);

            this.time.delayedCall(delay, () => {
                this.tweens.add({
                    targets: [cloud, shadow],
                    x: this.game.scale.width + cloud.displayWidth,
                    duration: (remainingDistance * 1000) / speed,
                    ease: "Linear",
                    onComplete: () => {
                        this.resetCloud(cloud, shadow);
                    },
                });
            });
        } else {
            // Если облако за левой границей, двигаем его как обычно
            this.tweens.add({
                targets: [cloud, shadow],
                x: this.game.scale.width + cloud.displayWidth,
                duration:
                    ((this.game.scale.width + cloud.displayWidth * 2) * 1000) /
                    speed,
                ease: "Linear",
                onComplete: () => {
                    this.resetCloud(cloud, shadow);
                },
            });
        }
    }

    private resetCloud(
        cloud: Phaser.GameObjects.Image,
        shadow: Phaser.GameObjects.Image
    ) {
        // Случайный тип облака (может измениться)
        const cloudTypes = ["cloud1", "cloud2", "cloud3", "cloud4", "cloud5"];
        const newType = Phaser.Math.RND.pick(cloudTypes);

        // Обновляем текстуру облака
        cloud.setTexture(newType);
        shadow.setTexture(newType);

        // Случайные параметры для нового облака
        const newScale = Phaser.Math.FloatBetween(0.5, 1.0);
        const newY = Phaser.Math.Between(50, this.mapImage.displayHeight);

        // Устанавливаем новые параметры
        cloud
            .setScale(newScale)
            .setAlpha(0.9)
            .setPosition(-cloud.displayWidth, newY);

        shadow
            .setScale(newScale * 1.1, newScale * 0.7)
            .setAlpha(0.2)
            .setPosition(-shadow.displayWidth, newY + 30);

        // Запускаем анимацию снова
        this.startCloudAnimation(cloud, shadow);
    }
    private createInterfaceButtonsContainer() {
        const oldContainer = document.getElementById('interface-buttons-container');
        if (oldContainer) oldContainer.remove();
        
        const container = document.createElement('div');
        container.id = 'interface-buttons-container';
        container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.getElementById('game-container')?.appendChild(container);
        
        this.interfaceButtonsRoot = createRoot(container);
        
        this.interfaceButtonsRoot.render(
            <>
                <ProfileButton onClick={() => this.showProfileModal()} />
                <LogoutButton onClick={async () => {
                    try {
                        await this.fetchWithAuth("http://localhost:3000/auth/logout", {
                            method: "POST",
                            credentials: "include",
                        });
                        this.destroyInterfaceButtons();
                        this.scene.start("Intro");
                    } catch (error) {
                        console.error("Ошибка выхода:", error);
                    }
                }} />
            </>
        );
    }

    // Добавим метод для очистки кнопок:
    private destroyInterfaceButtons() {
        if (this.interfaceButtonsRoot) {
            this.interfaceButtonsRoot.unmount();
            this.interfaceButtonsRoot = null;
        }
        const container = document.getElementById('interface-buttons-container');
        if (container) container.remove();
    }
    private async loadLevelsFromServer() {
        try {
            const response = await this.fetchWithAuth("http://localhost:3000/levels", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });

            if (response.ok) {
                const levels = await response.json();
                this.createLevelMarkers(levels);
            } else {
                console.error("Failed to load levels");
                // Можно создать дефолтные уровни или показать сообщение об ошибке
            }
        } catch (error) {
            console.error("Error loading levels:", error);
        }
    }

    private createLevelMarkers(levels: any[]) {
        levels.forEach((level) => {
            this.createLevelMarker(
                level.data.x_position,
                level.data.y_position,
                level.level_id,
                [
                    { name: "name", value: level.name },
                    { name: "difficulty", value: level.difficulty },
                    { name: "timeLimit", value: level.time_limit },
                    { name: "description", value: level.description },
                    { name: "data", value: level.data }, // JSON с дополнительными данными
                ]
            );
        });
    }
    private createLevelModal() {
        const oldModal = document.getElementById("level-modal");
        if (oldModal) oldModal.remove();
        
        this.levelModal = document.createElement("div");
        this.levelModal.id = "level-modal";
        document.getElementById("game-container")?.appendChild(this.levelModal);
    }
    private showLevelModal(levelData: any) {
    this.currentLevelData = levelData;
    
    const getProperty = (name: string) => 
            levelData.find((p: any) => p.name === name)?.value || "Не указано";

    const levelConfig = levelData.find((p: any) => p.name === "data")?.value || {};
    
    const levelModalRoot = createRoot(this.levelModal);
    
    levelModalRoot.render(
        React.createElement(LevelModal, {
            levelData: {
                name: getProperty("name"),
                difficulty: getProperty("difficulty"),
                timeLimit: getProperty("timeLimit"),
                description: getProperty("description"),
                symbolsRu: levelConfig.ru,
                symbolsEng: levelConfig.eng,
            },
            onStart: (language: 'ru' | 'eng') => {
                if (levelConfig) {
                    this.hideLevelModal();
                    this.destroyInterfaceButtons();
                    this.scene.start("LevelPreloader", {
                        levelConfig: {
                            ...levelConfig,
                            selectedLanguage: language
                        },
                        accessToken: this.accessToken,
                    });
                }
            },
            onClose: () => this.hideLevelModal()
        })
    );

    // Пауза игры
    this.game.loop.sleep();
}


    private hideLevelModal() {
        if (this.levelModal) {
            this.levelModal.innerHTML = "";
        }
        this.game.loop.wake();
    }

    private setupCameraBounds() {
        const mapWidth = this.mapImage.displayWidth;
        const mapHeight = this.mapImage.displayHeight;

        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2).setZoom(2);
    }

    private setupCameraControls() {
        // Включаем перетаскивание камеры при зажатии ЛКМ
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) {
                this.isDragging = true;
                this.dragStart = { x: pointer.x, y: pointer.y };
                this.cameraStart = {
                    x: this.cameras.main.scrollX,
                    y: this.cameras.main.scrollY,
                };
            }
        });

        this.input.on("pointerup", () => {
            this.isDragging = false;
            this.dragStart = null;
            this.cameraStart = null;
        });

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging && this.dragStart && this.cameraStart) {
                const dx = this.dragStart.x - pointer.x;
                const dy = this.dragStart.y - pointer.y;

                this.cameras.main.scrollX = this.cameraStart.x + dx;
                this.cameras.main.scrollY = this.cameraStart.y + dy;
            }
        });

        // Отключаем зум колесиком мыши
        this.input.off("wheel");
    }

    private createLevelMarker(
        x: number,
        y: number,
        index: number,
        properties: any
    ) {
        const marker = this.add
            .image(x, y, "levelMarkerOff")
            .setInteractive({ cursor: "pointer" })
            .setData("levelData", properties)
            .setDepth(1000)
            .setScale(3);

        marker.on("pointerover", () => {
            marker.setTexture("levelMarkerOn").setScale(4);
            this.showLevelInfo(marker);
        });

        marker.on("pointerout", () => {
            marker.setTexture("levelMarkerOff").setScale(3);
            this.hideLevelInfo();
        });

        marker.on("pointerdown", () => {
            this.showLevelModal(marker.getData("levelData"));
        });

        this.levelMarkers.push(marker);
    }

    private showLevelInfo(marker: Phaser.GameObjects.Image) {
        const levelName =
            marker.getData("levelData").find((p: any) => p.name === "name")
                ?.value || "Уровень";

        this.levelInfo = this.add
            .text(marker.x, marker.y - 50, levelName, {
                font: "18px RuneScape",
                color: "#7a5859",
                backgroundColor: "#f0d2a8",
                padding: { x: 15, y: 8 },
            })
            .setOrigin(0.5)
            .setDepth(1001);
    }

    private hideLevelInfo() {
        if (this.levelInfo) {
            this.levelInfo.destroy();
            this.dragStart = null;
            this.levelInfo = null;
        }
    }

    private createProfileModalContainer() {
        const oldContainer = document.getElementById("profile-modal-container");
        if (oldContainer) oldContainer.remove();
        
        this.profileModalContainer = document.createElement("div");
        this.profileModalContainer.id = "profile-modal-container";
        document.getElementById("game-container")?.appendChild(this.profileModalContainer);
    }

    private showProfileModal() {
        this.profileModalOpen = true;
        this.renderProfileModal();
        this.game.loop.sleep();
    }

    private hideProfileModal() {
        if (this.profileModalRoot) {
            this.profileModalRoot.unmount();
            this.profileModalRoot = null;
        }
        this.game.loop.wake();
    }

    private async loadProfileData() {
    try {
        // Загружаем статистику пользователя
        const statsResponse = await this.fetchWithAuth("http://localhost:3000/results/user/stats", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${this.accessToken}`,
        },
        });

        // Загружаем историю уровней
        const historyResponse = await this.fetchWithAuth("http://localhost:3000/results/user", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${this.accessToken}`,
        },
        });

        // Загружаем достижения
        const achievementsResponse = await this.fetchWithAuth("http://localhost:3000/achievements/user", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${this.accessToken}`,
        },
        });

        // Загружаем все возможные достижения
        const allAchievementsResponse = await this.fetchWithAuth("http://localhost:3000/achievements", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${this.accessToken}`,
        },
        });

        if (statsResponse.ok && historyResponse.ok && achievementsResponse.ok && allAchievementsResponse.ok) {
        const stats = await statsResponse.json();
        const history = await historyResponse.json();
        const userAchievements = await achievementsResponse.json();
        const allAchievements = await allAchievementsResponse.json();

        // Создаем полный список достижений с отметкой о получении
        const achievements = allAchievements.map((achievement) => {
            const unlocked = userAchievements.some(
            (ua) => ua.achievement_id === achievement.achievement_id
            );
            return {
            ...achievement,
            completed: unlocked,
            };
        });

        return {
            userStats: {
            averageCpm: stats.averageCpm,
            totalScore: stats.totalScore,
            averageAccuracy: stats.averageAccuracy,
            totalErrors: stats.totalErrors,
            },
            levelHistory: history.map((result) => ({
            id: result.result_id,
            levelName: result.level?.name || "Неизвестный уровень",
            score: result.score,
            time: this.formatTime(result.completion_time),
            errors: result.errors_count,
            date: new Date(result.achieved_at).toLocaleDateString(),
            })),
            achievements,
        };
        }
    } catch (error) {
        console.error("Error loading profile data:", error);
        return null;
    }
    }

    private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    private async renderProfileModal() {
    const profileData = await this.loadProfileData();
    
    if (!this.profileModalRoot) {
        this.profileModalRoot = createRoot(this.profileModalContainer);
    }

    this.profileModalRoot.render(
        React.createElement(ProfileModal, {
        onClose: () => this.hideProfileModal(),
        userStats: profileData?.userStats || {
            averageCpm: 0,
            totalScore: 0,
            averageAccuracy: 0,
            totalErrors: 0
        },
        levelHistory: profileData?.levelHistory || [],
        achievements: profileData?.achievements || []
        })
    );
    }
    private async fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
    let response = await fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            Authorization: `Bearer ${this.accessToken}`,
        },
        credentials: 'include',
    });

    // Если токен истек, пробуем обновить его
    if (response.status === 401) {
        const refreshResponse = await fetch('http://localhost:3000/auth/refresh', {
            method: 'POST',
            credentials: 'include',
        });

        if (refreshResponse.ok) {
            const tokensData = await refreshResponse.json();
            this.accessToken = tokensData.accessToken;
            
            // Повторяем исходный запрос с новым токеном
            response = await fetch(input, {
                ...init,
                headers: {
                    ...init?.headers,
                    Authorization: `Bearer ${this.accessToken}`,
                },
                credentials: 'include',
            });
        }
    }

    return response;
}
}
