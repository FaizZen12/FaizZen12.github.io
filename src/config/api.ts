// API configuration for deployed backend
const getApiBaseUrl = () => {
  // Check if we're in development and backend is running
  if (import.meta.env.DEV) {
    // Try to detect if local backend is running
    return '/api'; // This will proxy to localhost:8000 in dev
  }
  
  // In production, use your deployed backend URL
  // Replace this with your actual deployed backend URL
  const deployedBackendUrl = import.meta.env.VITE_BACKEND_URL || 'https://your-backend-url.netlify.app/.netlify/functions';
  return deployedBackendUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // If backend is not available, provide mock responses for development
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Backend not available, using mock data');
        return getMockResponse(endpoint, options);
      }
      
      throw error;
    }
  },
  
  async get(endpoint: string, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'GET', headers });
  },
  
  async post(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  },
};

// Mock responses when backend is not available
function getMockResponse(endpoint: string, options: RequestInit) {
  if (endpoint === '/generate-summary' && options.method === 'POST') {
    const body = JSON.parse(options.body as string);
    return {
      summary_id: `mock-${Date.now()}`,
      title: body.book_title,
      audio_url: generateMockAudio(),
      vtt_data: generateMockVTT(),
      cover_art_url: `https://via.placeholder.com/300x450/f3f4f6/374151?text=${encodeURIComponent(body.book_title)}`,
      voice_id: body.voice_id || 'default',
      summary_text: generateMockSummaryText(body.book_title).substring(0, 200) + "...",
      full_summary: generateMockSummaryText(body.book_title)
    };
  }
  
  if (endpoint === '/save-summary') {
    return { message: 'Summary saved successfully (mock)' };
  }
  
  if (endpoint === '/get-library') {
    return { library: [] };
  }
  
  if (endpoint === '/user/profile') {
    return {
      email: 'user@example.com',
      tier: 'free',
      daily_generation_count: 0,
      last_generation_date: ''
    };
  }
  
  return {};
}

function generateMockAudio(): string {
  // Generate a simple sine wave audio data URL for testing
  const sampleRate = 44100;
  const duration = 300; // 5 minutes
  const samples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);
  
  // Generate audio data (simple sine wave)
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function generateMockVTT(): string {
  return `WEBVTT

00:00.000 --> 00:05.000
Welcome to this comprehensive

00:05.000 --> 00:10.000
book summary that will

00:10.000 --> 00:15.000
transform your understanding

00:15.000 --> 00:20.000
of personal development

00:20.000 --> 00:25.000
and practical wisdom.`;
}

function generateMockSummaryText(bookTitle: string): string {
  return `# ${bookTitle}: A Comprehensive Summary

## Introduction

Welcome to this in-depth exploration of "${bookTitle}" - a transformative work that has changed countless lives through its powerful insights and practical wisdom.

This book represents years of research, real-world application, and profound understanding of human psychology and behavior. The author presents a compelling framework that challenges conventional thinking while providing actionable strategies for meaningful change.

## Core Philosophy

The fundamental premise of this work centers on the idea that lasting transformation comes not from dramatic overhauls or perfect plans, but through small, consistent actions that compound over time. This concept revolutionizes how we approach personal development and goal achievement.

The author argues that we often overestimate what we can accomplish in the short term while dramatically underestimating our potential for long-term growth. This insight forms the foundation for everything that follows.

## Key Concept 1: The Power of Incremental Progress

The first major insight reveals how tiny improvements, when sustained over time, create extraordinary results. The mathematics of compound growth applies not just to financial investments, but to every aspect of personal development.

Consider this: improving by just 1% each day results in being 37 times better by the end of one year. This isn't just theoretical - it's a practical framework that anyone can implement immediately.

The author provides numerous examples of individuals who transformed their lives through this approach, from athletes who became champions through daily practice to entrepreneurs who built empires through consistent effort.

## Key Concept 2: Identity-Based Change

Rather than focusing solely on outcomes, the book emphasizes the importance of identity transformation. Instead of saying "I want to lose weight," you begin saying "I am someone who takes care of their body."

This shift in language and thinking creates a fundamental change in how you approach challenges and opportunities. When your identity aligns with your goals, the actions become natural expressions of who you are rather than forced behaviors.

The author explains how every action you take is essentially a vote for the type of person you want to become. These votes accumulate over time, gradually shifting your identity and making positive behaviors feel automatic.

## Key Concept 3: Environmental Design

Your environment plays a crucial role in shaping your behavior. The book demonstrates how small changes to your surroundings can dramatically influence your choices and outcomes.

By making good choices easier and bad choices harder, you can leverage your environment to support your goals. This might involve placing healthy snacks at eye level while hiding junk food, or keeping your workout clothes visible as a reminder to exercise.

The author provides practical strategies for designing environments that promote success, from organizing your workspace to structuring your daily routines.

## Key Concept 4: The Plateau of Latent Potential

One of the most powerful concepts in the book is understanding why change often feels slow or invisible before breakthrough moments occur. The author uses the metaphor of an ice cube slowly warming from 25 to 32 degrees - nothing appears to happen until suddenly, at 32 degrees, it melts completely.

This explains why many people give up just before achieving significant results. The work you do during these "plateau" periods isn't wasted - it's building the foundation for dramatic transformation.

Understanding this concept helps maintain motivation during challenging periods when progress seems minimal or non-existent.

## Key Concept 5: Implementation Intentions

The book introduces the powerful concept of implementation intentions - specific plans that link situations to responses. Instead of vague goals like "I will exercise more," you create specific triggers: "After I pour my morning coffee, I will do 10 push-ups."

This strategy removes the need for willpower and decision-making in the moment. Your brain simply follows the predetermined plan, making positive behaviors more automatic and sustainable.

The author provides frameworks for creating effective implementation intentions across various life domains, from health and fitness to productivity and relationships.

## Key Concept 6: Habit Stacking

Building on implementation intentions, habit stacking involves linking new behaviors to existing habits. This leverages the momentum of established routines to carry new behaviors forward.

The formula is simple: "After I [existing habit], I will [new habit]." This might look like "After I sit down for dinner, I will share one thing I'm grateful for" or "After I close my laptop, I will write in my journal for five minutes."

This approach makes it easier to remember new habits and creates natural opportunities for positive behaviors throughout your day.

## Practical Applications

The book provides numerous practical strategies for implementing these concepts:

### Morning Routines
Creating consistent morning routines that set a positive tone for the entire day. The author emphasizes starting small - even five minutes of intentional morning activity can create significant momentum.

### Evening Reflection
Developing habits of evening reflection to process the day's experiences and prepare for tomorrow's opportunities. This might involve journaling, meditation, or simply reviewing what went well.

### Weekly Reviews
Implementing regular review sessions to assess progress, adjust strategies, and maintain alignment with long-term goals. These reviews help ensure you're moving in the right direction and making necessary course corrections.

### Social Environment
Surrounding yourself with people who support your growth and share your values. The book emphasizes how social connections profoundly influence behavior and outcomes.

## Overcoming Common Obstacles

The author addresses frequent challenges people face when implementing these strategies:

### Perfectionism
Learning to embrace "good enough" rather than waiting for perfect conditions. Progress trumps perfection in every scenario.

### Motivation Dependence
Understanding that motivation is unreliable and building systems that work regardless of how you feel on any given day.

### All-or-Nothing Thinking
Developing flexibility and resilience when setbacks occur. The goal is progress, not perfection.

### Comparison Trap
Focusing on your own journey rather than comparing yourself to others who may be at different stages or have different circumstances.

## Long-Term Vision

The book concludes with a powerful vision of what becomes possible when these principles are consistently applied over time. The compound effect of small, positive changes creates transformation that extends far beyond individual goals.

You begin to see yourself differently, others notice the changes, and new opportunities emerge naturally. What started as small behavioral adjustments evolves into a completely different way of being in the world.

## Final Thoughts

This work represents more than just another self-help book - it's a comprehensive system for sustainable personal transformation. The principles are simple enough to understand yet profound enough to create lasting change.

The key is to start where you are, use what you have, and do what you can. Your future self is counting on the decisions you make today. Make them count.

Remember: you don't need to be perfect, you just need to begin. Every expert was once a beginner, and every pro was once an amateur. Your journey starts with a single small action.

What will yours be?`;
}