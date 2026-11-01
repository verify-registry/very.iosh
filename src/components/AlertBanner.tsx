import React from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

interface AlertBannerProps {
  type: AlertType;
  message: React.ReactNode;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, message }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-[#007a5a] border-[#007a5a] text-white';
      case 'warning':
        return 'bg-[#ffc107] border-[#ffc107] text-[#212529]';
      case 'danger':
        return 'bg-[#dc3545] border-[#dc3545] text-white';
      case 'info':
      default:
        return 'bg-[#007a5a] border-[#007a5a] text-white';
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
      case 'info':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 shrink-0 block"
          >
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="m8.3 12.7 2.5 2.5 4.9-5.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 shrink-0 block"
          >
            <path
              d="M12 3 22 21H2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 9v5m0 3h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'danger':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 shrink-0 block"
          >
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="m8.5 8.5 7 7m0-7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
    }
  };

  return (
    <div
      role="status"
      className={`flex items-center w-full min-h-[57px] max-md:min-h-[48px] px-6 py-[15px] max-md:px-3.5 max-md:py-2.5 mb-[33px] max-md:mb-[14px] border rounded-[3px] text-[16px] max-md:text-[13px] font-normal leading-normal shadow-none ${getStyles()}`}
    >
      <div className="shrink-0 w-6 h-6 max-md:w-[22px] max-md:h-[22px] mr-[22px] max-md:mr-[10px] flex items-center justify-center">
        {renderIcon()}
      </div>
      <div className="grow min-w-0 text-left text-inherit font-['Poppins']">
        {message}
      </div>
    </div>
  );
};
