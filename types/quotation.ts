export interface Product {
  prijs_per_stuk: number;
  product_naam: string;
  afbeelding: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  product_code: string;
  product_id: number;
}

export interface Quotation {
  offerte_id: number;
  name: string;
  offerte_url: string;
  klant_naam: string;
  voertuig: string;
  priority: string;
  producten: Product[];
  totaal_excl: number;
  aantal_regels: number;
  aanbetaling: number;
  valuta: string;
  payment_mode?: 'deposit' | 'full';
  geldig_tot: string;
  has_tax?: boolean;
  totaal_incl?: number;
}

