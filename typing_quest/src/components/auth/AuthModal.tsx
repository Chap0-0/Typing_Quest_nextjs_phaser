import React from 'react';

interface AuthModalProps {
  scene: any;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ scene, onClose, onSwitchToRegister }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scene.handleAuthSubmit(username, password);
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center text-black" style={{ fontFamily: "'RuneScape', Arial, sans-serif" }}>
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-300 cursor-default"
        onClick={onClose}
      ></div>
      
      <div className="relative w-[500px] z-[1000]">
        <img 
          src="assets/intro/auth-ui.png" 
          className="w-full h-auto block"
          alt="Auth background"
        />
        
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-10 box-border">
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-4">
            <div 
              className="w-[100%] z-[1001] bg-[url('/assets/ui/title-auth.png')] bg-cover bg-no-repeat py-[25px] text-center -mt-20 mb-4"
              style={{ backgroundSize: '100% 100%' }}
            >
              <h2 className="text-[28px] font-bold text-white font-runescape text-shadow">
                Авторизация
              </h2>
            </div>
            
            <div 
              className="w-[85%] h-[60px] flex items-center bg-[url('/assets/ui/input-auth.png')] bg-cover bg-no-repeat py-3 px-[10px]"
              style={{ backgroundSize: '100% 100%' }}
            >
              <input
                type="text"
                name="username"
                placeholder="Имя"
                className="w-full bg-transparent text-black placeholder-brown-300 focus:outline-none text-[24px] font-runescape p-3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div 
              className="w-[85%] h-[60px] flex items-center bg-[url('/assets/ui/input-auth.png')] bg-cover bg-no-repeat py-3 px-[10px]"
              style={{ backgroundSize: '100% 100%' }}
            >
              <input
                type="password"
                name="password"
                placeholder="Пароль"
                className="w-full bg-transparent text-black placeholder-brown-300 focus:outline-none text-[24px] font-runescape p-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="text-center mt-[15px]">
              <a 
                href="#" 
                className="text-black text-[24px] font-runescape hover:text-brown-800 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToRegister();
                }}
              >
                Нет аккаунта? Зарегистрироваться
              </a>
            </div>
            
            <div 
              className="w-[85%] h-[60px] my-[25px] flex items-center justify-center bg-[url('/assets/ui/button-auth.png')] bg-cover bg-no-repeat p-[10px]"
              style={{ backgroundSize: '100% 100%' }}
            >
              <button 
                type="submit"
                className="w-full h-full bg-transparent border-none text-white text-[28px] font-runescape cursor-pointer focus:outline-none"
              >
                Войти
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};