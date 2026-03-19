/// <reference types="vite/client" />

export interface CrossrefDateParts {
  'date-parts': (number)[][];
}

export interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

export interface CrossrefFacet { 
  "value-count": number;
  values: Record<string, number>;
}

export interface CrossrefWorkItem {
  author?: CrossrefAuthor[];
  'container-title'?: string[];
  URL?: string;
  title?: string[];
  type?: string;
  published?: CrossrefDateParts;
}

export interface CrossrefQuery {
  'start-index': number;
  'search-terms': string;
}

export interface CrossrefMessage {
  'items-per-page': number;
  query: CrossrefQuery;
  'total-results': number;
  'next-cursor'?: string;
  facets?: Record<string, CrossrefFacet>;
  items: CrossrefWorkItem[];
}

export interface CrossrefResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: CrossrefMessage;
}

