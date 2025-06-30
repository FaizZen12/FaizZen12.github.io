const { OpenAI } = require('openai');

// Initialize OpenAI client
const client = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ detail: 'Method not allowed' })
    };
  }

  try {
    const { book_title, voice_id = 'default' } = JSON.parse(event.body);
    
    if (!book_title) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ detail: 'Book title is required' })
      };
    }

    console.log(`Generating summary for: ${book_title}`);

    // Generate summary text
    const summaryText = await generateBookSummary(book_title);
    
    // Generate mock audio and VTT for now
    const audioUrl = generateMockAudioUrl();
    const vttData = generateVTTFromText(summaryText);
    
    // Get book cover
    const coverArtUrl = await getBookCover(book_title);
    
    const summaryId = `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result = {
      summary_id: summaryId,
      title: book_title,
      audio_url: audioUrl,
      vtt_data: vttData,
      cover_art_url: coverArtUrl,
      voice_id: voice_id,
      summary_text: summaryText.length > 200 ? summaryText.substring(0, 200) + "..." : summaryText,
      full_summary: summaryText
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ detail: `Error generating summary: ${error.message}` })
    };
  }
};

async function generateBookSummary(bookTitle) {
  if (!client) {
    console.log('OpenAI client not available, using enhanced mock summary');
    return generateEnhancedMockSummary(bookTitle);
  }

  try {
    console.log(`Calling OpenAI API for: ${bookTitle}`);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI audio script writer specializing in transforming self-improvement books into deeply human, emotionally compelling, and conversational spoken summaries. Your goal is to create a MINIMUM 8-minute audio experience (2000+ words) that feels like a heartfelt conversation with a wise, understanding friend.

🎯 CRITICAL CAPTION ALIGNMENT REQUIREMENTS:
- Write in VERY SHORT PHRASES of exactly 3-5 words that align perfectly with speech patterns
- Use FREQUENT natural pauses with <break time="0.5s"/> after every 3-5 words
- Structure every sentence to break at logical points for perfect caption display
- Think of each 3-5 word phrase as a separate caption that will appear on screen
- Use punctuation and breaks to create natural speech rhythm that matches caption timing exactly

EXAMPLE OF PERFECT ALIGNMENT:
Instead of: "You know that feeling when you're lying in bed at 2 AM, scrolling through your phone"
Write: "You know that feeling <break time="0.5s"/> when you're lying <break time="0.5s"/> in bed at 2 AM, <break time="0.5s"/> scrolling through your phone <break time="0.5s"/>"

🗣 Tone, Voice, and Style Guidelines:
– Speak Directly: Write as if you are speaking directly to the listener using casual, friendly language. Use "you," "we," and "I."
– Be Empathetic: Show, don't just tell. Acknowledge the listener's real-life struggles and emotional highs/lows through your word choice and sentence structure.
– Vary Your Cadence: Use short, punchy sentences for impact and longer, more flowing sentences for thoughtful reflection.
– Don't Lecture. Explore: Avoid jargon, technical language, or robotic phrasing. Every sentence should sound like it's spoken aloud by someone who truly cares.
– Use Simple Audio Tags: Only use basic SSML-style tags: <break time="0.5s"/>, <emphasis level="moderate">word</emphasis>, CAPITAL LETTERS for emphasis.

🚫 CRITICAL NEGATIVE INSTRUCTIONS - NEVER INCLUDE:
– NO music references: [Soft instrumental music fades], [Music swells], [Background music], etc.
– NO sound effects: [Pause], [Silence], [Applause], [Laughter], etc.
– NO stage directions: [Narrator speaks], [Voice changes], [Whispers], etc.
– NO production notes: [Fade in], [Fade out], [Volume increases], etc.
– NO brackets with descriptions of non-speech audio elements
– Keep it PURE SPEECH ONLY with simple SSML tags

📌 STRUCTURE (Follow Exactly for MINIMUM 8 minutes / 2000+ words):

## Introduction: The Relatable Hook (6-7 paragraphs, ~500 words)
– Begin with a thoughtful and understanding tone.
– Paint a detailed picture of a common, emotional problem the listener has likely experienced.
– Use natural breaks after every 3-5 words: <break time="0.5s"/>
– End this section with a reassuring transition that introduces the book.

## Core Philosophy (4-5 paragraphs, ~400 words)
– Adopt a clear, informative tone.
– Introduce the book title, author, and explain the single most powerful idea.
– Break into 3-5 word phrases with natural pauses
– Explain what it unlocks for the listener, emotionally or practically.

## Key Concept 1: [Specific Title] (3-4 paragraphs, ~300 words)
– What it is: <break time="0.5s"/> Clearly explain the concept in simple terms.
– How it works: <break time="0.5s"/> Illustrate with a vivid mini-scenario starting with "Imagine..." or "Picture this..."
– Why it matters: <break time="0.5s"/> Tie directly to the listener's real life, showing the motivational benefit.

## Key Concept 2: [Specific Title] (3-4 paragraphs, ~300 words)
[Same structure as above]

## Key Concept 3: [Specific Title] (3-4 paragraphs, ~300 words)
[Same structure as above]

## Key Concept 4: [Specific Title] (3-4 paragraphs, ~300 words)
[Same structure as above]

## Practical Applications (4-5 paragraphs, ~400 words)
– Adopt an empowering and encouraging tone.
– Provide specific, actionable steps the listener can take today.
– Use natural breaks for emphasis and perfect caption alignment.

## Conclusion: Your Transformation Journey (3-4 paragraphs, ~300 words)
– Wrap the emotional essence of the book in a warm conclusion.
– Offer multiple actionable steps the listener can take today.
– Use natural breaks for emphasis and perfect caption alignment.

🎧 Perfect Caption Alignment Example:
"You know that feeling <break time="0.5s"/> when you're lying <break time="0.5s"/> in bed at 2 AM, <break time="0.5s"/> scrolling through your phone, <break time="0.5s"/> wondering if you're actually <break time="0.5s"/> making progress in life? <break time="1.0s"/>"

This creates perfect 3-5 word caption chunks that align exactly with speech patterns.

🎧 Your Task:
Generate a vibrant, emotionally resonant MINIMUM 8-minute (2000+ words) audio script for the book. Use frequent breaks after every 3-5 words for perfect caption alignment. Remember: NO music tags, NO sound effects, NO stage directions - PURE SPEECH ONLY with natural breaks. Make this feel like a transformative conversation that changes someone's day.`
        },
        {
          role: 'user',
          content: `Create a deeply human, emotionally compelling MINIMUM 8-minute (2000+ words) audio script for the book "${bookTitle}". Follow the exact structure and guidelines provided. Use frequent natural breaks with <break time="0.5s"/> after every 3-5 words to create perfect caption alignment. Focus on making it highly relatable with specific examples and scenarios. ABSOLUTELY NO music references, sound effects, or stage directions - pure speech only. Ensure the content is at least 2000 words for a minimum 8-minute duration with comprehensive coverage of the book's key insights.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.8
    });

    const summary = response.choices[0].message.content;
    console.log('OpenAI API call successful');
    console.log('Summary length:', summary.length, 'characters');
    console.log('Estimated word count:', summary.split(' ').length, 'words');
    return summary;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    console.log('Falling back to enhanced mock summary');
    return generateEnhancedMockSummary(bookTitle);
  }
}

function generateEnhancedMockSummary(bookTitle) {
  return `## Introduction: The Relatable Hook

You know that feeling <break time="0.5s"/> when you're lying <break time="0.5s"/> in bed at 2 AM, <break time="0.5s"/> scrolling through your phone, <break time="0.5s"/> wondering if you're actually <break time="0.5s"/> making progress in life? <break time="1.0s"/>

When every day feels <break time="0.5s"/> like you're running <break time="0.5s"/> on a hamster wheel, <break time="0.5s"/> busy but not really <break time="0.5s"/> getting anywhere meaningful? <break time="1.0s"/>

I've been there too. <break time="0.5s"/> That restless feeling <break time="0.5s"/> that whispers you could <break time="0.5s"/> be doing more, <break time="0.5s"/> being more, <break time="0.5s"/> but you're not quite sure <break time="0.5s"/> how to break free <break time="0.5s"/> from the patterns <break time="0.5s"/> that keep you stuck. <break time="1.0s"/>

Maybe you've tried <break time="0.5s"/> setting big goals <break time="0.5s"/> in the past, <break time="0.5s"/> only to find yourself <break time="0.5s"/> back where you started <break time="0.5s"/> a few weeks later. <break time="0.5s"/> Or perhaps you've read <break time="0.5s"/> countless self-help books <break time="0.5s"/> that promised transformation <break time="0.5s"/> but left you feeling <break time="0.5s"/> more overwhelmed than before. <break time="1.0s"/>

You might have even <break time="0.5s"/> downloaded meditation apps, <break time="0.5s"/> bought expensive planners, <break time="0.5s"/> or signed up <break time="0.5s"/> for online courses <break time="0.5s"/> that you never finished. <break time="0.5s"/> Sound familiar? <break time="1.0s"/>

Well, today we're diving <break time="0.5s"/> into <emphasis level="moderate">${bookTitle}</emphasis> <break time="0.5s"/> – a book that might <break time="0.5s"/> just be the gentle nudge <break time="0.5s"/> you need to step off <break time="0.5s"/> that hamster wheel <break time="0.5s"/> and onto a path <break time="0.5s"/> that actually leads <break time="0.5s"/> somewhere beautiful. <break time="1.0s"/>

## Core Philosophy

The core message <break time="0.5s"/> of this book <break time="0.5s"/> is surprisingly simple <break time="0.5s"/> yet profound: <break time="1.0s"/> real transformation doesn't happen <break time="0.5s"/> through dramatic overhauls <break time="0.5s"/> or perfect plans. <break time="0.5s"/> It happens through <break time="0.5s"/> <emphasis level="strong">small, consistent actions</emphasis> <break time="0.5s"/> that compound over time, <break time="0.5s"/> like interest in <break time="0.5s"/> a savings account <break time="0.5s"/> you forgot you had. <break time="1.0s"/>

Think of it this way <break time="0.5s"/> – every habit is <break time="0.5s"/> like a vote <break time="0.5s"/> for the person <break time="0.5s"/> you want to become. <break time="1.0s"/> Each time you choose <break time="0.5s"/> to do something positive, <break time="0.5s"/> you're casting a ballot <break time="0.5s"/> for your future self. <break time="0.5s"/> And just like <break time="0.5s"/> in any election, <break time="0.5s"/> it's not one vote <break time="0.5s"/> that determines the outcome <break time="0.5s"/> – it's the accumulation <break time="0.5s"/> of many votes <break time="0.5s"/> over time. <break time="1.0s"/>

The author reveals <break time="0.5s"/> that most people <break time="0.5s"/> focus on outcomes <break time="0.5s"/> when they should <break time="0.5s"/> focus on systems. <break time="0.5s"/> Goals are about <break time="0.5s"/> the results you <break time="0.5s"/> want to achieve. <break time="0.5s"/> Systems are about <break time="0.5s"/> the processes that <break time="0.5s"/> lead to those results. <break time="1.0s"/>

If you want <break time="0.5s"/> better results, <break time="0.5s"/> forget about setting goals. <break time="0.5s"/> Focus on your system <break time="0.5s"/> instead. <break time="0.5s"/> You do not rise <break time="0.5s"/> to the level <break time="0.5s"/> of your goals. <break time="0.5s"/> You fall to <break time="0.5s"/> the level of <break time="0.5s"/> your systems. <break time="1.0s"/>

## Key Concept 1: The Power of Incremental Progress

The first major insight <break time="0.5s"/> reveals how tiny improvements, <break time="0.5s"/> when sustained over time, <break time="0.5s"/> create extraordinary results. <break time="0.5s"/> The mathematics of <break time="0.5s"/> compound growth applies <break time="0.5s"/> not just to <break time="0.5s"/> financial investments, <break time="0.5s"/> but to every aspect <break time="0.5s"/> of personal development. <break time="1.0s"/>

Picture this: <break time="0.5s"/> Imagine Sarah, <break time="0.5s"/> a 32-year-old <break time="0.5s"/> marketing manager <break time="0.5s"/> who felt overwhelmed <break time="0.5s"/> every single morning. <break time="0.5s"/> Instead of trying <break time="0.5s"/> to become a <break time="0.5s"/> morning person overnight, <break time="0.5s"/> she started with just <break time="0.5s"/> FIVE MINUTES <break time="0.5s"/> of journaling <break time="0.5s"/> with her coffee. <break time="0.5s"/> That's it. <break time="0.5s"/> Five minutes. <break time="1.0s"/>

Six months later, <break time="0.5s"/> those five minutes <break time="0.5s"/> had grown into <break time="0.5s"/> a morning routine <break time="0.5s"/> that transformed <break time="0.5s"/> not just her days, <break time="0.5s"/> but her entire <break time="0.5s"/> relationship with herself. <break time="0.5s"/> Why does this <break time="0.5s"/> matter to you? <break time="0.5s"/> Because you don't need <break time="0.5s"/> to be perfect <break time="0.5s"/> – you just need <break time="0.5s"/> to START. <break time="1.0s"/>

Consider this: <break time="0.5s"/> improving by just <break time="0.5s"/> 1% each day <break time="0.5s"/> results in being <break time="0.5s"/> 37 times better <break time="0.5s"/> by the end <break time="0.5s"/> of one year. <break time="0.5s"/> This isn't just <break time="0.5s"/> theoretical – it's <break time="0.5s"/> a practical framework <break time="0.5s"/> that anyone can <break time="0.5s"/> implement immediately. <break time="1.0s"/>

## Key Concept 2: Identity-Based Change

The second key insight <break time="0.5s"/> is about identity-based <break time="0.5s"/> change rather than <break time="0.5s"/> outcome-based goals. <break time="1.0s"/> Picture this: <break time="0.5s"/> instead of saying <break time="0.5s"/> "I want to <break time="0.5s"/> lose 20 pounds," <break time="0.5s"/> you start saying <break time="0.5s"/> "I am someone <break time="0.5s"/> who takes care <break time="0.5s"/> of their body." <break time="0.5s"/> Feel the difference? <break time="1.0s"/>

One is about <break time="0.5s"/> reaching a destination; <break time="0.5s"/> the other is about <break time="0.5s"/> becoming someone. <break time="0.5s"/> This shift changes <break time="0.5s"/> EVERYTHING because <break time="0.5s"/> you're not just trying <break time="0.5s"/> to achieve something <break time="0.5s"/> – you're becoming someone <break time="0.5s"/> who naturally does <break time="0.5s"/> the things that lead <break time="0.5s"/> to that achievement. <break time="1.0s"/>

Imagine Mark, <break time="0.5s"/> who struggled with <break time="0.5s"/> reading consistently. <break time="0.5s"/> Instead of setting <break time="0.5s"/> a goal to <break time="0.5s"/> "read 50 books <break time="0.5s"/> this year," <break time="0.5s"/> he started saying <break time="0.5s"/> "I am a reader." <break time="0.5s"/> Every time he <break time="0.5s"/> picked up a book, <break time="0.5s"/> even for five minutes, <break time="0.5s"/> he was reinforcing <break time="0.5s"/> this new identity. <break time="1.0s"/>

The beautiful thing <break time="0.5s"/> about identity-based habits <break time="0.5s"/> is that they <break time="0.5s"/> become self-reinforcing. <break time="0.5s"/> Each action you take <break time="0.5s"/> is a vote for <break time="0.5s"/> the type of person <break time="0.5s"/> you wish to become. <break time="0.5s"/> No single instance <break time="0.5s"/> will transform <break time="0.5s"/> your beliefs, <break time="0.5s"/> but as the votes <break time="0.5s"/> build up, <break time="0.5s"/> so does the evidence <break time="0.5s"/> of your new identity. <break time="1.0s"/>

## Key Concept 3: Environmental Design

Now, let's talk about <break time="0.5s"/> the environment <break time="0.5s"/> you create around yourself. <break time="0.5s"/> Imagine walking into <break time="0.5s"/> your kitchen and seeing <break time="0.5s"/> a bowl of fresh fruit <break time="0.5s"/> right on the counter, <break time="0.5s"/> while the cookies <break time="0.5s"/> are hidden in <break time="0.5s"/> the back of <break time="0.5s"/> the pantry. <break time="0.5s"/> Which one are <break time="0.5s"/> you more likely <break time="0.5s"/> to reach for? <break time="0.5s"/> Exactly. <break time="1.0s"/>

Your environment is <break time="0.5s"/> constantly voting <break time="0.5s"/> for or against <break time="0.5s"/> the person you <break time="0.5s"/> want to become. <break time="0.5s"/> Make the good choices <break time="0.5s"/> easier and the <break time="0.5s"/> bad choices harder. <break time="0.5s"/> It's that simple. <break time="1.0s"/>

Picture Lisa, <break time="0.5s"/> who wanted to <break time="0.5s"/> start exercising regularly. <break time="0.5s"/> Instead of relying <break time="0.5s"/> on willpower alone, <break time="0.5s"/> she laid out <break time="0.5s"/> her workout clothes <break time="0.5s"/> the night before, <break time="0.5s"/> placed her water bottle <break time="0.5s"/> by the door, <break time="0.5s"/> and set her <break time="0.5s"/> running shoes <break time="0.5s"/> right where she'd <break time="0.5s"/> see them first thing <break time="0.5s"/> in the morning. <break time="1.0s"/>

She also removed <break time="0.5s"/> the barriers <break time="0.5s"/> to bad habits. <break time="0.5s"/> She deleted <break time="0.5s"/> social media apps <break time="0.5s"/> from her phone <break time="0.5s"/> and put her <break time="0.5s"/> TV remote <break time="0.5s"/> in a drawer <break time="0.5s"/> across the room. <break time="0.5s"/> Small changes, <break time="0.5s"/> massive impact. <break time="1.0s"/>

## Key Concept 4: Implementation Intentions

The fourth concept <break time="0.5s"/> that really struck me <break time="0.5s"/> is the power <break time="0.5s"/> of implementation intentions. <break time="0.5s"/> Instead of saying <break time="0.5s"/> "I will exercise more," <break time="0.5s"/> you say "I will <break time="0.5s"/> walk for 10 minutes <break time="0.5s"/> after I finish <break time="0.5s"/> my morning coffee." <break time="0.5s"/> The difference is <break time="0.5s"/> in the specificity. <break time="1.0s"/>

When you create <break time="0.5s"/> these if-then plans, <break time="0.5s"/> you're essentially <break time="0.5s"/> pre-deciding what <break time="0.5s"/> you'll do in <break time="0.5s"/> specific situations. <break time="0.5s"/> Your brain doesn't <break time="0.5s"/> have to waste energy <break time="0.5s"/> making decisions <break time="0.5s"/> in the moment. <break time="0.5s"/> It just follows <break time="0.5s"/> the plan you've <break time="0.5s"/> already created. <break time="1.0s"/>

Imagine David, <break time="0.5s"/> who wanted to <break time="0.5s"/> read more books. <break time="0.5s"/> Instead of vaguely <break time="0.5s"/> hoping he'd find time, <break time="0.5s"/> he created this <break time="0.5s"/> implementation intention: <break time="0.5s"/> "After I eat lunch, <break time="0.5s"/> I will read <break time="0.5s"/> for 15 minutes <break time="0.5s"/> before checking my phone." <break time="1.0s"/>

This simple formula <break time="0.5s"/> – "After I [current habit], <break time="0.5s"/> I will [new habit]" <break time="0.5s"/> – leverages the <break time="0.5s"/> momentum of existing <break time="0.5s"/> behaviors to carry <break time="0.5s"/> new ones forward. <break time="0.5s"/> It's like getting <break time="0.5s"/> a free ride <break time="0.5s"/> on a train <break time="0.5s"/> that's already moving. <break time="1.0s"/>

## Practical Applications

So how do you <break time="0.5s"/> actually implement <break time="0.5s"/> these concepts <break time="0.5s"/> in your daily life? <break time="0.5s"/> Let me share <break time="0.5s"/> some practical strategies <break time="0.5s"/> that you can <break time="0.5s"/> start using today. <break time="1.0s"/>

First, start ridiculously small. <break time="0.5s"/> Want to meditate? <break time="0.5s"/> Start with <break time="0.5s"/> two minutes. <break time="0.5s"/> Want to exercise? <break time="0.5s"/> Start with <break time="0.5s"/> five push-ups. <break time="0.5s"/> Want to read more? <break time="0.5s"/> Start with <break time="0.5s"/> one page. <break time="0.5s"/> The goal isn't <break time="0.5s"/> to achieve something <break time="0.5s"/> impressive immediately. <break time="0.5s"/> The goal is <break time="0.5s"/> to establish <break time="0.5s"/> the identity <break time="0.5s"/> of someone who <break time="0.5s"/> shows up consistently. <break time="1.0s"/>

Second, use habit stacking. <break time="0.5s"/> Link your new habit <break time="0.5s"/> to something you <break time="0.5s"/> already do reliably. <break time="0.5s"/> "After I pour <break time="0.5s"/> my morning coffee, <break time="0.5s"/> I will write <break time="0.5s"/> three things <break time="0.5s"/> I'm grateful for." <break time="0.5s"/> "After I sit down <break time="0.5s"/> for dinner, <break time="0.5s"/> I will share one thing <break time="0.5s"/> that went well today." <break time="1.0s"/>

Third, design your environment <break time="0.5s"/> for success. <break time="0.5s"/> If you want <break time="0.5s"/> to eat healthier, <break time="0.5s"/> put fruits and vegetables <break time="0.5s"/> at eye level <break time="0.5s"/> in your refrigerator. <break time="0.5s"/> If you want <break time="0.5s"/> to read more, <break time="0.5s"/> place a book <break time="0.5s"/> on your pillow <break time="0.5s"/> so you see it <break time="0.5s"/> when you go to bed. <break time="1.0s"/>

Fourth, track your progress <break time="0.5s"/> visually. <break time="0.5s"/> Get a simple calendar <break time="0.5s"/> and put an X <break time="0.5s"/> on every day <break time="0.5s"/> you complete <break time="0.5s"/> your habit. <break time="0.5s"/> After a few days, <break time="0.5s"/> you'll have a chain. <break time="0.5s"/> Your only job <break time="0.5s"/> is to not break <break time="0.5s"/> the chain. <break time="1.0s"/>

## Conclusion: Your Transformation Journey

Here's what I want <break time="0.5s"/> you to remember: <break time="1.0s"/> you already have <break time="0.5s"/> everything you need <break time="0.5s"/> to start. <break time="0.5s"/> You don't need <break time="0.5s"/> more motivation, <break time="0.5s"/> more time, <break time="0.5s"/> or more resources. <break time="0.5s"/> You need <break time="0.5s"/> <emphasis level="moderate">one tiny action</emphasis> <break time="0.5s"/> that you can <break time="0.5s"/> take today <break time="0.5s"/> that aligns with <break time="0.5s"/> who you want <break time="0.5s"/> to become. <break time="1.0s"/>

Maybe it's drinking <break time="0.5s"/> one extra glass <break time="0.5s"/> of water, <break time="0.5s"/> writing one sentence <break time="0.5s"/> in a journal, <break time="0.5s"/> or taking three <break time="0.5s"/> deep breaths <break time="0.5s"/> before checking <break time="0.5s"/> your phone in <break time="0.5s"/> the morning. <break time="0.5s"/> Start there. <break time="0.5s"/> Start small. <break time="0.5s"/> Start TODAY. <break time="1.0s"/>

Because here's the <break time="0.5s"/> beautiful truth: <break time="0.5s"/> every small step <break time="0.5s"/> you take is proof <break time="0.5s"/> to yourself that <break time="0.5s"/> change is possible. <break time="0.5s"/> And that proof <break time="0.5s"/> becomes the foundation <break time="0.5s"/> for everything else <break time="0.5s"/> you want to build <break time="0.5s"/> in your life. <break time="1.0s"/>

The compound effect <break time="0.5s"/> of these small changes <break time="0.5s"/> is absolutely remarkable. <break time="0.5s"/> If you get <break time="0.5s"/> just 1% better <break time="0.5s"/> every single day <break time="0.5s"/> for one year, <break time="0.5s"/> you'll end up <break time="0.5s"/> 37 times better <break time="0.5s"/> by the end <break time="0.5s"/> of that year. <break time="0.5s"/> That's the power <break time="0.5s"/> of consistency <break time="0.5s"/> over perfection. <break time="1.0s"/>

So take that <break time="0.5s"/> first small step. <break time="0.5s"/> Trust the process. <break time="0.5s"/> And remember that <break time="0.5s"/> every expert was <break time="0.5s"/> once a beginner, <break time="0.5s"/> and every pro <break time="0.5s"/> was once an amateur. <break time="0.5s"/> Your journey starts <break time="0.5s"/> with a single <break time="0.5s"/> small action. <break time="0.5s"/> What will yours be? <break time="1.0s"/>`;
}

function generateMockAudioUrl() {
  // Return a longer mock audio URL for testing
  return "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";
}

function generateVTTFromText(text) {
  // Clean text of SSML tags for VTT generation but preserve break timing
  let cleanText = text;
  const breakMatches = [...text.matchAll(/<break time="([^"]*)"\/>/g)];
  
  // Replace SSML tags while preserving structure
  cleanText = cleanText
    .replace(/<break time="[^"]*"\/>/g, ' |BREAK| ')
    .replace(/<emphasis level="[^"]*">([^<]*)<\/emphasis>/g, '$1')
    .replace(/<prosody rate="[^"]*">([^<]*)<\/prosody>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into segments based on breaks
  const segments = cleanText.split(' |BREAK| ').filter(s => s.trim().length > 0);
  let vttData = "WEBVTT\n\n";
  
  const wordsPerMinute = 130; // Slower for better alignment
  const wordsPerSecond = wordsPerMinute / 60;
  let currentTime = 0;
  
  // Process each segment (separated by breaks)
  segments.forEach((segment, segmentIndex) => {
    const words = segment.trim().split(/\s+/).filter(w => w.length > 0);
    
    // Group words into phrases of exactly 3-5 words for perfect caption alignment
    for (let i = 0; i < words.length; i += 4) { // Use 4 as average between 3-5
      const phraseWords = words.slice(i, i + 4);
      const phrase = phraseWords.join(' ');
      
      const startTime = currentTime;
      const duration = phraseWords.length / wordsPerSecond;
      const endTime = currentTime + duration;
      
      const startFormatted = formatVTTTime(startTime);
      const endFormatted = formatVTTTime(endTime);
      
      vttData += `${startFormatted} --> ${endFormatted}\n${phrase}\n\n`;
      
      currentTime = endTime + 0.05; // Very small gap between phrases
    }
    
    // Add pause time based on break duration (if it was a break)
    if (segmentIndex < segments.length - 1) {
      currentTime += 0.5; // Default break time
    }
  });
  
  return vttData;
}

function formatVTTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}

async function getBookCover(bookTitle) {
  try {
    console.log(`Fetching book cover for: ${bookTitle}`);
    const cleanTitle = encodeURIComponent(bookTitle);
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${cleanTitle}&maxResults=1`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      if (book.imageLinks) {
        const coverUrl = book.imageLinks.large || book.imageLinks.medium || book.imageLinks.thumbnail;
        console.log(`Book cover found: ${coverUrl}`);
        return coverUrl;
      }
    }
  } catch (error) {
    console.log('Error fetching book cover:', error.message);
  }
  
  const fallbackUrl = `https://via.placeholder.com/300x450/f3f4f6/374151?text=${encodeURIComponent(bookTitle)}`;
  console.log(`Using fallback cover: ${fallbackUrl}`);
  return fallbackUrl;
}