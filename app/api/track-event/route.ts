import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if N8N_BASE_URL is configured, otherwise fallback (or fail if preferred)
    const n8nBase = process.env.N8N_BASE_URL || 'https://n8n.srv865019.hstgr.cloud';
    
    // Stuur verzoek naar N8N
    const n8nResponse = await fetch(`${n8nBase.replace(/\/$/, "")}/webhook/offerte-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!n8nResponse.ok) {
        // We loggen de error maar returnen success naar de client om de UI niet te verstoren
        // (tracking is 'best effort')
        console.error('N8N Tracking Error:', n8nResponse.status, await n8nResponse.text());
        return NextResponse.json({ success: false, error: 'N8N error' }, { status: 500 });
    }

    // Tracking hoeft geen data terug te geven
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


