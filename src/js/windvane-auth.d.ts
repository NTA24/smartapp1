/** Response từ WindVane getAuthCode */
export interface AuthCodeResponse {
  authCode: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export declare function getAuthCode(
  appId: string,
  scopes?: string[]
): Promise<AuthCodeResponse>;
