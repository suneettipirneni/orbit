export type DefaultDeckBehavior = "current" | "note-type";
export type OrbitThemePreference = "auto" | "dark" | "light";
export type PowerSyncStorageModePreference = "auto" | "local-only" | "synced";

export interface AnkiPreferences {
  answerKeys: string;
  checkForUpdates: boolean;
  dailyBackups: number;
  defaultDeckBehavior: DefaultDeckBehavior;
  defaultSearchText: string;
  generateLatexImages: boolean;
  hideBottomBarDuringReview: boolean;
  hideTopBarDuringReview: boolean;
  ignoreAccentsInSearch: boolean;
  interruptAudioOnAnswer: boolean;
  language: string;
  learnAheadMinutes: number;
  minimalistMode: boolean;
  minutesBetweenBackups: number;
  monthlyBackups: number;
  nextDayStartsAt: number;
  pasteImagesAsPng: boolean;
  pasteWithoutShiftStripsFormatting: boolean;
  powerSyncStorageMode: PowerSyncStorageModePreference;
  reduceMotion: boolean;
  showAudioPlayButtons: boolean;
  showNextReviewTime: boolean;
  showRemainingCardCount: boolean;
  spacebarRatesCard: boolean;
  style: string;
  theme: OrbitThemePreference;
  timeboxMinutes: number;
  uiSizePercent: number;
  videoDriver: string;
  weeklyBackups: number;
  windowSizesReset: boolean;
}

export const defaultAnkiPreferences: AnkiPreferences = {
  answerKeys: "1=Again,2=Hard,3=Good,4=Easy",
  checkForUpdates: true,
  dailyBackups: 7,
  defaultDeckBehavior: "current",
  defaultSearchText: "",
  generateLatexImages: false,
  hideBottomBarDuringReview: false,
  hideTopBarDuringReview: false,
  ignoreAccentsInSearch: false,
  interruptAudioOnAnswer: false,
  language: "en",
  learnAheadMinutes: 0,
  minimalistMode: false,
  minutesBetweenBackups: 30,
  monthlyBackups: 12,
  nextDayStartsAt: 4,
  pasteImagesAsPng: true,
  pasteWithoutShiftStripsFormatting: true,
  powerSyncStorageMode: "auto",
  reduceMotion: false,
  showAudioPlayButtons: true,
  showNextReviewTime: false,
  showRemainingCardCount: true,
  spacebarRatesCard: true,
  style: "native",
  theme: "auto",
  timeboxMinutes: 0,
  uiSizePercent: 100,
  videoDriver: "auto",
  weeklyBackups: 4,
  windowSizesReset: false,
};

const ankiPreferencesStorageKey = "orbit:anki-preferences";

export function loadAnkiPreferences(): AnkiPreferences {
  if (typeof window === "undefined") {
    return defaultAnkiPreferences;
  }

  const storedPreferences = window.localStorage.getItem(ankiPreferencesStorageKey);

  if (!storedPreferences) {
    return defaultAnkiPreferences;
  }

  try {
    return normalizeAnkiPreferences(JSON.parse(storedPreferences));
  } catch {
    return defaultAnkiPreferences;
  }
}

export function saveAnkiPreferences(preferences: AnkiPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPreferences = normalizeAnkiPreferences(preferences);

  window.localStorage.setItem(ankiPreferencesStorageKey, JSON.stringify(normalizedPreferences));
  applyAnkiAppearancePreferences(normalizedPreferences);
  window.dispatchEvent(
    new CustomEvent("orbit:anki-preferences-changed", { detail: normalizedPreferences }),
  );
}

export function applyAnkiAppearancePreferences(preferences = loadAnkiPreferences()) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.orbitTheme = preferences.theme;
  root.dataset.orbitStyle = preferences.style;
  root.style.fontSize = `${Math.round((16 * preferences.uiSizePercent) / 100)}px`;
}

export function normalizeTextForAccentPreference(value: string, ignoreAccents: boolean) {
  if (!ignoreAccents) {
    return value.toLowerCase();
  }

  return value
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function parseAnswerKeyPreference(answerKeys: string): Record<string, string> {
  const keyMap: Record<string, string> = {};

  for (const part of answerKeys.split(",")) {
    const [key = "", label = ""] = part.split("=").map((value) => value.trim());

    if (key && label) {
      keyMap[key] = label;
    }
  }

  return keyMap;
}

function normalizeAnkiPreferences(input: unknown): AnkiPreferences {
  const candidate = input && typeof input === "object" ? input : {};

  return {
    ...defaultAnkiPreferences,
    ...(candidate as Partial<AnkiPreferences>),
  };
}
