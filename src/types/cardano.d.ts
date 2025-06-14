interface CardanoAPI {
  enable(): Promise<any>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
}

declare global {
  interface Window {
    cardano?: {
      [key: string]: CardanoAPI;
      nami?: CardanoAPI;
      eternl?: CardanoAPI;
      flint?: CardanoAPI;
      gerowallet?: CardanoAPI;
      typhon?: CardanoAPI;
      yoroi?: CardanoAPI;
      lace?: CardanoAPI;
    };
  }
}

export {}; 