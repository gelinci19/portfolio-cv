export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "json",
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
    return new Response("Failed to obtain access token from GitHub", { status: 400 });
  }

  const script = `
    script.opener.postMessage(
      "authorization:github:success:${JSON.stringify({ token, provider: "github" })}",
      *
    );
    script.close();
  `;

  return new Response(`<!DOCTYPE html><html><body><script>${script}</script></body></html>`, {
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}