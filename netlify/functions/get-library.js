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
    // For now, return empty library since we don't have a database
    // In production, you would fetch from your database here
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ library: [] })
    };

  } catch (error) {
    console.error('Error fetching library:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ detail: `Error fetching library: ${error.message}` })
    };
  }
};