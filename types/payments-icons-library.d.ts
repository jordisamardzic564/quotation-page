declare module "payments-icons-library" {
  export type PaymentsIconSize = "sm" | "md" | "lg" | "svg";

  export interface PaymentsIcon {
    icon_name: string;
    icon_url: string;
    icon_version: string;
  }

  export interface PaymentsIconsLibrary {
    getIcon(searchString: string, size: PaymentsIconSize): PaymentsIcon;
    getIcons(searchStrings: string[], size: PaymentsIconSize): PaymentsIcon[];
    getModesIcons(
      modeType:
        | "cardbanks"
        | "cardschemes"
        | "paylater"
        | "upi"
        | "wallet"
        | "cardless"
        | "aggregators",
      size: PaymentsIconSize
    ): PaymentsIcon[];
  }

  const icons: PaymentsIconsLibrary;
  export default icons;
}


