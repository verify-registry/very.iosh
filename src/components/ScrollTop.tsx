import React, { useEffect, useState } from 'react';

export const ScrollTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      title="Back to top"
      aria-label="Back to top"
      className={`fixed right-[60px] bottom-[54px] max-md:right-4 max-md:bottom-4 z-[9999] w-[44px] h-[44px] flex items-center justify-center p-0 border-0 rounded bg-[#6055e0] text-white cursor-pointer shadow-md transition-all duration-200 ${
        visible ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-[22px] h-[22px]"
      >
        <path
          d="M12 19V6M6 12l6-6 6 6"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
