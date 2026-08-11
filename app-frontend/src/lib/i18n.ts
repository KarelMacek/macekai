import { useLang } from "@/contexts/LangContext";

// Static UI copy only — test/question content is admin-authored and resolved
// server-side per assessments/i18n.py. A hand-rolled dictionary rather than
// react-i18next: two fixed locales, no runtime-loaded translation files,
// nothing this small needs namespace/Suspense machinery for.
const translations = {
  en: {
    signIn: "Sign in with Google",
    devLogin: "Dev login (local only)",
    signOut: "Log out",
    signedOut: "Signed out.",
    loading: "Loading…",
    appTitle: "macekai",
    journeyTitle: "Your journey",
    stepCompleted: "Completed",
    stepCurrent: "Current",
    stepUpcoming: "Upcoming",
    startTest: "Start",
    reviewTest: "Review",
    continueButton: "Continue",
    backButton: "Back",
    submitButton: "Submit",
    addComment: "Add a comment",
    calculating: "Putting it together…",
    questionProgress: "Question {current} of {total}",
    resultTitle: "Your results",
    requestFeedbackTitle: "Request feedback",
    requestFeedbackIntro:
      "Upload your CV and/or share your LinkedIn profile URL so we can review your journey and get back to you.",
    cvLabel: "CV (PDF)",
    linkedinLabel: "LinkedIn profile URL",
    feedbackRequestSubmitted: "Thanks — your request has been submitted. We'll be in touch once your feedback is ready.",
    feedbackPendingTitle: "Feedback is on its way",
    feedbackPendingBody: "We've received your request and are reviewing your journey. Check back soon.",
    feedbackReadyTitle: "Your feedback is ready",
    downloadDocument: "Download feedback document",
    watchVideo: "Watch feedback video",
    allDone: "You've completed every step of your journey.",
    submitError: "Something went wrong. Please try again.",
    required: "This field is required.",
    provideOneOf: "Provide a CV and/or a LinkedIn URL.",
    noDiagnosticsTitle: "No access yet",
    noDiagnosticsBody: "Your email address isn't connected to any purchased diagnostics yet.",
    buyHere: "Buy here",
    contactToPurchase: "Contact Karel to purchase a diagnostics.",
    pastDiagnosticsTitle: "Past diagnostics",
    diagnosticsStatusTestsInProgress: "In progress",
    diagnosticsStatusAwaitingFeedbackRequest: "Awaiting your feedback request",
    diagnosticsStatusAwaitingAdminReview: "Awaiting review",
    diagnosticsStatusCompleted: "Completed",
    viewDiagnostics: "View",
  },
  cs: {
    signIn: "Přihlásit se přes Google",
    devLogin: "Dev přihlášení (jen lokálně)",
    signOut: "Odhlásit se",
    signedOut: "Odhlášeno.",
    loading: "Načítání…",
    appTitle: "macekai",
    journeyTitle: "Tvá cesta",
    stepCompleted: "Dokončeno",
    stepCurrent: "Aktuální",
    stepUpcoming: "Připravuje se",
    startTest: "Začít",
    reviewTest: "Zobrazit",
    continueButton: "Pokračovat",
    backButton: "Zpět",
    submitButton: "Odeslat",
    addComment: "Přidat komentář",
    calculating: "Dávám to dohromady…",
    questionProgress: "Otázka {current} z {total}",
    resultTitle: "Tvé výsledky",
    requestFeedbackTitle: "Požádat o zpětnou vazbu",
    requestFeedbackIntro:
      "Nahraj svůj životopis a/nebo přidej odkaz na LinkedIn profil, abychom mohli projít tvou cestu a ozvat se ti.",
    cvLabel: "Životopis (PDF)",
    linkedinLabel: "Odkaz na LinkedIn profil",
    feedbackRequestSubmitted: "Díky — tvá žádost byla odeslána. Ozveme se, jakmile bude zpětná vazba připravená.",
    feedbackPendingTitle: "Zpětná vazba je na cestě",
    feedbackPendingBody: "Tvou žádost jsme přijali a procházíme tvou cestu. Zkontroluj to brzy znovu.",
    feedbackReadyTitle: "Tvá zpětná vazba je připravená",
    downloadDocument: "Stáhnout dokument se zpětnou vazbou",
    watchVideo: "Zhlédnout video se zpětnou vazbou",
    allDone: "Dokončil/a jsi všechny kroky své cesty.",
    submitError: "Něco se pokazilo. Zkus to prosím znovu.",
    required: "Toto pole je povinné.",
    provideOneOf: "Doplň životopis a/nebo odkaz na LinkedIn.",
    noDiagnosticsTitle: "Zatím žádný přístup",
    noDiagnosticsBody: "Tvá e-mailová adresa zatím není spojená se žádnou zakoupenou diagnostikou.",
    buyHere: "Koupit zde",
    contactToPurchase: "Pro zakoupení diagnostiky kontaktuj Karla.",
    pastDiagnosticsTitle: "Minulé diagnostiky",
    diagnosticsStatusTestsInProgress: "Probíhá",
    diagnosticsStatusAwaitingFeedbackRequest: "Čeká na tvou žádost o zpětnou vazbu",
    diagnosticsStatusAwaitingAdminReview: "Čeká na zpracování",
    diagnosticsStatusCompleted: "Dokončeno",
    viewDiagnostics: "Zobrazit",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function useTranslation() {
  const { lang } = useLang();

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let text: string = translations[lang][key] ?? translations.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  }

  return { t, lang };
}
