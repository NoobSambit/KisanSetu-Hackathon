const DEFAULT_TOKEN_SKEW_MS = 10_000;

export const CDSE_CATALOG_URL = 'https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search';
export const CDSE_PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

let cachedToken: { value: string; expiresAt: number } | null = null;

interface CDSETokenResponse {
  access_token: string;
  expires_in: number;
}

export function validateCDSEEnv(): { ok: boolean; message?: string } {
  if (!process.env.CDSE_CLIENT_ID) {
    return { ok: false, message: 'CDSE_CLIENT_ID is missing in environment.' };
  }

  if (!process.env.CDSE_CLIENT_SECRET) {
    return { ok: false, message: 'CDSE_CLIENT_SECRET is missing in environment.' };
  }

  if (!process.env.CDSE_TOKEN_URL) {
    return { ok: false, message: 'CDSE_TOKEN_URL is missing in environment.' };
  }

  return { ok: true };
}

export async function getCDSEAccessToken(): Promise<string> {
  const envStatus = validateCDSEEnv();
  if (!envStatus.ok) {
    throw new Error(envStatus.message || 'CDSE credentials are not configured.');
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + DEFAULT_TOKEN_SKEW_MS) {
    return cachedToken.value;
  }

  const tokenUrl = process.env.CDSE_TOKEN_URL || '';
  const clientId = process.env.CDSE_CLIENT_ID || '';
  const clientSecret = process.env.CDSE_CLIENT_SECRET || '';

  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`CDSE token request failed (${response.status}): ${responseText.slice(0, 200)}`);
  }

  const data = (await response.json()) as CDSETokenResponse;
  if (!data.access_token) {
    throw new Error('CDSE token response did not include access_token.');
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: now + Math.max(30, data.expires_in - 30) * 1000,
  };

  return data.access_token;
}
