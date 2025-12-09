import { redirect } from "next/navigation";

export default function Home() {
  // Redirect naar een bekende offerte; pas aan naar behoefte (bijv. formulier)
  redirect("/offerte/S00591");
}
