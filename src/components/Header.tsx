import React from 'react';

interface HeaderProps {
  currentRef?: string;
  onSearchRef?: (ref: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRef, onSearchRef }) => {
  const [inputValue, setInputValue] = React.useState(currentRef || '');

  React.useEffect(() => {
    setInputValue(currentRef || '');
  }, [currentRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchRef) {
      onSearchRef(inputValue.trim());
    }
  };

  return (
    <div className="mb-[34px] max-md:mb-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <img
            src="/assets/images/logo-default.png"
            alt="IOSH Training"
            className="w-[208px] max-w-[45%] h-auto block"
          />
        </div>

        <div className="flex items-center gap-4">
          <img
            src="/assets/images/Smart-Verify-Plus-Logo.png"
            alt="Smart Verify Plus"
            className="h-auto max-h-[96px] max-md:max-h-[65px] block"
          />
        </div>
      </div>

      {/* Lookup bar for quick verification / testing */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="refInput" className="font-medium text-gray-600">
            Certificate Ref:
          </label>
          <input
            id="refInput"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 93548623-01-MYX8"
            className="px-2.5 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-medium text-xs transition-colors"
          >
            Look up
          </button>
        </form>

        <div className="text-gray-400">
          Sample Reference: <button type="button" onClick={() => onSearchRef && onSearchRef('93548623-01-MYX8')} className="underline hover:text-blue-600 font-mono">93548623-01-MYX8</button>
        </div>
      </div>
    </div>
  );
};
