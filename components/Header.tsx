
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <i className="fas fa-magic text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lifestyle Studio <span className="text-indigo-600">AI</span></h1>
              <p className="text-xs text-gray-500 font-medium">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Documentation
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <button className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-100 transition-all border border-indigo-100">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
