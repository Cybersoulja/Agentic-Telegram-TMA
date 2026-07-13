interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

interface TelegramWebAppData {
  query_id?: string;
  user?: TelegramUser;
  receiver?: TelegramUser;
  chat?: {
    id: number;
    type: "group" | "supergroup" | "channel";
    title: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: "sender" | "private" | "group" | "supergroup" | "channel";
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramCloudStorage {
  setItem(
    key: string,
    value: string,
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  getItem(
    key: string,
    callback: (error: string | null, value: string | null) => void
  ): void;
  getItems(
    keys: string[],
    callback: (error: string | null, values: Record<string, string>) => void
  ): void;
  removeItem(
    key: string,
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  removeItems(
    keys: string[],
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  getKeys(callback: (error: string | null, keys: string[]) => void): void;
}

interface TelegramBiometricManager {
  isInited: boolean;
  isBiometricAvailable: boolean;
  biometricType: "fingerprint" | "face" | "unknown";
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  isBiometricTokenSaved: boolean;
  deviceId: string;

  init(callback?: () => void): void;
  requestAccess(
    params: { reason?: string },
    callback?: (granted: boolean) => void
  ): void;
  authenticate(
    params: { reason?: string },
    callback?: (isAuthenticated: boolean, token?: string) => void
  ): void;
  updateBiometricToken(
    token: string,
    callback?: (updated: boolean) => void
  ): void;
  openSettings(): void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppData;
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;

  CloudStorage?: TelegramCloudStorage;
  BiometricManager?: TelegramBiometricManager;

  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;

  HapticFeedback: {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };

  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
}
