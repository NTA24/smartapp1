export interface PlaySystemSoundParams {
  sound: number;
  count: number;
}

export const playSystemSound = (
  params: PlaySystemSoundParams
): Promise<void> => {
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
      "WVAudio",
      "playSystemSound",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to play system sound")
        );
      }
    );
  });
};
