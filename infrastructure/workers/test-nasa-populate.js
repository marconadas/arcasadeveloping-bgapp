export default {
  async fetch(request, env) {
    const date = new Date().toISOString().split('T')[0];
    const url = `https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/ocean-color?date=${date}`;
    
    console.log(`🧪 TEST: Calling URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return new Response(JSON.stringify({
      test: "new code",
      url: url,
      status: response.status,
      data: data
    }, null, 2));
  }
}
