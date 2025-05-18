import { Scene, Tilemaps, GameObjects } from "phaser";

export class Intro extends Scene {
    logo: GameObjects.Image;
    startButton: GameObjects.Container;
    aboutButton: GameObjects.Container;
    map: Tilemaps.Tilemap;
    tileset: Tilemaps.Tileset;
    backgroundLayer: Tilemaps.Layer;
    bg_clouds_1: GameObjects.Image; // Первое изображение облаков
    bg_clouds_2: GameObjects.Image; // Второе изображение облаков
    private authFormHTML!: HTMLDivElement;
    private registerFormHTML!: HTMLDivElement;
    private currentForm: "auth" | "register" | null = null;
    private isFormOpen: boolean = false; // Флаг открытой формы
    private interactiveElements: GameObjects.GameObject[] = [];

    constructor() {
        super("Intro");
    }

    create() {
        this.map = this.make.tilemap({ key: "intro-bg-map" });
        this.tileset = this.map.addTilesetImage("1", "intro-tiles");

        this.backgroundLayer = this.map
            .createLayer("main", this.tileset, 0, 0)
            .setDepth(2);
        this.backgroundLayer_2 = this.map
            .createLayer("background", this.tileset, 0, 0)
            .setDepth(1);

        console.log(this.tileset);
        this.interactiveElements = [];
        // Вычисляем соотношение для масштабирования карты по ширине
        const mapWidth = this.map.widthInPixels;
        const scaleRatio = this.scale.width / mapWidth;
        this.backgroundLayer.setScale(scaleRatio); // Масштабируем по ширине экрана
        this.backgroundLayer_2.setScale(scaleRatio);

        // Фоновое изображение
        const bg_sky = this.add
            .image(0, 0, "bg-sky")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
        this.bg_clouds_1 = this.add
            .image(0, 0, "bg-clouds")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
        this.bg_clouds_2 = this.add
            .image(this.scale.width, 0, "bg-clouds")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        const bg_mounts = this.add
            .image(0, 0, "bg-mounts")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Логотип с адаптивным размером
        this.logo = this.add
            .image(this.scale.width / 2, this.scale.height / 4, "logo")
            .setOrigin(0.5)
            .setDepth(2);
        this.resizeLogo(); // Устанавливаем размер логотипа

        // Создаем DOM-элементы форм
        this.createAuthFormHTML();
        this.createRegisterFormHTML();

        this.startButton = this.createButton(
        this.scale.width / 2,
        this.logo.y + 250,
        "Начать",
        async () => {
            if (!this.isFormOpen) {
            const isAuthenticated = await this.checkAuth();
            if (isAuthenticated) {
                this.scene.start('Map');
            } else {
                this.showAuthForm();
            }
            }
        }
        ).setDepth(3);

        // Кнопка "О проекте"
        this.aboutButton = this.createButton(
            this.scale.width / 2,
            this.startButton.y + 100,
            "О проекте",
            () => {
                if (!this.isFormOpen) window.open("/about", "_blank");
            }
        ).setDepth(3);

        // Добавляем элементы в массив после их создания
        this.interactiveElements.push(this.startButton, this.aboutButton);

        // Обработчик изменения размера экрана
        this.scale.on("resize", this.resize, this);
    }

    // Функция для создания кнопок
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
                font: "24px Arial",
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
        // Двигаем оба изображения облаков вправо
        this.bg_clouds_1.x += cloudSpeed;
        this.bg_clouds_2.x += cloudSpeed;

        // Если первое изображение полностью вышло за экран справа, перемещаем его за второе
        if (this.bg_clouds_1.x >= this.scale.width) {
            this.bg_clouds_1.x = this.bg_clouds_2.x - this.scale.width;
        }

        // Если второе изображение полностью вышло за экран справа, перемещаем его за первое
        if (this.bg_clouds_2.x >= this.scale.width) {
            this.bg_clouds_2.x = this.bg_clouds_1.x - this.scale.width;
        }
    }
    resizeLogo() {
        const logoScale = this.scale.width * 0.3; // Логотип будет занимать 30% ширины экрана
        this.logo.setDisplaySize(
            logoScale,
            this.logo.height * (logoScale / this.logo.width)
        );
    }

    resize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Перемещаем элементы при изменении размера экрана
        this.logo.setPosition(width / 2, height / 4);
        this.resizeLogo(); // Пересчитываем размер логотипа

        this.startButton.setPosition(width / 2, this.logo.y + 250);
        this.aboutButton.setPosition(width / 2, this.startButton.y + 100);
    }
    private async checkAuth(): Promise<boolean> {
    try {
        const response = await fetch('http://localhost:3000/auth/check', {
        method: 'GET',
        credentials: 'include',
        });

        if (response.ok) {
        const data = await response.json();
        return data.authenticated;
        }
        return false;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return false;
    }
    }
    private createAuthFormHTML() {
        // Создаем контейнер для формы
        this.authFormHTML = document.createElement("div");
        this.authFormHTML.className = "game-form";
        this.authFormHTML.style.display = "none";
        this.authFormHTML.innerHTML = `
            <div class="form-container">
                <img src="assets/intro/auth-ui.png" class="form-background">
                <div class="form-content">
                    <div class="title-background">
                        <h2 class="form-title">Авторизация</h2>
                    </div>
                    <div class="input-background">
                        <input type="text" class="form-input" placeholder="Имя">
                    </div>
                    <div class="input-background">
                        <input type="password" class="form-input" placeholder="Пароль">
                    </div>
                    <a href="#" class="form-switch">Нет аккаунта? Зарегистрироваться</a>
                    <div class="button-background">
                        <button class="form-button">Войти</button>
                    </div>
                </div>
            </div>
        `;
        document
            .getElementById("game-container")
            ?.appendChild(this.authFormHTML);

        // Обработчики событий
        const loginBtn = this.authFormHTML.querySelector(".form-button")!;
        const switchLink = this.authFormHTML.querySelector(".form-switch")!;

        loginBtn.addEventListener("click", () => this.handleAuthSubmit());
        switchLink.addEventListener("click", (e) => {
            e.preventDefault();
            this.hideForm();
            this.showRegisterForm();
        });
    }

    private createRegisterFormHTML() {
        this.registerFormHTML = document.createElement("div");
        this.registerFormHTML.className = "game-form";
        this.registerFormHTML.style.display = "none";
        this.registerFormHTML.innerHTML = `
            <div class="form-container">
                <img src="assets/intro/register-ui.png" class="form-background">
                <div class="form-content">
                    <div class="title-background">
                        <h2 class="form-title">Регистрация</h2>
                    </div>
                    <div class="input-background">
                        <input type="text" class="form-input" placeholder="Имя">
                    </div>
                    <div class="input-background">
                        <input type="text" class="form-input" placeholder="Email">
                    </div>
                    <div class="input-background">
                        <input type="password" class="form-input" placeholder="Пароль">
                    </div>
                    <a href="#" class="form-switch">Уже есть аккаунт? Войти</a>
                    <div class="button-background">
                        <button class="form-button">Зарегистрироваться</button>
                    </div>
                </div>
            </div>
        `;
        document
            .getElementById("game-container")
            ?.appendChild(this.registerFormHTML);

        // Обработчики событий
        const registerBtn =
            this.registerFormHTML.querySelector(".form-button")!;
        const switchLink = this.registerFormHTML.querySelector(".form-switch")!;

        registerBtn.addEventListener("click", () =>
            this.handleRegisterSubmit()
        );
        switchLink.addEventListener("click", (e) => {
            e.preventDefault();
            this.hideForm();
            this.showAuthForm();
        });
    }

    private showAuthForm() {
        this.hideForm();
        this.currentForm = "auth";
        this.isFormOpen = true;
        this.disableBackgroundInteractivity();
        this.addOverlay();

        // Позиционируем форму выше экрана перед анимацией
        this.authFormHTML.style.top = "-100%";
        this.authFormHTML.style.display = "block";

        // Анимация выкатывания
        setTimeout(() => {
            this.authFormHTML.style.transition = "top 0.5s ease-out";
            this.authFormHTML.style.top = "50%";
        }, 10);
    }

    private showRegisterForm() {
        this.hideForm();
        this.currentForm = "register";
        this.isFormOpen = true;
        this.disableBackgroundInteractivity();
        this.addOverlay();

        // Позиционируем форму выше экрана перед анимацией
        this.registerFormHTML.style.top = "-100%";
        this.registerFormHTML.style.display = "block";

        // Анимация выкатывания
        setTimeout(() => {
            this.registerFormHTML.style.transition = "top 0.5s ease-out";
            this.registerFormHTML.style.top = "50%";
        }, 10);
    }

    private hideForm() {
        if (this.currentForm === "auth") {
            // Анимация скрытия вверх
            this.authFormHTML.style.transition =
                "top 0.5s ease-out, opacity 0.3s ease-out";
            this.authFormHTML.style.top = "-100%";

            // После завершения анимации скрываем форму
            setTimeout(() => {
                this.authFormHTML.style.display = "none";
            }, 500);
        } else if (this.currentForm === "register") {
            // Аналогично для формы регистрации
            this.registerFormHTML.style.transition =
                "top 0.5s ease-out, opacity 0.3s ease-out";
            this.registerFormHTML.style.top = "-100%";

            setTimeout(() => {
                this.registerFormHTML.style.display = "none";
            }, 500);
        }
        this.isFormOpen = false;
        this.enableBackgroundInteractivity();
        this.removeOverlay();
        this.currentForm = null;
    }

     private disableBackgroundInteractivity() {
        // Отключаем интерактивность всех элементов фона
        this.interactiveElements.forEach(element => {
            if (element && typeof element.setInteractive === 'function') {
                element.removeInteractive();
            }
        });
        
        // Также можно добавить визуальный эффект затемнения
        this.tweens.add({
            targets: [this.logo, this.startButton, this.aboutButton],
            alpha: 0.5,
            duration: 300
        });
    }

    private enableBackgroundInteractivity() {
        // Включаем интерактивность обратно
        this.interactiveElements.forEach(element => {
            if (element && typeof element.setInteractive === 'function') {
                // Для контейнера нужно повторно задать interactive
                if (element instanceof Phaser.GameObjects.Container) {
                    element.setInteractive({ useHandCursor: true });
                } else {
                    element.setInteractive();
                }
            }
        });
        
        // Возвращаем нормальную прозрачность
        this.tweens.add({
            targets: [this.logo, this.startButton, this.aboutButton],
            alpha: 1,
            duration: 300
        });
    }

    private addOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "game-overlay";
        overlay.id = "game-overlay";
        overlay.style.opacity = "0";

        // Закрытие формы при клике на оверлей
        overlay.addEventListener("click", () => this.hideForm());

        document.getElementById("game-container")?.appendChild(overlay);

        // Анимация появления оверлея
        setTimeout(() => {
            overlay.style.transition = "opacity 0.3s ease-out";
            overlay.style.opacity = "1";
        }, 10);
    }

    private removeOverlay() {
        const overlay = document.getElementById("game-overlay");
        if (overlay) {
            // Анимация исчезновения оверлея
            overlay.style.transition = "opacity 0.3s ease-out";
            overlay.style.opacity = "0";

            // Удаляем после завершения анимации
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

        private async handleAuthSubmit() {
    const inputs = this.authFormHTML.querySelectorAll(".form-input");
    const username = (inputs[0] as HTMLInputElement).value;
    const password = (inputs[1] as HTMLInputElement).value;

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
        console.log('Успешный вход:', data);
        
        // Сохраняем данные пользователя
        let currentUser = data.user;
        
        // Закрываем форму и переходим на сцену Map
        this.hideForm();
        this.scene.start('Map');
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        alert(error.message);
    }
    }

    private async handleRegisterSubmit() {
    const inputs = this.registerFormHTML.querySelectorAll(".form-input");
    const username = (inputs[0] as HTMLInputElement).value;
    const email = (inputs[1] as HTMLInputElement).value;
    const password = (inputs[2] as HTMLInputElement).value;

    try {
        const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include', // Для работы с куками
        });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка регистрации');
        }

        const data = await response.json();
        console.log('Успешная регистрация:', data);
        this.hideForm();

        // Закрываем форму после успешной регистрации
        this.scene.start('Map');
        
        // Здесь можно сохранить accessToken в памяти для последующих запросов
        // и перенаправить пользователя или обновить UI
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        alert(error.message);
    }
    }
}
