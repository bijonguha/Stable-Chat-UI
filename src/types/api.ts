export interface ApiRequest {
  thread_id: string;
  messages: {
    role: string;
    text: string;
  };
  model?: string;
  stream?: boolean;
}

export interface ApiResponse {
  text: string;
  thread_id?: string;
  conversation_id?: string;
  error?: string | { details?: string };
  time?: string;
}

export interface ResponseTimeStats {
  [endpointId: string]: {
    times: number[];
    total: number;
    count: number;
  };
}
