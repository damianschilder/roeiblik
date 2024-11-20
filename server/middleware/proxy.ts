export default defineEventHandler(async (event) => {
  const url = event.node.req.url || '';
  
  // Check if the request is for /api/proxy and dynamically handle different paths
  if (url.startsWith('/api/proxy')) {
    const query = getQuery(event);
    const proxyPath = url.replace('/api/proxy', ''); // Strip '/api/proxy' from the URL

    // Construct the target URL based on the dynamic path
    const targetUrl = `https://api.beta.regatta.time-team.nl/api/1${proxyPath}`;

    try {
      const response = await $fetch(targetUrl, {
        method: event.node.req.method || 'GET',
        headers: event.node.req.headers,
        params: query, // Forward query params, if any
      });

      return response;
    } catch (error) {
      console.error('Proxy error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to proxy request',
      });
    }
  }

  // If not targeting /api/proxy, let other routes proceed
});