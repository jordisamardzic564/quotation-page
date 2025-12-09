import QuotationView from "@/components/QuotationView";
import { Quotation } from "@/types/quotation";

export const dynamic = "force-dynamic";

async function getQuotation(offerteId: string): Promise<Quotation | null> {
  const base = process.env.N8N_BASE_URL;
  if (!base) {
    console.error("N8N_BASE_URL is not set");
    return null;
  }

  const url = `${base.replace(/\/$/, "")}/webhook/offerte?offerte_id=${encodeURIComponent(offerteId)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("Fetch failed", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    const item = Array.isArray(data) ? data[0]?.json : data?.json || data;
    if (!item) return null;
    return item as Quotation;
  } catch (err) {
    console.error("Fetch error", err);
    return null;
  }
}

export default async function OffertePage({
  params,
}: {
  params: { offerte_id: string };
}) {
  const quotation = await getQuotation(params.offerte_id);

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

