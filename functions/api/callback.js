export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "user-agent": "cloudflare-pages-auth"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const result = await response.json();
    const token = result.access_token;

    if (!token) {
      return new Response(`Token exchange failed: ${JSON.stringify(result)}`, { status: 400 });
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Success</title></head>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                console.log("receiveMessage %o", e);
                window.opener.postMessage(
                  'authorization:github:success:${JSON.stringify({ token, provider: "github" })}',
                  e.origin
                );
                window.removeEventListener("message", receiveMessage, false);
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:github", "*");
              window.close();
            })();
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  } catch (err) {
    return new Response(`Server error: ${err.message}`, { status: 500 });
  }
}
