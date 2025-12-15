import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { offerte_id, uuid } = body;

    // Check if N8N_BASE_URL is configured
    const n8nBase = process.env.N8N_BASE_URL;
    if (!n8nBase) {
      console.error('N8N_BASE_URL not configured');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Stuur verzoek naar N8N
    const n8nResponse = await fetch(`${n8nBase.replace(/\/$/, "")}/webhook/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            offerte_id,
            uuid,
            // Dynamisch de return URL bepalen
            return_url: `${request.headers.get('origin')}/${uuid}?status=success`
        })
    });

    if (!n8nResponse.ok) {
        console.error('N8N Error:', n8nResponse.status, await n8nResponse.text());
        throw new Error('Failed N8N call');
    }

    const data = await n8nResponse.json();
    
    // N8N moet { "url": "..." } teruggeven
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment Error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
