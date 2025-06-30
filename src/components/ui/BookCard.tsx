import React from 'react';
import { Play } from 'lucide-react';

interface BookCardProps {
  title: string;
  coverArt: string;
  onClick?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ title, coverArt, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer group transition-all duration-200 hover:scale-105"
    >
      <div className="bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 p-3 sm:p-4 h-full">
        <div className="relative mb-3 sm:mb-4">
          <img 
            src={coverArt} 
            alt={title}
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <Play 
              className="text-white opacity-0 group-hover:opacity-100 transition-all duration-200" 
              size={24}
              fill="currentColor"
            />
          </div>
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {title}
        </h3>
      </div>
    </div>
  );
};