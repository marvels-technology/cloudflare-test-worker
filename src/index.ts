export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    // Handle secure root request
    if (url.pathname === "/secure") {
      return handleSecureRequest(request);
    }

    // Handle flag requests
    const flagMatch = url.pathname.match(/^\/secure\/(.+)$/);
    if (flagMatch) {
      return handleFlagRequest(flagMatch[1], env);
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function handleSecureRequest(request: Request): Promise<Response> {
  const headers = request.headers;
  const email = headers.get("Cf-Access-Authenticated-User-Email");
  const timestamp = new Date().toISOString();
  const country = headers.get("Cf-IPCountry") || "Unknown";

  if (!email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const countryLink = `<a href="/secure/${country}">${country}</a>`;
  const responseHTML = `<html>
      <body>
        <p>${email} authenticated at ${timestamp} from ${countryLink}</p>
      </body>
    </html>`;

  return new Response(responseHTML, {
    headers: { "Content-Type": "text/html" },
  });
}

async function handleFlagRequest(country: string, env: any): Promise<Response> {
  try {
    const object = await env.FLAG_BUCKET.get(`${country.toLowerCase()}.svg`);
    if (!object) {
      return new Response("Flag not found", { status: 404 });
    }
    
    return new Response(object.body, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch (err) {
    return new Response("Error fetching flag", { status: 500 });
  }
}
