import QuotationView from "@/components/QuotationView";
import { Quotation } from "@/types/quotation";

export const dynamic = "force-dynamic";

async function getQuotation(offerteId: string | undefined): Promise<Quotation | null> {
  if (!offerteId) {
    console.error("offerte_id is missing");
    return null;
  }

  const base = process.env.N8N_BASE_URL;
  if (!base) {
    console.error("N8N_BASE_URL is not set");
    return null;
  }

  const url = `${base.replace(/\/$/, "")}/webhook/offerte`;

  try {
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerte_id: offerteId }),
    });
    if (!res.ok) {
      console.error("Fetch failed", res.status, res.statusText);
      return null;
    }

    const text = await res.text();
    if (!text) {
      console.error("Empty response from n8n", res.status);
      return null;
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse failed", err, "body:", text.slice(0, 200));
      return null;
    }

    const item = Array.isArray(data) ? data[0]?.json : data?.json || data;
    if (!item) {
      console.error("No item in n8n response", data);
      return null;
    }
    return item as Quotation;
  } catch (err) {
    console.error("Fetch error", err);
    return null;
  }
}

export default async function OffertePage({
  params,
  searchParams,
}: {
  params: { offerte_id?: string };
  searchParams?: { offerte_id?: string };
}) {
  const offerteId = params?.offerte_id || searchParams?.offerte_id;
  const quotation = await getQuotation(offerteId);

  if (!quotation) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Offerte niet gevonden</h1>
          <p className="text-sm text-gray-400">Controleer het offerte ID.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <QuotationView data={quotation} />
    </main>
  );
}

