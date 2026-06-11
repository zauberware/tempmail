/* eslint-disable @typescript-eslint/no-explicit-any */
// Tiny in-app i18n. No external dep. Pick "de" / "en" / "auto" (= browser).

export type Lang = "de" | "en";
export type LangPref = "de" | "en" | "auto";

const STR = {
  initializing: { de: "initialisiere…", en: "loading…" },
  apply: { de: "Übernehmen", en: "Apply" },
  random_tooltip: { de: "Random (n)", en: "Random (n)" },
  copy_tooltip: { de: "Adresse kopieren (c)", en: "Copy address (c)" },
  copied_state: { de: "Kopiert ✓", en: "Copied ✓" },
  refresh_tooltip: { de: "Refresh (r)", en: "Refresh (r)" },
  clear_tooltip: { de: "Postfach leeren (Shift+E)", en: "Empty inbox (Shift+E)" },
  history_label: { de: "Letzte Inboxes", en: "Recent inboxes" },
  history_header: { de: "Verlauf (lokal gespeichert)", en: "History (saved locally)" },
  history_empty: { de: "Noch nichts hier.", en: "Nothing here yet." },
  history_remove: { de: "aus Verlauf entfernen", en: "Remove from history" },
  active: { de: "aktiv", en: "active" },
  age_now: { de: "gerade", en: "now" },
  loading_state: { de: "lade…", en: "loading…" },
  loading_short: { de: "lade", en: "loading" },
  live_state: { de: "live", en: "live" },
  shortcuts_tooltip: { de: "Tastenkürzel anzeigen (?)", en: "Show shortcuts (?)" },
  tour_tooltip: { de: "Tour anzeigen", en: "Show tour" },
  menu_label: { de: "Menü", en: "Menu" },
  new_random: { de: "Neue Random-Adresse", en: "New random address" },
  refresh_label: { de: "Refresh", en: "Refresh" },
  clear_label: { de: "Postfach leeren", en: "Empty inbox" },
  copy_address: { de: "Adresse kopieren", en: "Copy address" },
  copy_address_done: { de: "Adresse kopiert ✓", en: "Address copied ✓" },
  theme_light: { de: "Hell", en: "Light" },
  theme_dark: { de: "Dunkel", en: "Dark" },
  theme_system: { de: "System", en: "System" },
  theme_label: { de: "Theme", en: "Theme" },
  shortcuts_label: { de: "Tastenkürzel", en: "Shortcuts" },
  tour_label: { de: "Tour anzeigen", en: "Show tour" },
  back_to_list: { de: "Zurück zur Liste", en: "Back to list" },
  actions_label: { de: "Aktionen", en: "Actions" },
  download_eml: { de: ".eml herunterladen", en: "Download .eml" },
  delete: { de: "Löschen", en: "Delete" },
  confirm_delete: { de: "Mail wirklich löschen?", en: "Delete this mail?" },
  from_label: { de: "Von", en: "From" },
  to_label: { de: "An", en: "To" },
  received_label: { de: "Empfangen", en: "Received" },
  no_subject: { de: "(kein Betreff)", en: "(no subject)" },
  unknown_sender: { de: "(unbekannt)", en: "(unknown)" },
  no_text_part: { de: "(kein Textteil)", en: "(no text part)" },
  load_external_full: {
    de: "Externe Bilder/Stylesheets laden",
    en: "Load external images/styles",
  },
  block_external_full: { de: "Externe Inhalte blockieren", en: "Block external content" },
  load_external_short: { de: "Externe laden", en: "Load external" },
  block_external_short: { de: "Externe blockieren", en: "Block external" },
  no_messages_yet: { de: "Noch keine Mails", en: "No mails yet" },
  address_label: { de: "Adresse:", en: "Address:" },
  empty_pre_address: {
    de: "Bereit — keine Mails. Adresse kopieren und irgendwo eintragen:",
    en: "Ready — no mails. Copy the address and use it anywhere:",
  },
  click_to_copy: { de: "Klicken zum Kopieren", en: "Click to copy" },
  copied_to_clipboard: { de: "In Zwischenablage kopiert", en: "Copied to clipboard" },
  copy_address_button: { de: "📋 Adresse kopieren", en: "📋 Copy address" },
  empty_subtext: {
    de: "Sobald eine Mail an diese Adresse geht, taucht sie hier auf. Die Liste aktualisiert sich automatisch alle 5 Sekunden.",
    en: "As soon as a mail is sent to this address it'll show up here. The list refreshes automatically every 5 seconds.",
  },
  press_to_open: { de: "drücken", en: "to open" },
  middle_pick_prefix: { de: "links auswählen oder", en: "pick on the left or press" },
  shortcuts_title: { de: "Tastenkürzel", en: "Keyboard shortcuts" },
  close: { de: "schließen", en: "close" },
  sc_next: { de: "Nächste Mail", en: "Next mail" },
  sc_prev: { de: "Vorherige Mail", en: "Previous mail" },
  sc_open: { de: "Mail öffnen", en: "Open mail" },
  sc_delete: { de: "Mail löschen", en: "Delete mail" },
  sc_refresh: { de: "Refresh", en: "Refresh" },
  sc_copy: { de: "Adresse kopieren", en: "Copy address" },
  sc_new: { de: "Neue Random-Inbox", en: "New random inbox" },
  sc_clear: { de: "Postfach leeren", en: "Empty inbox" },
  sc_help: { de: "Diese Hilfe ein-/ausblenden", en: "Toggle this help" },
  ob_welcome: { de: "Willkommen bei Tempus", en: "Welcome to Tempus" },
  ob_tagline: {
    de: "Wegwerf-Mail für Tests, Signups und KI-Agents.",
    en: "Disposable mail for tests, signups and AI agents.",
  },
  ob_address_label: { de: "Deine Adresse", en: "Your address" },
  ob_copy: { de: "Kopieren", en: "Copy" },
  ob_incoming: { de: "Eingehende Mails", en: "Incoming mails" },
  ob_incoming_text: {
    de: " tauchen automatisch auf — alle 5 Sekunden neuer Refresh. Adresse wechseln über das Feld oben.",
    en: " show up automatically — refreshed every 5 seconds. Switch addresses via the field above.",
  },
  ob_cleanup: { de: "Auto-Cleanup:", en: "Auto-cleanup:" },
  ob_cleanup_text: {
    de: " Mails ≥7 Tage und Inboxen ≥30 Tage inaktiv werden gelöscht. Nutze die History (🕘) um zu früheren Adressen zurückzuspringen.",
    en: " Mails older than 7 days and inboxes idle for 30+ days are deleted. Use the history popover (🕘) to jump back to a previous address.",
  },
  ob_shortcuts_label: { de: "Tastenkürzel:", en: "Shortcuts:" },
  ob_shortcuts_navigate: { de: " navigieren, ", en: " navigate, " },
  ob_shortcuts_copy: { de: " kopiert, ", en: " copies, " },
  ob_shortcuts_showall: { de: " zeigt alle.", en: " shows all." },
  ob_again_via_info: {
    de: "Jederzeit wieder via ⓘ in der Topbar.",
    en: "Reopen anytime via ⓘ in the topbar.",
  },
  ob_go: { de: "Los geht's", en: "Let's go" },
  lang_label: { de: "Sprache", en: "Language" },
  lang_auto: { de: "Browser-Sprache", en: "Browser language" },
  lang_de: { de: "Deutsch", en: "German" },
  lang_en: { de: "English", en: "English" },
} as const;

export type StrKey = keyof typeof STR;

export function resolveLang(pref: LangPref): Lang {
  if (pref === "de" || pref === "en") return pref;
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("de")) {
    return "de";
  }
  return "en";
}

export function t(key: StrKey, lang: Lang): string {
  return (STR as any)[key][lang];
}

// Plural helpers — separate so call sites stay readable.
export function tMails(n: number, lang: Lang): string {
  if (lang === "de") return `${n} ${n === 1 ? "Mail" : "Mails"}`;
  return `${n} ${n === 1 ? "mail" : "mails"}`;
}

export function tAge(ms: number, lang: Lang): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return t("age_now", lang);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function tConfirmDelete(_lang: Lang): string {
  return t("confirm_delete", _lang);
}

export function tConfirmClear(n: number, address: string, lang: Lang): string {
  return lang === "de"
    ? `Alle ${n} Mails in ${address} löschen?`
    : `Delete all ${n} mails in ${address}?`;
}
