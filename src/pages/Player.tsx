import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share, Download, BookOpen, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AudioPlayer } from '../components/ui/AudioPlayer';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';

interface SummaryData {
  summary_id: string;
  title: string;
  audio_url: string;
  vtt_data: string;
  cover_art_url: string;
  voice_id: string;
  summary_text?: string;
  full_summary?: string;
}

export const Player: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const [currentCaption, setCurrentCaption] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summaryData] = useState<SummaryData>(location.state as SummaryData);
  
  if (!summaryData) {
    navigate('/');
    return null;
  }

  // Enhanced key concepts extraction with better SSML tag removal
  const extractKeyConcepts = (text: string): string[] => {
    if (!text) return [];
    
    // First, completely clean the text of ALL SSML tags and artifacts
    let cleanText = text
      // Remove all SSML break tags
      .replace(/<break\s+time="[^"]*"\s*\/>/g, ' ')
      // Remove all emphasis tags
      .replace(/<emphasis\s+level="[^"]*">([^<]*)<\/emphasis>/g, '$1')
      // Remove all prosody tags
      .replace(/<prosody\s+rate="[^"]*">([^<]*)<\/prosody>/g, '$1')
      // Remove any remaining XML-like tags
      .replace(/<[^>]*>/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Remove any remaining artifacts like 'time="0.5s"/>'
      .replace(/time="[^"]*"[^>]*>/g, ' ')
      // Remove standalone quotes and artifacts
      .replace(/['"]\s*\/>/g, ' ')
      .replace(/\s*\/>\s*/g, ' ')
      .trim();

    console.log('Cleaned text for key concepts:', cleanText.substring(0, 500));
    
    const concepts = [];
    
    // Strategy 1: Look for numbered concepts or structured points
    const lines = cleanText.split(/[.!?]+/);
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for key concept patterns
      if (trimmed.match(/^(The\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)|Key\s+Concept\s+\d+|Another\s+key|One\s+important|A\s+crucial)/i)) {
        // Extract the concept, removing the intro phrase
        let concept = trimmed
          .replace(/^(The\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+(key\s+)?(insight|concept|principle|idea)\s+(is\s+about\s+|reveals\s+)?)/i, '')
          .replace(/^(Key\s+Concept\s+\d+:\s*)/i, '')
          .replace(/^(Another\s+key\s+(insight|concept|principle|idea)\s+(is\s+about\s+)?)/i, '')
          .replace(/^(One\s+important\s+(insight|concept|principle|idea)\s+(is\s+about\s+)?)/i, '')
          .replace(/^(A\s+crucial\s+(insight|concept|principle|idea)\s+(is\s+about\s+)?)/i, '')
          .trim();
        
        if (concept.length > 20 && concept.length < 200) {
          concepts.push(concept);
        }
      }
    }
    
    // Strategy 2: Look for sentences that start with action words or important concepts
    if (concepts.length < 3) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^(Understanding|Learning|Developing|Creating|Building|Implementing|Focusing|Embracing|Recognizing)/i) && 
            trimmed.length > 30 && trimmed.length < 200) {
          concepts.push(trimmed);
        }
      }
    }
    
    // Strategy 3: Look for sentences with "important", "key", "crucial", "essential"
    if (concepts.length < 3) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/(important|key|crucial|essential|fundamental|vital|critical)/i) && 
            trimmed.length > 30 && trimmed.length < 200) {
          concepts.push(trimmed);
        }
      }
    }
    
    // Strategy 4: Fallback - get meaningful sentences from different parts of the text
    if (concepts.length < 3) {
      const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 50 && s.trim().length < 200);
      const totalSentences = sentences.length;
      
      // Take sentences from different parts of the text
      if (totalSentences > 0) {
        concepts.push(sentences[Math.floor(totalSentences * 0.1)]?.trim()); // 10% through
        concepts.push(sentences[Math.floor(totalSentences * 0.3)]?.trim()); // 30% through
        concepts.push(sentences[Math.floor(totalSentences * 0.5)]?.trim()); // 50% through
        concepts.push(sentences[Math.floor(totalSentences * 0.7)]?.trim()); // 70% through
        concepts.push(sentences[Math.floor(totalSentences * 0.9)]?.trim()); // 90% through
      }
    }
    
    // Clean and filter the final concepts
    const finalConcepts = concepts
      .filter(concept => concept && concept.length > 20)
      .map(concept => concept.trim())
      .slice(0, 6); // Limit to 6 concepts
    
    console.log('Extracted key concepts:', finalConcepts);
    return finalConcepts;
  };

  // Clean summary text for display (remove ALL SSML tags and artifacts)
  const cleanSummaryText = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove all SSML break tags
      .replace(/<break\s+time="[^"]*"\s*\/>/g, ' ')
      // Remove all emphasis tags
      .replace(/<emphasis\s+level="[^"]*">([^<]*)<\/emphasis>/g, '$1')
      // Remove all prosody tags
      .replace(/<prosody\s+rate="[^"]*">([^<]*)<\/prosody>/g, '$1')
      // Remove any remaining XML-like tags
      .replace(/<[^>]*>/g, ' ')
      // Remove any remaining artifacts like 'time="0.5s"/>'
      .replace(/time="[^"]*"[^>]*>/g, ' ')
      // Remove standalone quotes and artifacts
      .replace(/['"]\s*\/>/g, ' ')
      .replace(/\s*\/>\s*/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Parse summary into structured sections
  const parseSummaryIntoSections = (text: string): Array<{title: string, content: string}> => {
    if (!text) return [];
    
    const cleanText = cleanSummaryText(text);
    const sections = [];
    
    // Split by headers (## or #)
    const parts = cleanText.split(/(?=##?\s+[A-Z])/);
    
    for (const part of parts) {
      const lines = part.trim().split('\n');
      if (lines.length === 0) continue;
      
      const firstLine = lines[0].trim();
      
      // Check if it's a header
      if (firstLine.startsWith('##')) {
        const title = firstLine.replace(/^##\s*/, '').trim();
        const content = lines.slice(1).join('\n').trim();
        if (content) {
          sections.push({ title, content });
        }
      } else if (firstLine.startsWith('#')) {
        const title = firstLine.replace(/^#\s*/, '').trim();
        const content = lines.slice(1).join('\n').trim();
        if (content) {
          sections.push({ title, content });
        }
      } else if (part.trim()) {
        // No header, treat as introduction
        sections.push({ title: 'Introduction', content: part.trim() });
      }
    }
    
    // If no sections found, create some based on content
    if (sections.length === 0) {
      const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 50);
      if (paragraphs.length > 0) {
        sections.push({ title: 'Overview', content: paragraphs[0] });
        if (paragraphs.length > 1) {
          sections.push({ title: 'Key Insights', content: paragraphs.slice(1).join('\n\n') });
        }
      }
    }
    
    return sections;
  };

  const keyConcepts = extractKeyConcepts(summaryData.full_summary || summaryData.summary_text || '');
  const summarySections = parseSummaryIntoSections(summaryData.full_summary || summaryData.summary_text || '');

  const handleSave = async () => {
    if (!idToken || saving) return;

    setSaving(true);
    try {
      await apiClient.post(
        '/save-summary',
        {
          ...summaryData,
          full_summary: summaryData.full_summary || summaryData.summary_text
        },
        {
          'Authorization': `Bearer ${idToken}`,
        }
      );
      setSaved(true);
    } catch (error: any) {
      console.error('Error saving summary:', error);
      alert(`Error saving summary: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${summaryData.summary_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: summaryData.title,
          text: `Check out this audio summary of "${summaryData.title}"`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    // This would trigger MP3 download - for now show upgrade prompt
    alert('Download feature is available with Premium subscription. Upgrade to access MP3 downloads!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            icon={ArrowLeft}
            className="mr-4 border-gray-300 text-gray-700 hover:bg-white text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Now Playing</h1>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6 lg:mb-8">
              {/* Book Cover */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="relative">
                  <img
                    src={summaryData.cover_art_url}
                    alt={summaryData.title}
                    className="w-48 h-64 sm:w-56 sm:h-80 lg:w-56 lg:h-80 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>

              {/* Book Info & Controls */}
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl lg:text-3xl font-serif font-bold text-gray-900 mb-2 leading-tight">
                    {summaryData.title}
                  </h2>
                  <p className="text-gray-600 text-base sm:text-lg">Comprehensive Audio Summary</p>
                </div>

                {/* Live Caption Display */}
                {currentCaption && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
                    <p className="text-gray-800 text-base sm:text-lg leading-relaxed text-center font-medium">
                      {currentCaption}
                    </p>
                  </div>
                )}
                
                {/* Audio Player - Removed voice selection */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
                  <AudioPlayer
                    audioUrl={summaryData.audio_url}
                    vttData={summaryData.vtt_data}
                    voiceId={summaryData.voice_id}
                    onCaptionUpdate={setCurrentCaption}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 justify-center lg:justify-start">
                  <Button
                    variant={saved ? 'secondary' : 'outline'}
                    onClick={handleSave}
                    icon={Heart}
                    disabled={saved || saving}
                    size="sm"
                    className={`
                      text-xs sm:text-sm
                      ${saved 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : saving
                        ? 'bg-gray-50 text-gray-500 border-gray-200'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }
                    `}
                  >
                    <span className="hidden sm:inline">
                      {saving ? 'Saving...' : saved ? 'Saved to Library' : 'Save to Library'}
                    </span>
                    <span className="sm:hidden">
                      {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    icon={Share}
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs sm:text-sm"
                  >
                    Share
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    icon={Download}
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Download MP3</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Concepts Section */}
        {keyConcepts.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 mt-6 sm:mt-8 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-4 sm:mb-6">
                <Key className="text-gray-900 mr-3" size={20} />
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Key Concepts</h3>
              </div>
              <div className="grid gap-3 sm:gap-4">
                {keyConcepts.map((concept, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex items-start">
                      <div className="bg-gray-900 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{concept}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Structured Summary Sections */}
        {summarySections.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 mt-6 sm:mt-8 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-4 sm:mb-6">
                <BookOpen className="text-gray-900 mr-3" size={20} />
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Complete Summary</h3>
              </div>
              <div className="space-y-6 sm:space-y-8">
                {summarySections.map((section, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                    <h4 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 mb-3 sm:mb-4">
                      {section.title}
                    </h4>
                    <div className="prose prose-gray max-w-none">
                      <div className="text-gray-700 leading-relaxed space-y-3 sm:space-y-4">
                        {section.content.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-sm sm:text-base leading-6 sm:leading-7">
                            {paragraph.trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};