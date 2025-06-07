import React from 'react';

interface ProfileButtonProps {
  onClick: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-22 right-6 text-[#7a5859] py-2 px-4 text-3xl font-runescape w-[220px] h-[60px] 
                bg-[url('../../public/assets/ui/profile-button.png')] bg-cover bg-no-repeat bg-transparent border-none hover:opacity-90"
            style={{ fontFamily: "'RuneScape', Arial, sans-serif" }}
    >
      Профиль
    </button>
  );
};

export default ProfileButton;