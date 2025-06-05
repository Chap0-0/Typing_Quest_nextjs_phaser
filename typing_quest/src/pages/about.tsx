import React from 'react';

const About = () => {
    return (
        <div className="min-h-screen py-12 px-4 relative">
            {/* Затемненный фон с изображением карты */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/assets/levels/Level_1/Level_1_bg.png" 
                    alt="Фон карты" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            {/* Основной контент */}
            <div className="relative z-10">
                {/* Логотип вместо заголовка */}
                <div className="max-w-6xl mx-auto mb-16 text-center">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/logo.png" 
                            alt="Typing Quest Logo" 
                            className="h-32 object-contain"
                        />
                    </div>
                    <div className="bg-[#fee1b8] border-2 border-[#7a5859] rounded-lg mx-auto max-w-3xl p-8 shadow-md">
                        <p className="text-2xl text-[#7a5859] font-bold">
                            ПРИКЛЮЧЕНИЕ В МИРЕ СЛЕПОЙ ПЕЧАТИ
                        </p>
                    </div>
                </div>

                {/* Блок 1: Краткое описание */}
                <ScrollBlock 
                    title="КРАТКОЕ ОПИСАНИЕ"
                    textContent={
                        <>
                            <p className="mb-4 text-2xl">TYPING QUEST - это интерактивный тренажер печати с элементами RPG.</p>
                            <p className="text-2xl">Повышайте скорость набора текста, проходя увлекательные квесты и сражаясь с клавиатурными монстрами.</p>
                        </>
                    }
                    imageContent={
                        <div className="rounded-lg h-full flex items-center justify-center">
                            <img 
                                src="/assets/gifs/about_gif_1.gif" 
                                alt="about_gif_1 animation" 
                                className="w-full h-64 object-contain"
                            />
                        </div>
                    }
                    reverse={false}
                />

                {/* Блок 2: Главная карта */}
                <ScrollBlock 
                    title="ГЛАВНАЯ КАРТА"
                    textContent={
                        <>
                            <p className="mb-4 text-2xl">Исследуйте пиксельный мир, состоящий из 5 уникальных локаций.</p>
                            <p className="text-2xl">Каждая локация представляет собой новый уровень сложности с особыми заданиями.</p>
                        </>
                    }
                    imageContent={
                        <div className="rounded-lg h-full flex items-center justify-center">
                            <img 
                                src="/assets/gifs/about_gif_2.gif" 
                                alt="about_gif_2 animation" 
                                className="w-full h-64 object-contain"
                            />
                        </div>
                    }
                    reverse={true}
                />

                {/* Блок 3: Основной процесс */}
                <ScrollBlock 
                    title="ОСНОВНОЙ ПРОЦЕСС"
                    textContent={
                        <>
                            <p className="mb-4 text-2xl">Набирайте текст быстрее противников, чтобы побеждать в битвах.</p>
                            <p className="text-2xl">Зарабатывайте очки опыта и улучшайте свои навыки печати.</p>
                        </>
                    }
                    imageContent={
                        <div className="rounded-lg h-full flex items-center justify-center">
                            <img 
                                src="/assets/gifs/battle.gif" 
                                alt="Battle animation" 
                                className="w-full h-64 object-contain"
                            />
                        </div>
                    }
                    reverse={false}
                />

                {/* Блок 4: Таблица лидеров */}
                <ScrollBlock 
                    title="ТАБЛИЦА ЛИДЕРОВ"
                    textContent={
                        <>
                            <p className="mb-4 text-2xl">Сравнивайте свои результаты с другими игроками.</p>
                            <p className="text-2xl">Займите место в топе и получите уникальные достижения!</p>
                        </>
                    }
                    imageContent={
                        <div className="rounded-lg h-full flex items-center justify-center">
                            <img 
                                src="/assets/gifs/leaderboard.gif" 
                                alt="Leaderboard animation" 
                                className="w-full h-64 object-contain"
                            />
                        </div>
                    }
                    reverse={true}
                />
            </div>
        </div>
    );
};

// Компонент блока
const ScrollBlock = ({ title, textContent, imageContent, reverse }) => {
    return (
        <div className="max-w-6xl mx-auto mb-16 bg-[#fee1b8] border-2 border-[#7a5859] rounded-xl shadow-lg overflow-hidden">
            {/* Заголовок блока */}
            <div className="bg-[#7a5859] px-8 py-4">
                <h2 className="text-2xl font-bold text-[#fee1b8] text-center">{title}</h2>
            </div>

            {/* Основное содержимое */}
            <div className={`flex flex-col md:flex-row ${reverse ? 'md:flex-row-reverse' : ''}`}>
                {/* Текстовый блок */}
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="text-[#7a5859] space-y-4">
                        {textContent}
                    </div>
                </div>

                {/* Изображение */}
                <div className="md:w-1/2 p-4 flex items-center justify-center min-h-64">
                    {imageContent}
                </div>
            </div>
        </div>
    );
};

export default About;