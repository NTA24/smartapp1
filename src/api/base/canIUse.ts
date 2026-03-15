interface CanIUseParams {
  api: string;
  method?: string;
}

interface CanIUseResult {
  canUse: boolean;
}

export const canIUse = (params: CanIUseParams): Promise<boolean> => {
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
      "WVBase",
      "canIUse",
      params,
      (result: any) => {
        console.log("canIUse success result:", result);
        // Handle different possible response formats
        if (typeof result === "boolean") {
          resolve(result);
        } else if (result && typeof result.canUse === "boolean") {
          resolve(result.canUse);
        } else {
          // If result format is unexpected, log and assume false
          console.warn("Unexpected canIUse result format:", result);
          resolve(false);
        }
      },
      (error: any) => {
        console.error("canIUse error:", error);
        reject(
          new Error(JSON.stringify(error) || "Failed to check API availability")
        );
      }
    );
  });
};
