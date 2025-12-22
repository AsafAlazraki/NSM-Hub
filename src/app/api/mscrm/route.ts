import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const resource = searchParams.get('resource');
  const authorization = request.headers.get('Authorization');

  if (!endpoint || !resource || !authorization) {
    return NextResponse.json({ error: 'Missing endpoint, resource, or authorization header' }, { status: 400 });
  }

  try {
    const apiRes = await fetch(`${resource}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const resource = searchParams.get('resource');
  const authorization = request.headers.get('Authorization');

  if (!endpoint || !resource || !authorization) {
    return NextResponse.json({ error: 'Missing endpoint, resource, or authorization header' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const apiRes = await fetch(`${resource}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
        const errorData = await apiRes.json();
        return NextResponse.json(errorData, { status: apiRes.status });
    }
    
    // For POST, Dynamics returns 201 Created with the entity data if 'Prefer: return=representation' is set.
    const data = await apiRes.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const resource = searchParams.get('resource');
  const authorization = request.headers.get('Authorization');

  if (!endpoint || !resource || !authorization) {
    return NextResponse.json({ error: 'Missing endpoint, resource, or authorization header' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const apiRes = await fetch(`${resource}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
        const errorData = await apiRes.json();
        return NextResponse.json(errorData, { status: apiRes.status });
    }
    
    // For PATCH, Dynamics might return 204 No Content on success, 
    // or the updated entity if 'Prefer: return=representation' is set.
    if (apiRes.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    
    const data = await apiRes.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}