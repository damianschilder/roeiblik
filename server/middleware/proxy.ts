// In-memory rate limit store
const rateLimitStore: Record<string, { count: number; lastRequest: number }> = {};

const MAX_REQUESTS_PER_MINUTE = 1000; // Max 10 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute in milliseconds

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || '';

  // Rate limit logic for all requests
  const ipAddress = event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress;

  if (ipAddress) {
    const now = Date.now();
    let requestInfo = rateLimitStore[ipAddress as string];

    if (requestInfo) {
      const elapsedTime = now - requestInfo.lastRequest;

      if (elapsedTime < RATE_LIMIT_WINDOW_MS) {
        requestInfo.count += 1;
      } else {
        // Reset the count after the rate limit window has passed
        requestInfo = { count: 1, lastRequest: now };
      }
    } else {
      // Initialize the count for this IP
      requestInfo = { count: 1, lastRequest: now };
    }

    if (requestInfo.count > MAX_REQUESTS_PER_MINUTE) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests, please try again later',
      });
    }

    // Save updated rate limit info back
    rateLimitStore[ipAddress as string] = requestInfo;
  }

  // Check if the request is for /api/proxy and dynamically handle different paths
  if (url.startsWith('/api/proxy')) {
    const query = getQuery(event);
    const proxyPath = url.replace('/api/proxy', ''); // Strip '/api/proxy' from the URL

    // Construct the target URL based on the dynamic path
    const targetUrl = `https://api.beta.regatta.time-team.nl/api/1${proxyPath}`;

    try {
      // Forward the request to the target API
      const response = await $fetch(targetUrl, {
        method: event.node.req.method || 'GET',
        headers: event.node.req.headers,
        params: query, // Forward query params, if any
      });

      return response; // Return the proxied response
    } catch (error) {
      console.error('Proxy error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to proxy request',
      });
    }
  }

  // Allow other routes to proceed as normal if they don't match '/api/proxy'
  return; // Return `undefined` to let Nuxt handle non-matching routes
});
