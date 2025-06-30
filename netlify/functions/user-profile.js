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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ detail: 'Method not allowed' })
    };
  }

  try {
    // For now, return mock profile data
    // In production, you would fetch from your database here
    
    const mockProfile = {
      email: 'user@example.com',
      tier: 'free',
      daily_generation_count: 0,
      last_generation_date: ''
    };
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(mockProfile)
    };

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ detail: `Error fetching user profile: ${error.message}` })
    };
  }
};