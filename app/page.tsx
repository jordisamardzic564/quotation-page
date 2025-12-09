import QuotationView from "@/components/QuotationView";
import { Quotation } from "@/types/quotation";

const sampleData: Quotation[] = [
  {
    "offerte_id": 434,
    "offerte_url": "https://quote.korbachforged.com/offerte/S00591",
    "klant_naam": "Doris cipi",
    "voertuig": "Audi SQ7 2017",
    "priority": "",
    "producten": [
      {
        "prijs_per_stuk": 1337,
        "product_naam": "[PS20SGR23] Korbach Forged PS20 Satin Grey 23 inch\n10.5x23 5x112 ET20 CB66.5",
        "afbeelding": "https://zneejoqfgrqzvutkituy.supabase.co/storage/v1/object/public/wheel-products/PS20SGR23.webp",
        "model": "Service/Optie",
        "color": "PS20 Satin Grey 23 inch\n10.5x23 5x112 ET20 CB66.5",
        "size": "23 inch",
        "quantity": 4,
        "product_code": "PS20SGR23",
        "product_id": 1622
      },
      {
        "prijs_per_stuk": 0,
        "product_naam": "[AO1] Vehicle Tailored Engineering\nVehicle-specific concave design and finite element analysis for weight optimization ",
        "afbeelding": "https://zneejoqfgrqzvutkituy.supabase.co/storage/v1/object/public/wheel-products/AO1.webp",
        "model": "Service/Optie",
        "color": "Vehicle Tailored Engineering\nVehicle-specific concave design and finite element analysis for weight optimization ",
        "size": "",
        "quantity": 4,
        "product_code": "AO1",
        "product_id": 224
      },
      {
        "prijs_per_stuk": 0,
        "product_naam": "[AO2] Lightening Pockets\nWeight reducing pockets milled into the back pad of the wheel",
        "afbeelding": "https://zneejoqfgrqzvutkituy.supabase.co/storage/v1/object/public/wheel-products/AO2.webp",
        "model": "Service/Optie",
        "color": "Lightening Pockets\nWeight reducing pockets milled into the back pad of the wheel",
        "size": "",
        "quantity": 4,
        "product_code": "AO2",
        "product_id": 1251
      },
      {
        "prijs_per_stuk": 0,
        "product_naam": "[AO3] OEM Lug Bolts/Nuts Fitment\nMachine lug holes for use with OEM lug fasteners",
        "afbeelding": "https://zneejoqfgrqzvutkituy.supabase.co/storage/v1/object/public/wheel-products/AO3.webp",
        "model": "Service/Optie",
        "color": "OEM Lug Bolts/Nuts Fitment\nMachine lug holes for use with OEM lug fasteners",
        "size": "",
        "quantity": 4,
        "product_code": "AO3",
        "product_id": 1252
      },
      {
        "prijs_per_stuk": 0,
        "product_naam": "[AO7] Aluminum Caps - Standard Finish\nAluminum wheel caps matched with the standard finish of the wheels ",
        "afbeelding": "https://zneejoqfgrqzvutkituy.supabase.co/storage/v1/object/public/wheel-products/AO7.webp",
        "model": "Service/Optie",
        "color": "Aluminum Caps - Standard Finish\nAluminum wheel caps matched with the standard finish of the wheels ",
        "size": "",
        "quantity": 4,
        "product_code": "AO7",
        "product_id": 1255
      },
      {
        "prijs_per_stuk": 0,
        "product_naam": "Shipping Mainfreight\nCalculated afterwards",
        "afbeelding": "https://zneejoqfgrqzvutkituy.supabase.co/storage/v1/object/public/wheel-products/FALLBACK.webp",
        "model": "Shipping",
        "color": "Mainfreight\nCalculated afterwards",
        "size": "",
        "quantity": 1,
        "product_code": "FALLBACK",
        "product_id": 2216
      }
    ],
    "totaal_excl": 5348,
    "aantal_regels": 6,
    "aanbetaling": 1337,
    "valuta": "EUR"
  }
];

export default function Home() {
  const quotation = sampleData[0]; // We use the first item from the array provided

  return (
    <main className="min-h-screen">
      <QuotationView data={quotation} />
    </main>
  );
}
