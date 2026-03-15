export interface GetDataByFilePathParams {
  path: string;
}

export interface GetDataByFilePathResult {
  base64Data: string;
}

export declare function getDataByFilePath(
  params: GetDataByFilePathParams
): Promise<GetDataByFilePathResult>;
