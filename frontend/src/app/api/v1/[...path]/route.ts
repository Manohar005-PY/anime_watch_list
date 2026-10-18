import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendBaseUrl(): string {
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.INTERNAL_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
}

// In-memory cache for Google Cloud Run OIDC ID token
let cachedIdToken: { token: string; expiresAt: number } | null = null;

async function getGcpIdToken(audience: string): Promise<string | null> {
  const now = Date.now();
  // Return cached token if valid for at least 5 more minutes
  if (cachedIdToken && cachedIdToken.expiresAt > now + 300_000) {
    return cachedIdToken.token;
  }

  try {
    // Query Google Cloud instance metadata server
    const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(metadataUrl, {
      headers: { "Metadata-Flavor": "Google" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const token = (await res.text()).trim();
      if (token) {
        // Cache token for 50 minutes (Google ID tokens are valid for 60 minutes)
        cachedIdToken = {
          token,
          expiresAt: now + 50 * 60 * 1000,
        };
        return token;
      }
    }
  } catch {
    // Not running on GCP or metadata server unreachable (e.g. local dev, docker-compose)
  }
  return null;
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathStr = path ? path.join("/") : "";
  const search = req.nextUrl.search;
  const backendUrl = getBackendBaseUrl();
  const targetUrl = `${backendUrl}/api/v1/${pathStr}${search}`;

  const forwardHeaders = new Headers();

  // Forward client headers excluding hop-by-hop headers
  req.headers.forEach((val, key) => {
    const k = key.toLowerCase();
    if (!["host", "connection", "transfer-encoding"].includes(k)) {
      forwardHeaders.set(key, val);
    }
  });

  // Service-to-Service IAM Authentication for Private Cloud Run Backend:
  // When target is a remote HTTPS Cloud Run service or ENABLE_GCP_IAM_AUTH is true,
  // obtain an OIDC ID token from the GCP metadata server with the backend URL as audience.
  const isRemoteHttps = backendUrl.startsWith("https://");
  const isIamAuthExplicit = process.env.ENABLE_GCP_IAM_AUTH === "true";

  if (isRemoteHttps || isIamAuthExplicit) {
    const backendAudience = process.env.BACKEND_IAM_AUDIENCE || backendUrl;
    const idToken = await getGcpIdToken(backendAudience);
    if (idToken) {
      // Cloud Run natively evaluates X-Serverless-Authorization for IAM invocation
      // while passing the application Authorization header through to the container
      forwardHeaders.set("X-Serverless-Authorization", `Bearer ${idToken}`);
      if (!forwardHeaders.has("Authorization")) {
        forwardHeaders.set("Authorization", `Bearer ${idToken}`);
      }
    }
  }

  // Ensure Origin and Referer are set accurately for CSRF/origin validation
  let clientOrigin = req.headers.get("origin");
  if (!clientOrigin) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
    if (host && !host.startsWith("0.0.0.0")) {
      clientOrigin = `${proto}://${host}`;
    } else {
      clientOrigin = req.nextUrl.origin;
    }
  }
  forwardHeaders.set("Origin", clientOrigin);
  if (!forwardHeaders.has("Referer")) {
    forwardHeaders.set("Referer", req.headers.get("referer") || req.nextUrl.href);
  }

  // Forward client IP and host for rate-limiting and telemetry
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  forwardHeaders.set("X-Forwarded-For", clientIp);
  forwardHeaders.set("X-Forwarded-Proto", req.nextUrl.protocol.replace(":", ""));
  forwardHeaders.set("X-Forwarded-Host", req.headers.get("host") || req.nextUrl.host);

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(req.method.toUpperCase())) {
    init.body = await req.arrayBuffer();
  }

  try {
    const backendRes = await fetch(targetUrl, init);

    const resHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (!["set-cookie", "transfer-encoding", "connection"].includes(k)) {
        resHeaders.set(key, val);
      }
    });

    const response = new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });

    // Forward all Set-Cookie headers accurately
    const cookies = backendRes.headers.getSetCookie ? backendRes.headers.getSetCookie() : [];
    cookies.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reverse proxy connection failure";
    return NextResponse.json(
      { detail: `API gateway error connecting to backend: ${message}` },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
