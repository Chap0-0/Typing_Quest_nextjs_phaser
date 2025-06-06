import React, { useState } from 'react';

interface LevelModalProps {
  levelData: {
    name: string;
    difficulty: string;
    timeLimit: string;
    description: string;
    symbolsRu: string;
    symbolsEng: string;
  };
  onStart: (language: 'ru' | 'eng') => void;
  onClose: () => void;
}

const LevelModal: React.FC<LevelModalProps> = ({ levelData, onStart, onClose }) => {
  const [language, setLanguage] = useState<'ru' | 'eng'>('ru');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="relative w-full max-w-2xl bg-[#f5d5a6] border-2 border-[#7a5859] rounded-lg overflow-hidden shadow-xl"
        style={{ fontFamily: "'RuneScape', Arial, sans-serif" }}
      >
        {/* Заголовок */}
        <div className="bg-[#7a5859] p-4 text-center">
          <h2 className="text-2xl font-bold text-[#fee1b8]">{levelData.name}</h2>
        </div>

        {/* Основное содержимое */}
        <div className="p-6 text-[#7a5859]">
          {/* Блок информации */}
          <div className="mb-6 bg-[#fee1b8] p-4 rounded-lg border border-[#7a5859]">
            <div className="flex justify-between mb-3">
              <span className="text-2xl">Сложность:</span>
              <span className="text-2xl font-semibold">{levelData.difficulty}</span>
            </div>
            
            <div className="flex justify-between mb-3">
              <span className="text-2xl">Лимит времени:</span>
              <span className="text-2xl font-semibold">{levelData.timeLimit} минут</span>
            </div>
            
            {/* Переключатель языка */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">Язык ввода:</span>
              <div className="flex items-center">
                <button
                  className={`px-4 py-2 text-xl ${language === 'ru' ? 'bg-[#4a752c] text-white' : 'bg-gray-300'}`}
                  onClick={() => setLanguage('ru')}
                >
                  RU
                </button>
                <button
                  className={`px-4 py-2 text-xl ${language === 'eng' ? 'bg-[#4a752c] text-white' : 'bg-gray-300'}`}
                  onClick={() => setLanguage('eng')}
                >
                  ENG
                </button>
              </div>
            </div>

            {/* Блок с символами */}
            <div className="mt-4">
              <div className="text-2xl mb-2">Символы:</div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="text-xl text-center mb-1">Русские</div>
                  <div className="text-2xl font-semibold bg-[#e8c9a0] p-2 rounded border border-[#7a5859] text-center">
                    {levelData.symbolsRu}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xl text-center mb-1">Английские</div>
                  <div className="text-2xl font-semibold bg-[#e8c9a0] p-2 rounded border border-[#7a5859] text-center">
                    {levelData.symbolsEng}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Описание */}
          <div className="mb-6 bg-[#fee1b8] p-4 rounded-lg min-h-24 border border-[#7a5859]">
            <p className="text-lg leading-relaxed">{levelData.description}</p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onStart(language)}
              className="bg-[#4a752c] hover:bg-[#5a8a3c] text-white py-3 px-6 rounded-lg text-2xl transition-colors border-2 border-[#3a652c]"
            >
              Начать уровень
            </button>
            <button
              onClick={onClose}
              className="bg-[#602b2c] hover:bg-[#703b3c] text-white py-3 px-6 rounded-lg text-2xl transition-colors border-2 border-[#502b2c]"
            >
              Вернуться на карту
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelModal;