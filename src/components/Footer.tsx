import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#1e1e2c] py-6 px-5 mt-auto">
      <div className="max-w-[2640px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8c8c9e]">
        <div className="font-normal">
          2026 © DSSL
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer Navigation">
          <a
            href="https://very.iosh.com/Pages/Privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8c8c9e] hover:text-white transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://very.iosh.com/Pages/Faq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8c8c9e] hover:text-white transition-colors"
          >
            FAQ
          </a>
          <a
            href="https://very.iosh.com/Pages/Cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8c8c9e] hover:text-white transition-colors"
          >
            Cookies
          </a>
          <a
            href="https://very.iosh.com/Pages/Terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8c8c9e] hover:text-white transition-colors"
          >
            Terms
          </a>
          <a
            href="https://very.iosh.com/Pages/Support"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8c8c9e] hover:text-white transition-colors"
          >
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
};
