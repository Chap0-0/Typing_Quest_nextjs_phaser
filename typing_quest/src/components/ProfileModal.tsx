import React from 'react';

interface ProfileModalProps {
  onClose: () => void;
  userStats: {
    averageCpm: number;
    totalScore: number;
    averageAccuracy: number;
    totalErrors: number;
  };
  levelHistory: Array<{
    id: number;
    levelName: string;
    score: number;
    time: string;
    errors: number;
    date: string;
  }>;
  achievements: Array<{
    achievement_id: number;
    title: string;
    description: string;
    condition_text: string;
    icon_path: string;
    completed: boolean;
  }>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  onClose, 
  userStats, 
  levelHistory, 
  achievements 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div 
                className="relative rounded-lg shadow-xl w-4/5 h-4/5 flex overflow-hidden border border-[#7a5859]"
                style={{ 
                    backgroundColor: '#fee1b8',
                    fontFamily: "'RuneScape', Arial, sans-serif" 
                }}
            >
                {/* Основное содержимое */}
                <div className="flex-1 p-6 overflow-y-auto text-[#7a5859]">
                    {/* Заголовок и кнопка закрытия */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Профиль игрока</h2>
                        <button 
                            onClick={onClose}
                            className="text-[#7a5859] hover:text-[#5a3839] text-6xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Основная статистика */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#f5d5a6] p-4 rounded-lg border border-[#7a5859]">
                            <h3 className="text-xl font-semibold mb-2">Средняя скорость</h3>
                            <p className="text-4xl font-bold">{userStats.averageCpm.toFixed(1)} <span className="text-xl">зн./мин</span></p>
                        </div>
                        <div className="bg-[#f5d5a6] p-4 rounded-lg border border-[#7a5859]">
                            <h3 className="text-xl font-semibold mb-2">Общие очки</h3>
                            <p className="text-4xl font-bold">{userStats.totalScore}</p>
                        </div>
                        <div className="bg-[#f5d5a6] p-4 rounded-lg border border-[#7a5859]">
                            <h3 className="text-xl font-semibold mb-2">Ошибки</h3>
                            <p className="text-4xl font-bold">{userStats.totalErrors}</p>
                        </div>
                        <div className="bg-[#f5d5a6] p-4 rounded-lg border border-[#7a5859]">
                            <h3 className="text-xl font-semibold mb-2">Точность</h3>
                            <p className="text-4xl font-bold">{userStats.averageAccuracy.toFixed(2)}%</p>
                        </div>
                    </div>

                    {/* История уровней */}
                    <div className="mb-6">
                        <h3 className="text-2xl font-semibold mb-4">История прохождения</h3>
                        <div className="overflow-y-auto max-h-64">
                            <table className="w-full">
                                <thead className="bg-[#f5d5a6] border border-[#7a5859]">
                                    <tr>
                                        <th className="p-3 text-left border-r border-[#7a5859]">Уровень</th>
                                        <th className="p-3 text-left border-r border-[#7a5859]">Очки</th>
                                        <th className="p-3 text-left border-r border-[#7a5859]">Время</th>
                                        <th className="p-3 text-left border-r border-[#7a5859]">Ошибки</th>
                                        <th className="p-3 text-left">Дата</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {levelHistory.map((level) => (
                                        <tr 
                                            key={level.id} 
                                            className="border-b border-[#7a5859] hover:bg-[#f5d5a6]"
                                        >
                                            <td className="p-3 border-r border-[#7a5859]">{level.levelName}</td>
                                            <td className="p-3 border-r border-[#7a5859]">{level.score}</td>
                                            <td className="p-3 border-r border-[#7a5859]">{level.time}</td>
                                            <td className="p-3 border-r border-[#7a5859]">{level.errors}</td>
                                            <td className="p-3">{level.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Блок достижений - затемнённый вариант */}
                    <div className="w-1/3 p-6 overflow-y-auto border-l border-[#7a5859] bg-[#e8c9a0]">
                    <h3 className="text-2xl font-semibold text-[#7a5859] mb-4">Достижения</h3>
                    <div className="space-y-4">
                        {achievements.map((achievement) => (
                        <div 
                            key={achievement.achievement_id}
                            className={`p-4 rounded-lg border ${
                            achievement.completed 
                                ? 'border-[#4a752c] bg-[#f0d2a8]' 
                                : 'border-[#9a7879] bg-[#f0d2a8] opacity-70'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                            {achievement.icon_path && (
                                <img 
                                src={achievement.icon_path} 
                                alt={achievement.title}
                                className="w-12 h-12"
                                />
                            )}
                            <div>
                                <h4 className={`text-lg font-semibold ${
                                achievement.completed ? 'text-[#7a5859]' : 'text-[#9a7879]'
                                }`}>
                                {achievement.title}
                                </h4>
                                <p className="text-sm text-[#7a5859]">{achievement.description}</p>
                                <p className="text-xs mt-1 italic">{achievement.condition_text}</p>
                            </div>
                            </div>
                            <div className="mt-2 text-right">
                            {achievement.completed ? (
                                <span className="text-[#4a752c] font-bold">✓ Получено</span>
                            ) : (
                                <span className="text-[#9a7879]">Не получено</span>
                            )}
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
            </div>
        </div>
    );
};

export default ProfileModal;