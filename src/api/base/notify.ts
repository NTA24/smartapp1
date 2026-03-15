interface NotifyParams {
  event: string;
  param: Record<string, any>;
}

export const notify = (params: NotifyParams): void => {
  if (!window.WindVane) {
    console.error(
      "WindVane is not available. Please run in Mini App environment."
    );
    return;
  }

  window.WindVane.call("WVBase", "notify", params);
};
