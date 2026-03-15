export interface PromptParams {
  title?: string;
  message: string;
  hint?: string;
  okbutton?: string;
  cancelbutton?: string;
}

export interface PromptResult {
  ok: boolean;
  inputValue: string;
}

export const prompt = (params: PromptParams): Promise<PromptResult> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    const promptParams = {
      title: params.title || "",
      message: params.message,
      hint: params.hint || "",
      okbutton: params.okbutton || "OK",
      cancelbutton: params.cancelbutton || "Cancel",
    };

    window.WindVane.call(
      "WVUIDialog",
      "prompt",
      promptParams,
      (result: PromptResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to show prompt"));
      }
    );
  });
};

