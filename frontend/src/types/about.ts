export interface AboutResponse {
  id: string;
  content: string;
  version: string;
  updatedByName?: string;
  updatedAt: string;
}

export interface UpdateAboutRequest {
  content: string;
  version: string;
}
