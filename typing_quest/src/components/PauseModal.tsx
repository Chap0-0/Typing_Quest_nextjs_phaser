import React from 'react';

interface PauseModalProps {
  onResume: () => void;
  onToggleAudio: () => void;
  onReturnToMap: () => void;
}

const PauseModal: React.FC<PauseModalProps> = ({ onResume, onToggleAudio, onReturnToMap }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="relative w-full max-w-xs bg-[#f5d5a6] border-2 border-[#7a5859] rounded-lg overflow-hidden shadow-xl"
        style={{ fontFamily: "'RuneScape', Arial, sans-serif" }}
      >
        {/* Заголовок */}
        <div className="bg-[#7a5859] p-4 text-center">
          <h2 className="text-2xl font-bold text-[#fee1b8]">Пауза</h2>
        </div>

        {/* Основное содержимое */}
        <div className="p-6 text-[#7a5859]">
          <div className="flex flex-col gap-4">
            <button
              onClick={onToggleAudio}
              className="bg-[#e8c9a0] hover:bg-[#f0d2a8] text-[#7a5859] py-2 px-4 rounded-lg text-xl transition-colors border border-[#7a5859]"
            >
              🔈 Звук
            </button>
            
            <button
              onClick={onResume}
              className="bg-[#4a752c] hover:bg-[#5a8a3c] text-white py-2 px-4 rounded-lg text-xl transition-colors border-2 border-[#3a652c]"
            >
              Продолжить
            </button>
            
            <button
              onClick={onReturnToMap}
              className="bg-[#602b2c] hover:bg-[#703b3c] text-white py-2 px-4 rounded-lg text-xl transition-colors border-2 border-[#502b2c]"
            >
              На карту
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseModal;