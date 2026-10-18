// BCP 47 codes (used for speech synthesis) + display names (sent to the backend).
export const LANGUAGES = [
  { code: "ar-SA", name: "Arabic" },
  { code: "bn-IN", name: "Bengali" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "cs-CZ", name: "Czech" },
  { code: "da-DK", name: "Danish" },
  { code: "nl-NL", name: "Dutch" },
  { code: "en-GB", name: "English (UK)" },
  { code: "en-US", name: "English (US)" },
  { code: "fi-FI", name: "Finnish" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "el-GR", name: "Greek" },
  { code: "he-IL", name: "Hebrew" },
  { code: "hi-IN", name: "Hindi" },
  { code: "hu-HU", name: "Hungarian" },
  { code: "id-ID", name: "Indonesian" },
  { code: "it-IT", name: "Italian" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "ms-MY", name: "Malay" },
  { code: "nb-NO", name: "Norwegian" },
  { code: "fa-IR", name: "Persian" },
  { code: "pl-PL", name: "Polish" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)" },
  { code: "ro-RO", name: "Romanian" },
  { code: "ru-RU", name: "Russian" },
  { code: "es-ES", name: "Spanish" },
  { code: "sw-KE", name: "Swahili" },
  { code: "sv-SE", name: "Swedish" },
  { code: "th-TH", name: "Thai" },
  { code: "tr-TR", name: "Turkish" },
  { code: "uk-UA", name: "Ukrainian" },
  { code: "ur-PK", name: "Urdu" },
  { code: "vi-VN", name: "Vietnamese" },
];

const STORAGE_KEY = "targetLang";

export function getLangName(code) {
  return LANGUAGES.find((lang) => lang.code === code)?.name;
}

export function getSavedLang() {
  const code = localStorage.getItem(STORAGE_KEY);
  return getLangName(code) ? code : "";
}

export function saveLang(code) {
  localStorage.setItem(STORAGE_KEY, code);
}

// Fills a <select> with a leading option + every language. The leading option is a
// disabled placeholder unless it has a value of its own (e.g. "auto" for detection).
export function fillLanguageSelect(select, { label, value = "", selected = getSavedLang() }) {
  const first = new Option(label, value);
  first.disabled = !value;
  select.replaceChildren(first, ...LANGUAGES.map((l) => new Option(l.name, l.code)));
  select.value = selected || value;
}
