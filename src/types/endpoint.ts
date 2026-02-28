export interface EndpointAuth {
  enabled: boolean;
  token: string;
}

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  model?: string;
  isStreaming: boolean;
  isDefault?: boolean;
  auth: EndpointAuth;
}

export interface EndpointFormData {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  model?: string;
  isStreaming: boolean;
  auth: EndpointAuth;
}
