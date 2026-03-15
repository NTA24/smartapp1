/** Response từ WindVane getAuthCode */
export interface AuthCodeResponse {
  authCode: string;
  [key: string]: any;
}

export declare function getAuthCode(
  appId: string,
  scopes?: string[]
): Promise<AuthCodeResponse>;
