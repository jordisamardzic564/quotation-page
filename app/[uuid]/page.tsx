import QuotationView from "@/components/QuotationView";
import SuccessView from "@/components/SuccessView";
import { Quotation } from "@/types/quotation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getUuidFallback(): Promise<string | undefined> {
  const h = await headers();
  const raw =
    h.get("x-vercel-forwarded-url") ||
    h.get("x-original-url") ||
    h.get("x-forwarded-path") ||
    h.get("next-url") ||
    h.get("referer") ||
    "";

  try {
    const u = new URL(raw);
    const parts = u.pathname.split("/").filter(Boolean);
    // Omdat we nu in de root zitten (/[id]), is het laatste deel van het path waarschijnlijk de ID.
    // We pakken het laatste deel, mits het niet leeg is.
    if (parts.length > 0) return parts[parts.length - 1];
  } catch {
    // ignore parse errors
  }
  return undefined;
}

async function getQuotation(uuid: string | undefined): Promise<Quotation | null> {
  if (!uuid) {
    console.error("uuid is missing");
    return null;
  }

  const base = process.env.N8N_BASE_URL;
  if (!base) {
    console.error("N8N_BASE_URL is not set");
    return null;
  }

  // n8n workflow leest momenteel `query.offerte_id` (niet `query.uuid`).
  // We sturen daarom de UUID mee als `offerte_id`, zodat n8n in Odoo kan zoeken op:
  // - sale.order.name (S00xxx) of
  // - x_studio_quotation_uuid (uuid)
  // Extra: we sturen ook `uuid` mee voor forward-compatibiliteit als de workflow later wél daarop gaat luisteren.
  const url = `${base.replace(/\/$/, "")}/webhook/offerte?offerte_id=${encodeURIComponent(
    uuid
  )}&uuid=${encodeURIComponent(uuid)}`;

  try {
    console.log("Fetching offerte", { uuid, url });
    const res = await fetch(url, { cache: "no-store" });
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

    const first = Array.isArray(data) ? data[0] : data;
    const item = first?.json || first;
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
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  let uuid =
    resolvedParams.uuid ||
    (typeof resolvedSearchParams?.uuid === "string"
      ? resolvedSearchParams.uuid
      : undefined) ||
    (await getUuidFallback());

  // VEILIGHEIDSCHECK: Voorkom dat systeembestanden als ID worden gezien
  if (uuid === 'favicon.ico' || uuid === 'robots.txt' || uuid === 'sitemap.xml') {
    return null;
  }

  // Debug logging to trace missing params in Vercel
  try {
    const headerEntries = Object.fromEntries((await headers()).entries());
    console.log("Offerte request debug", {
      params: resolvedParams,
      searchParams: resolvedSearchParams,
      headerSamples: {
        "x-vercel-forwarded-url": headerEntries["x-vercel-forwarded-url"],
        "x-original-url": headerEntries["x-original-url"],
        "x-forwarded-path": headerEntries["x-forwarded-path"],
        "next-url": headerEntries["next-url"],
        referer: headerEntries["referer"],
      },
    });
  } catch (e) {
    console.log("Header debug failed", e);
  }

  const quotation = await getQuotation(uuid);

  if (!quotation) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Quotation not found</h1>
          <p className="text-sm text-gray-400">Please check the link or contact us for assistance.</p>
        </div>
      </main>
    );
  }

  // Check payment status
  const status = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : undefined;

  if (status === 'success') {
    return (
      <main className="min-h-screen">
        <SuccessView data={quotation} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <QuotationView data={quotation} />
    </main>
  );
}
