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
    const summaryData = JSON.parse(event.body);
    
    // For now, just return success since we don't have a database
    // In production, you would save to your database here
    console.log('Summary saved (mock):', summaryData.title);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Summary saved successfully' })
    };

  } catch (error) {
    console.error('Error saving summary:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ detail: `Error saving summary: ${error.message}` })
    };
  }
};