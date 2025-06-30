import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from './Button';

interface AudioPlayerProps {
  audioUrl: string;
  vttData: string;
  onCaptionUpdate?: (text: string) => void;
}

interface VTTCue {
  startTime: number;
  endTime: number;
  text: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  vttData,
  onCaptionUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentCaption, setCurrentCaption] = useState('');
  const [vttCues, setVttCues] = useState<VTTCue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playbackSpeeds = [0.75, 1, 1.25, 1.5, 2];

  // Parse VTT data into cues with improved accuracy
  useEffect(() => {
    if (vttData) {
      console.log('🎯 Parsing VTT data for perfect caption alignment...');
      const cues = parseVTT(vttData);
      setVttCues(cues);
      console.log(`📝 Parsed ${cues.length} caption cues`);
    }
  }, [vttData]);

  // Advanced caption alignment system - updates every 100ms for perfect sync
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying && vttCues.length > 0) {
      intervalId = setInterval(() => {
        const audio = audioRef.current;
        if (audio) {
          const time = audio.currentTime;
          
          // Find the exact cue that should be displayed at this moment
          const activeCue = vttCues.find(cue => 
            time >= cue.startTime && time <= cue.endTime
          );
          
          const captionText = activeCue ? activeCue.text : '';
          
          // Only update if caption actually changed to prevent unnecessary re-renders
          if (captionText !== currentCaption) {
            setCurrentCaption(captionText);
            
            if (onCaptionUpdate) {
              onCaptionUpdate(captionText);
            }
            
            console.log(`📺 Caption update at ${time.toFixed(2)}s: "${captionText}"`);
          }
        }
      }, 100); // Update every 100ms for smooth caption transitions
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, vttCues, onCaptionUpdate, currentCaption]);

  const parseVTT = (vttText: string): VTTCue[] => {
    const cues: VTTCue[] = [];
    const lines = vttText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for timestamp lines (format: 00:00.000 --> 00:05.000)
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const startTime = parseTimeString(startStr);
        const endTime = parseTimeString(endStr);
        
        // Get the text from the next non-empty line
        let text = '';
        for (let j = i + 1; j < lines.length; j++) {
          const textLine = lines[j].trim();
          if (textLine === '') break;
          if (textLine.includes('-->')) break;
          text += (text ? ' ' : '') + textLine;
        }
        
        if (text && startTime !== null && endTime !== null) {
          cues.push({
            startTime,
            endTime,
            text: text.trim()
          });
        }
      }
    }
    
    // Sort cues by start time to ensure proper order
    return cues.sort((a, b) => a.startTime - b.startTime);
  };

  const parseTimeString = (timeStr: string): number => {
    try {
      // Parse format: MM:SS.mmm or HH:MM:SS.mmm
      const parts = timeStr.split(':');
      let seconds = 0;
      
      if (parts.length === 2) {
        // MM:SS.mmm
        const [minutes, secondsAndMs] = parts;
        const [secs, ms] = secondsAndMs.split('.');
        seconds = parseInt(minutes) * 60 + parseInt(secs) + (parseInt(ms || '0') / 1000);
      } else if (parts.length === 3) {
        // HH:MM:SS.mmm
        const [hours, minutes, secondsAndMs] = parts;
        const [secs, ms] = secondsAndMs.split('.');
        seconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + (parseInt(ms || '0') / 1000);
      }
      
      return seconds;
    } catch (error) {
      console.error('Error parsing time string:', timeStr, error);
      return 0;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log(`🎵 Audio loaded: ${formatTime(audio.duration)} duration`);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentCaption(''); // Clear caption when audio ends
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      audio.pause();
      console.log('⏸️  Audio paused');
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Unable to play audio. Please check your internet connection or try refreshing the page.');
      });
      console.log('▶️  Audio playing');
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    
    // Clear current caption when seeking
    setCurrentCaption('');
    console.log(`⏭️  Seeked to ${formatTime(newTime)}`);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
    console.log(`🏃 Playback rate changed to ${rate}x`);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Main Controls */}
      <div className="flex items-center space-x-4">
        <Button
          variant="circle"
          onClick={togglePlayPause}
          icon={isLoading ? undefined : (isPlaying ? Pause : Play)}
          className="bg-gray-900 text-white hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          )}
        </Button>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            disabled={isLoading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none slider cursor-pointer disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #1f2937 0%, #1f2937 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <Volume2 size={20} className="text-gray-600" />
      </div>

      {/* Secondary Controls - Only playback speed */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Speed:</span>
          <div className="flex space-x-1">
            {playbackSpeeds.map((speed) => (
              <button
                key={speed}
                onClick={() => handlePlaybackRateChange(speed)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200
                  ${playbackRate === speed 
                    ? 'bg-gray-900 text-white border-gray-900' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {isLoading ? 'Loading audio...' : `${Math.round(duration / 60)} min summary`}
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          <div>VTT Cues: {vttCues.length} | Current: {formatTime(currentTime)} | Duration: {formatTime(duration)}</div>
          <div>Active Caption: "{currentCaption}"</div>
          <div>Audio URL: {audioUrl.substring(0, 50)}...</div>
        </div>
      )}
    </div>
  );
};