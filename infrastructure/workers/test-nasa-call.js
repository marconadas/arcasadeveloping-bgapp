/**
 * Simple test worker to isolate NASA proxy calling issue
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const url = `https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/ocean-color?date=${date}`;

      console.log('=== TEST WORKER START ===');
      console.log('Generated date:', date);
      console.log('Calling URL:', url);

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const text = await response.text();
      console.log('Response text length:', text.length);
      console.log('Response text start:', text.substring(0, 200));

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'NASA proxy returned non-200',
          status: response.status,
          text: text,
          date: date,
          url: url
        }, null, 2), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = JSON.parse(text);

      return new Response(JSON.stringify({
        success: true,
        date: date,
        url: url,
        points_received: data.points?.length || 0
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Test worker error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
