// LogoutButton.tsx
import React from 'react';

interface LogoutButtonProps {
  onClick: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-6 text-[#f5d5a6] py-2 px-4 text-3xl font-runescape w-[220px] h-[60px] 
                 bg-[url('../../public/assets/ui/logout-button.png')] bg-cover bg-no-repeat bg-transparent border-none hover:opacity-90"
                style={{ fontFamily: "'RuneScape', Arial, sans-serif" }}

    >
      Выход
    </button>
  );
};

export default LogoutButton;