export interface VibrateParams {
  duration?: number;
}

export const vibrate = (params: VibrateParams = {}): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.WindVane) {
      resolve();
      return;
    }

    window.WindVane.call("WVMotion", "vibrate", params, () => resolve());
  });
};
