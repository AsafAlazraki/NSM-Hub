import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tenantId, clientId, clientSecret, resource } = await request.json();

    if (!tenantId || !clientId || !clientSecret || !resource) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;

    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);
    body.append('resource', resource);

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      // Forward the error from Microsoft's endpoint
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
