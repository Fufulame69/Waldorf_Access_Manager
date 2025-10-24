export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      if (path === '/api/data' && request.method === 'GET') {
        // Get data from KV
        const data = await env.WALDORF_ACCESS_DATA.get('access_matrix_data', 'json');
        return new Response(JSON.stringify(data || {}), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      if (path === '/api/data' && request.method === 'POST') {
        // Save data to KV
        const data = await request.json();
        
        // Update metadata
        if (data.metadata) {
          data.metadata.lastModified = new Date().toISOString();
        } else {
          data.metadata = {
            version: "1.0.0",
            lastModified: new Date().toISOString(),
            description: "Hotel Access Matrix Management Data"
          };
        }
        
        await env.WALDORF_ACCESS_DATA.put('access_matrix_data', JSON.stringify(data));
        
        return new Response(JSON.stringify({ success: true, message: 'Data saved successfully' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Default response for unmatched routes
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};