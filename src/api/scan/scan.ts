export interface ScanParams {
  openFlight?: boolean;
  title?: string;
}

export interface ScanResult {
  content: string;
  format: string;
}

export const scan = (params: ScanParams = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    window.WindVane.call(
      "WVScan",
      "scan",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(error?.msg || JSON.stringify(error) || "Failed to scan")
        );
      }
    );
  });
};
