import React, { useEffect, useRef } from 'react';

interface ResultsModalProps {
  stats: {
    levelId: number;
    time: string;
    accuracy: number;
    speed: number;
    errors: number;
    score: number;
    speedHistory?: Array<{ time: number; speed: number }>;
  };
  leaderboard: Array<{
    username: string;
    cpm: number;
    score: number;
  }>;
  onComplete: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ stats, leaderboard, onComplete }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (chartRef.current && stats.speedHistory?.length) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        drawSpeedChart(ctx, stats.speedHistory);
      }
    }
  }, [stats.speedHistory]);

  const drawSpeedChart = (ctx: CanvasRenderingContext2D, history: Array<{ time: number; speed: number }>) => {
        if (!history || history.length === 0) {
            // Рисуем сообщение об отсутствии данных
            ctx.fillStyle = '#7a5859';
            ctx.font = '14px RuneScape';
            ctx.textAlign = 'center';
            ctx.fillText('Данные о скорости не собраны', ctx.canvas.width/2, ctx.canvas.height/2);
            return;
        }

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);
    
    // Находим максимальные значения
    const maxTime = Math.max(...history.map(h => h.time));
    const maxSpeed = Math.max(...history.map(h => h.speed), 1);
    
    // Рисуем фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Рисуем сетку
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Горизонтальные линии (скорость)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (1 - i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Подписи значений скорости
      ctx.fillStyle = '#7a5859';
      ctx.font = '10px RuneScape';
      ctx.fillText(`${Math.round(maxSpeed * i / 5)}`, 5, y + 4);
    }
    
    // Вертикальные линии (время)
    const timeSteps = Math.min(5, maxTime);
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding + (width - 2 * padding) * (i / timeSteps);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Подписи времени
      ctx.fillStyle = '#7a5859';
      ctx.font = '10px RuneScape';
      ctx.fillText(`${Math.round(maxTime * i / timeSteps)}s`, x - 10, height - 5);
    }
    
    // Рисуем график
    ctx.strokeStyle = '#4a752c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    history.forEach((point, i) => {
      const x = padding + (point.time / maxTime) * (width - 2 * padding);
      const y = height - padding - (point.speed / maxSpeed) * (height - 2 * padding);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Точки на графике
      ctx.fillStyle = '#4a752c';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
            // Добавляем подпись средней скорости
        ctx.fillStyle = '#7a5859';
        ctx.font = '12px RuneScape';
        ctx.textAlign = 'right';
        ctx.fillText(`Средняя: ${stats.speed} CPM`, ctx.canvas.width - 10, 20);
    ctx.stroke();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="relative w-full max-w-4xl bg-[#f5d5a6] border-2 border-[#7a5859] rounded-lg overflow-hidden shadow-xl"
        style={{ fontFamily: "'RuneScape', Arial, sans-serif" }}
      >
        {/* Заголовок */}
        <div className="bg-[#7a5859] p-4 text-center">
          <h2 className="text-2xl font-bold text-[#fee1b8]">Уровень пройден!</h2>
        </div>

        {/* Основное содержимое */}
        <div className="p-6 text-[#7a5859] flex flex-col md:flex-row gap-6">
          {/* Статистика */}
          <div className="flex-1 space-y-4">
            <div className="bg-[#fee1b8] p-4 rounded-lg border border-[#7a5859]">
              <div className="flex justify-between mb-2">
                <span>Время:</span>
                <span className="font-bold">{stats.time}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Точность:</span>
                <span className="font-bold">{stats.accuracy}%</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Скорость:</span>
                <span className="font-bold">{stats.speed} CPM</span>
              </div>
              <div className="flex justify-between">
                <span>Ошибки:</span>
                <span className="font-bold">{stats.errors}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xl text-[#7a5859] mb-1">Итоговый счет</div>
              <div className="text-3xl font-bold text-[#4a752c]">{stats.score}</div>
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-[#4a752c] hover:bg-[#5a8a3c] text-white py-2 px-4 rounded-lg text-xl transition-colors border-2 border-[#3a652c]"
            >
              На карту
            </button>
          </div>

          {/* Лидерборд и график */}
          <div className="flex-1 space-y-4">
            <div className="bg-[#fee1b8] p-4 rounded-lg border border-[#7a5859]">
              <h3 className="text-xl font-bold mb-3 text-center">Топ игроков</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#7a5859]">
                    <th className="text-left pb-2">#</th>
                    <th className="text-left pb-2">Игрок</th>
                    <th className="text-right pb-2">CPM</th>
                    <th className="text-right pb-2">Очки</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-[#e8c9a0]/30' : ''}>
                      <td className="py-1">{index + 1}</td>
                      <td className="py-1">{item.username || "Аноним"}</td>
                      <td className="text-right py-1">{item.cpm}</td>
                      <td className="text-right py-1">{item.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#fee1b8] p-4 rounded-lg border border-[#7a5859]">
                <h3 className="text-xl font-bold mb-3 text-center">Ваша скорость</h3>
                <div className="bg-[#e8c9a0] p-2 rounded">
                    <canvas 
                        ref={chartRef} 
                        width="400" 
                        height="200"
                        className="w-full h-[200px]"
                    ></canvas>
                </div>
                {(!stats.speedHistory || stats.speedHistory.length === 0) && (
                    <p className="text-center text-sm mt-2 text-[#7a5859]">
                        Недостаточно данных для построения графика
                    </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;