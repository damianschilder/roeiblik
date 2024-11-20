export default defineEventHandler(async (event) => {
  const url = event.node.req.url || '';

  // Only handle requests explicitly starting with `/api/proxy/` and a valid path
  if (url.startsWith('/api/proxy/')) {
    const query = getQuery(event);
    const proxyPath = url.replace('/api/proxy', ''); // Strip '/api/proxy' from the URL

    // Validate if the path is allowed
    if (!proxyPath || proxyPath === '/') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid proxy path',
      });
    }

    // Construct the target URL
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

  // Let other routes proceed if the URL doesn't start with `/api/proxy`
  return null;
});
