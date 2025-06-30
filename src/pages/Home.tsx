import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chip } from '../components/ui/Chip';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';
import { TOPIC_CHIPS, getRandomBookFromCategory, getTotalBookCount } from '../data';

export const Home: React.FC = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const { currentUser, idToken } = useAuth();
  const navigate = useNavigate();

  const totalBooks = getTotalBookCount();

  const handleGenerate = async () => {
    if (!bookTitle.trim()) return;
    if (!currentUser || !idToken) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      setLoadingStage('Analyzing book content...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingStage('Generating comprehensive 5-minute summary...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLoadingStage('Converting to high-quality audio...');
      
      const response = await apiClient.post(
        '/generate-summary',
        { 
          book_title: bookTitle
        },
        {
          'Authorization': `Bearer ${idToken}`,
        }
      );

      setLoadingStage('Finalizing your audio summary...');
      await new Promise(resolve => setTimeout(resolve, 500));

      navigate('/player', { state: response });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      if (error.message.includes('429')) {
        alert('Daily generation limit reached. Upgrade to premium for unlimited access.');
      } else {
        alert(`Error generating summary: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleChipClick = (topic: string) => {
    const randomBook = getRandomBookFromCategory(topic);
    if (randomBook) {
      setBookTitle(randomBook);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && bookTitle.trim()) {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto py-8 sm:py-12 lg:py-16 text-center max-w-7xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Book summaries, brought to life.
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-3 sm:mb-4 px-4">
            Unlock actionable insights from top self-improvement and non-fiction books with AI-powered 5-minute audio summaries.
          </p>
          <div className="flex items-center justify-center text-sm sm:text-base text-gray-500">
            <BookOpen size={16} className="mr-2 flex-shrink-0" />
            <span>Choose from {totalBooks.toLocaleString()}+ carefully curated books</span>
          </div>
        </div>

        {/* Main Input */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
          <div className="bg-gray-200 rounded-full p-2 flex items-center">
            <Input
              placeholder="Enter a book title..."
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              disabled={loading}
            />
            <Button
              variant="circle"
              onClick={handleGenerate}
              disabled={loading || !bookTitle.trim()}
              icon={loading ? undefined : ArrowRight}
              className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 flex-shrink-0"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
            </Button>
          </div>
        </div>

        {/* Loading Animation */}
        {loading && (
          <div className="max-w-md mx-auto mb-6 sm:mb-8 px-4">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900 mr-3"></div>
                <span className="text-base sm:text-lg font-medium text-gray-900">Generating 5-Minute Summary</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mb-4">{loadingStage}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-900 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: loadingStage.includes('Analyzing') ? '25%' : 
                           loadingStage.includes('Generating') ? '50%' : 
                           loadingStage.includes('Converting') ? '75%' : 
                           loadingStage.includes('Finalizing') ? '100%' : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Creating comprehensive 5-minute summary - this may take 60-90 seconds
              </div>
            </div>
          </div>
        )}

        {/* Topic Chips */}
        {!loading && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="mb-3 sm:mb-4">
              <span className="text-sm font-medium text-gray-600">Or explore popular topics:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {TOPIC_CHIPS.map((topic) => (
                <Chip
                  key={topic}
                  onClick={() => handleChipClick(topic)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  {topic}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Features Preview */}
        {!loading && (
          <div className="max-w-6xl mx-auto mt-12 sm:mt-16 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 text-center">
                <div className="bg-gray-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ArrowRight className="text-gray-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">5-Minute Deep Dives</h3>
                <p className="text-xs sm:text-sm text-gray-600">Comprehensive insights that capture the full essence and actionable takeaways</p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 text-center">
                <div className="bg-gray-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-600 rounded"></div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Perfect Captions</h3>
                <p className="text-xs sm:text-sm text-gray-600">Synchronized captions with 3-5 word phrases for easy following</p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
                <div className="bg-gray-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-600 rounded-full"></div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Save & Share</h3>
                <p className="text-xs sm:text-sm text-gray-600">Build your personal library and share insights with others</p>
              </div>
            </div>
          </div>
        )}

        {/* Backend Notice */}
        <div className="max-w-4xl mx-auto mt-12 sm:mt-16 px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">🚀 Production Ready</h3>
              <p className="text-sm sm:text-base text-blue-800 mb-3">
                This app is designed for cloud deployment with serverless functions and managed databases.
              </p>
              <div className="text-xs sm:text-sm text-blue-700 space-y-1">
                <p>• Backend: Deploy to Vercel, Netlify Functions, or AWS Lambda</p>
                <p>• Database: Use Supabase, Firebase, or PlanetScale for production</p>
                <p>• Audio: Store files in AWS S3, Cloudinary, or similar CDN</p>
                <p>• No local server needed - fully cloud-native architecture</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};