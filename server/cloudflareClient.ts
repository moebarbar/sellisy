const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function getHeaders(): Record<string, string> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN not configured");
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getZoneId(): string {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) throw new Error("CLOUDFLARE_ZONE_ID not configured");
  return zoneId;
}

export function isCloudflareConfigured(): boolean {
  return !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
}

export interface CustomHostnameResult {
  id: string;
  hostname: string;
  status: string;
  sslStatus: string;
  verificationErrors?: string[];
  ownershipVerification?: {
    type: string;
    name: string;
    value: string;
  };
}

export async function createCustomHostname(hostname: string): Promise<CustomHostnameResult> {
  const zoneId = getZoneId();
  const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/custom_hostnames`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      hostname,
      ssl: {
        method: "http",
        type: "dv",
      },
    }),
  });

  const data = await res.json() as any;
  if (!data.success) {
    const errMsg = data.errors?.map((e: any) => e.message).join(", ") || "Failed to create custom hostname";
    throw new Error(errMsg);
  }

  return {
    id: data.result.id,
    hostname: data.result.hostname,
    status: data.result.status,
    sslStatus: data.result.ssl?.status || "unknown",
    ownershipVerification: data.result.ownership_verification,
  };
}

export async function getCustomHostname(hostnameId: string): Promise<CustomHostnameResult> {
  const zoneId = getZoneId();
  const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/custom_hostnames/${hostnameId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await res.json() as any;
  if (!data.success) {
    const errMsg = data.errors?.map((e: any) => e.message).join(", ") || "Failed to get custom hostname";
    throw new Error(errMsg);
  }

  return {
    id: data.result.id,
    hostname: data.result.hostname,
    status: data.result.status,
    sslStatus: data.result.ssl?.status || "unknown",
    verificationErrors: data.result.verification_errors,
  };
}

export async function deleteCustomHostname(hostnameId: string): Promise<boolean> {
  const zoneId = getZoneId();
  const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/custom_hostnames/${hostnameId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const data = await res.json() as any;
  return data.success === true;
}

export async function createWorkerRoute(pattern: string, workerName: string = "sellisy-router"): Promise<string | null> {
  try {
    const zoneId = getZoneId();
    const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/workers/routes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        pattern,
        script: workerName,
      }),
    });
    const data = await res.json() as any;
    if (!data.success) {
      console.error("Failed to create Worker route:", data.errors);
      return null;
    }
    return data.result?.id || null;
  } catch (err) {
    console.error("Error creating Worker route:", err);
    return null;
  }
}

export async function deleteWorkerRoute(routeId: string): Promise<boolean> {
  try {
    const zoneId = getZoneId();
    const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/workers/routes/${routeId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json() as any;
    return data.success === true;
  } catch (err) {
    console.error("Error deleting Worker route:", err);
    return false;
  }
}

export async function listCustomHostnames(hostname?: string): Promise<CustomHostnameResult[]> {
  const zoneId = getZoneId();
  const params = hostname ? `?hostname=${encodeURIComponent(hostname)}` : "";
  const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/custom_hostnames${params}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await res.json() as any;
  if (!data.success) return [];

  return (data.result || []).map((r: any) => ({
    id: r.id,
    hostname: r.hostname,
    status: r.status,
    sslStatus: r.ssl?.status || "unknown",
  }));
}
