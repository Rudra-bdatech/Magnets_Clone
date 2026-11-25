interface LibredeskSettings {
  baseURL: string;
  inboxID: string;
  userJWT?: string;
  [key: string]: any;
}

interface LibredeskInstance {
  setUser?: (jwt: string) => void;
  logout?: () => void;
  [key: string]: any;
}

interface Window {
  LibredeskSettings?: LibredeskSettings;
  Libredesk?: LibredeskInstance;
}
