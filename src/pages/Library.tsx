import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard } from '../components/ui/BookCard';
import { SearchBar } from '../components/ui/SearchBar';
import { Loader } from '../components/ui/Loader';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';

interface LibrarySummary {
  id: string;
  title: string;
  cover_art_url: string;
  audio_url: string;
  vtt_data: string;
  voice_id: string;
}

export const Library: React.FC = () => {
  const [summaries, setSummaries] = useState<LibrarySummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<LibrarySummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { idToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLibrary();
  }, [idToken]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = summaries.filter(summary =>
        summary.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSummaries(filtered);
    } else {
      setFilteredSummaries(summaries);
    }
  }, [searchQuery, summaries]);

  const fetchLibrary = async () => {
    if (!idToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/get-library', {
        'Authorization': `Bearer ${idToken}`
      });
      setSummaries(response.library || []);
    } catch (error: any) {
      console.error('Error fetching library:', error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (summary: LibrarySummary) => {
    navigate('/player', { 
      state: {
        summary_id: summary.id,
        title: summary.title,
        audio_url: summary.audio_url,
        vtt_data: summary.vtt_data,
        cover_art_url: summary.cover_art_url,
        voice_id: summary.voice_id
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader />
          <p className="text-gray-600 mt-4">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <BookOpen className="text-gray-900 mr-3" size={24} />
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">My Library</h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">Your collection of audio book summaries</p>
        </div>

        {/* Search */}
        <div className="mb-6 sm:mb-8 max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search your library..."
          />
        </div>

        {/* Content */}
        {filteredSummaries.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              {searchQuery ? (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">No summaries found for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-900 hover:underline font-medium text-sm sm:text-base"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your library is empty</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">Start building your collection of audio summaries</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    Generate your first summary
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {filteredSummaries.map((summary) => (
              <div key={summary.id} className="transform transition-all duration-200 hover:scale-105">
                <BookCard
                  title={summary.title}
                  coverArt={summary.cover_art_url}
                  onClick={() => handleBookClick(summary)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};