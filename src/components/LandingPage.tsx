/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shield,
  ShieldCheck, 
  Zap, 
  HardDrive, 
  WifiOff, 
  FileText, 
  FolderSync, 
  ArrowRight, 
  Lock, 
  Globe2, 
  EyeOff, 
  Layout, 
  Keyboard,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Youtube,
  Presentation,
  ClipboardList,
  Image,
  StickyNote,
  Mail,
  ListTodo,
  Kanban,
  File,
  FileCode,
  Video,
  Folder,
  X,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface LandingPageProps {
  onConnectDrive: (method: 'popup' | 'redirect') => void;
  onNavigate: (path: string) => void;
}

export default function LandingPage({ onConnectDrive, onNavigate }: LandingPageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isImpressumOpen, setIsImpressumOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Mouse interactivity for the background dot grid spotlight effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsHovered(true);
  };

  // Localized FAQ Source Data
  const faqData = language === 'de' ? [
    {
      q: 'Was für ein Problem löst DriveDeck, das ich nicht auch mit hunderten anderen Notizen-Apps lösen könnte? Warum sollte ich mich für DriveDeck entscheiden?',
      a: 'Die allermeisten Notizen-Dienste (wie Notion, Evernote oder Obsidian-Sync) binden dich an ihre eigenen, proprietären Server. Deine sensiblen Gedanken und Firmendaten liegen unverschlüsselt in deren Cloud-Datenbanken und werden oft für Werbekampagnen oder KI-Modelle gescannt. DriveDeck löst das Problem des "Vendor Lock-in" und der Datenspionage: Du bekommst ein wunderschönes, schnelles Productivity-Dashboard mit Notizen, Haftnotizen und Aufgaben-Planer, bei dem alle Daten zu 100% in deinem Besitz bleiben – gespeichert in deinem eigenen Google-Drive-Speicher und im lokalen Browser. Keine Drittserver, kein Datenverkauf, volle Kontrolle und perfekter Datenschutz, ohne auf Echtzeit-Synchronisation verzichten zu müssen.'
    },
    {
      q: 'Moment mal: Ihr predigt Unabhängigkeit von Großkonzernen und absolute Privatsphäre, nutzt aber Google Drive als Speicher?! Ist das nicht ein Riesen-Widerspruch?',
      a: 'Das klingt im ersten Moment tatsächlich wie ein Paradoxon – ist aber in Wahrheit der genialste Schachzug überhaupt! Bei herkömmlichen Apps liegen deine vertraulichen Daten auf den Datenbank-Servern eines kleinen Drittanbieters. Wenn dieser gehackt wird, pleitegeht oder von einem Investor geschluckt wird, bist du machtlos. DriveDeck betreibt absichtlich GAR KEINE Server für deine Inhalte. Deine schützenswerten Gedanken fließen direkt von deinem Browser verschlüsselt in dein Google Drive. Du nutzt Googles exzellente, billionenschwere Sicherheits-Infrastruktur als "dummen Cloud-Speicher", weigerst dich aber gleichzeitig, deine Daten an ein weiteres, neugieriges Drittanbieter-Backend auszuhändigen. Bricht DriveDeck morgen weg, sind deine Daten unberührt und sicher in deiner Hand. Das ist das "Bring Your Own Storage"-Prinzip: Ultimative Souveränität!'
    },
    {
      q: 'Ist DriveDeck irgendwie mit Google verbandelt?',
      a: 'Nein, absolut nicht! DriveDeck ist ein vollkommen eigenständiges, unabhängiges Softwareprojekt und steht in keinerlei geschäftlicher oder rechtlicher Verbindung zu Google LLC. Wir nutzen lediglich die offiziell bereitgestellten, offenen Programmierschnittstellen (Google APIs), um dir eine hochgradig optimierte und komfortable Benutzeroberfläche direkt auf deinem persönlichen Google Drive aufzubauen.'
    },
    {
      q: 'Entspricht DriveDeck der DSGVO (Datenschutz-Grundverordnung)?',
      a: 'Ja, zu 100% und im allerstrengsten Sinne (Privacy by Design)! Da wir keine eigenen Datenbankserver betreiben, auf denen deine vertraulichen Notizen, Alben oder Aufgaben gespeichert werden, können wir deine Daten gar nicht erst zweckentfremden, analysieren oder an Dritte weitergeben. Deine Daten befinden sich ausschließlich in der lokalen Sandbox deines Browsers (IndexedDB) und verschlüsselt in deinem eigenen Google Drive. Besser lässt sich Datenschutz nicht realisieren.'
    },
    {
      q: 'Wie komme ich an meine Daten im versteckten Google Drive Ordner und wie exportiere ich sie?',
      a: 'Du behältst immer die volle Souveränität (kein Vendor Lock-in): 1) Lokaler Gratis-Export: Du kannst dich jederzeit in der DriveDeck-Benutzeroberfläche anmelden und im Einstellungsbereich unter "Daten-Backup & Portabilität" mit einem Klick ein vollständiges Backup all deiner Alben, Seiten, Haftnotizen und Aufgabenlisten als standardisierte, menschenlesbare JSON-Datei herunterladen. Diese Daten kannst du frei sichern oder konvertieren. 2) Über Google Drive: Da die Daten direkt in deinem Google Account (im sicheren AppData-Ordner) gespeichert sind, kannst du sie auch jederzeit über Google Takeout exportieren. Niemand sperrt deine Daten weg!'
    },
    {
      q: 'Ist DriveDeck wirklich komplett kostenlos oder gibt es versteckte Kosten?',
      a: 'DriveDeck ist zu 100% kostenlos und werbefrei! Es gibt keine Abonnements, keine zeitlichen Testphasen-Beschränkungen und keine Bezahlschranken. Da die App serverlos arbeitet und deine Notizen direkt in deinem eigenen Google Drive und lokal im Browser speichert, entstehen für uns keine teuren Serverkosten.'
    },
    {
      q: 'Warum ist DriveDeck kostenlos und wie funktioniert das Projekt?',
      a: 'DriveDeck wurde aus der Überzeugung geschaffen, dass persönliche Gedanken, Notizen und Projektunterlagen privat bleiben müssen. Da DriveDeck nach dem "Bring Your Own Storage"-Prinzip arbeitet, fallen keine teuren Cloud-Speicherserver für uns an – du nutzt deinen bereits vorhandenen Google Drive Speicher. DriveDeck ist unabhängig, werbefrei und garantiert frei von Tracking oder Datenverkauf.'
    },
    {
      q: 'Wie sieht es mit der Weiterentwicklung von DriveDeck aus? Kann ich mir neue Funktionen wünschen?',
      a: 'Ja, absolut und sehr gerne! DriveDeck lebt von dem Feedback und den Bedürfnissen seiner Nutzerinnen und Nutzer. Wenn du eine Funktion vermisst, einen Verbesserungsvorschlag hast oder Unterstützung für eine neue Integration brauchst, schreibe einfach eine persönliche E-Mail an hj.wuethrich@gmail.com. Jedes Feedback fließt direkt in die Planung der nächsten Updates ein!'
    },
    {
      q: 'Werden meine Passwörter oder Google-Anmeldedaten auf DriveDeck-Servern gespeichert?',
      a: 'Niemals! Die Anmeldung geschieht über das offizielle, hochsichere Google OAuth 2.0-Verfahren. Du gibst deine Zugangsdaten direkt auf der gesicherten Anmeldeseite von Google ein. DriveDeck erhält lediglich einen verschlüsselten Einmal-Sicherheitstoken für den Zugriff auf den geschützten App-Speicherbereich. Wir haben zu keinem Zeitpunkt Zugriff auf dein Google-Passwort oder deine sonstigen privaten Drive-Inhalte außerhalb von DriveDeck.'
    },
    {
      q: 'Gibt es eine Begrenzung, wie viele Seiten oder Bilder ich in DriveDeck anlegen kann?',
      a: 'Nein, es gibt keinerlei künstliche Begrenzung seitens DriveDeck. Du kannst so viele Seiten, Notizen und Projektalben erstellen, wie du möchtest. Der einzige limitierende Faktor ist der Speicherplatz deines eigenen Google Drive Kontos (standardmäßig gibt es bei Google 15 GB kostenlos) und der freie Speicher auf deiner lokalen Festplatte.'
    },
    {
      q: 'Warum werden geteilte Dokumente als Kopie in den sichtbaren "DriveDeck"-Ordner gelegt, statt das Original direkt freizugeben?',
      a: 'Das ist ein bewusstes High-End Sicherheits-Feature zum Schutz deiner Privatsphäre! Standardmäßig sind all deine persönlichen Dateien auf Google Drive komplett privat. Wenn du ein Album oder ein Dokument für andere zum Abonnieren (Abo-Kanal) freigeben möchtest, müsste DriveDeck die Rechte deiner Originaldatei ändern. Um jegliches Risiko zu vermeiden (wie versehentliches Überschreiben, Spionage oder ungewollte Freigaben deines gesamten GDrive-Speichers), generiert DriveDeck ein exklusives Abbild der freigegebenen Seiten in deinem sichtbaren "DriveDeck"-Ordner. Nur diese dedizierte Lese-Kopie wird geteilt. Dein Originaldokument bleibt zu 100% geschützt, unsichtbar und unter deinem alleinigen Besitz unantastbar auf deinem Drive!'
    }
  ] : [
    {
      q: 'What problem does DriveDeck solve compared to hundreds of other notes apps? Why should I choose DriveDeck?',
      a: 'The vast majority of notes services (like Notion, Evernote, or Obsidian-Sync) tie you to their own proprietary servers. Your sensitive thoughts and company data are stored unencrypted in their cloud databases and are often scanned for ad campaigns or AI models. DriveDeck solves vendor lock-in and corporate tracking: you get a beautiful, fast productivity dashboard with notes, sticky notes, and a task planner where all data remains 100% in your hands – saved in your own Google Drive and browser storage. No third-party servers, no data selling, full control, and perfect data protection, without sacrificing real-time synchronization.'
    },
    {
      q: 'Wait a minute: you preach independence from big corporations and absolute privacy, but use Google Drive as storage?! Isn\'t that a huge contradiction?',
      a: 'It sounds like a paradox at first – but is actually the most genius move of all! With traditional apps, your confidential data lies on the database servers of a small third-party provider. If it gets hacked, goes bankrupt, or gets swallowed by an investor, you are powerless. DriveDeck deliberately operates NO servers for your content. Your sensitive thoughts flow encrypted directly from your browser to your Google Drive. You use Google\'s excellent, multi-billion-dollar security infrastructure as "dumb cloud storage," while simultaneously refusing to hand over your data to yet another curious third-party backend. If DriveDeck disappears tomorrow, your data is untouched and safely in your hand. That is the "Bring Your Own Storage" principle: Ultimate sovereignty!'
    },
    {
      q: 'Is DriveDeck somehow affiliated with Google?',
      a: 'No, absolutely not! DriveDeck is a completely independent software project and has no commercial or legal connection to Google LLC. We merely use the officially provided, open application programming interfaces (Google APIs) to build a highly optimized and comfortable user interface directly on your personal Google Drive.'
    },
    {
      q: 'Is DriveDeck GDPR compliant?',
      a: 'Yes, 100% and in the strictest sense (Privacy by Design)! Because we do not run our own database servers on which your confidential notes, albums, or tasks are saved, we cannot misuse, analyze, or pass on your data to third parties. Your data is stored solely in your local browser sandbox (IndexedDB) and encrypted inside your personal Google Drive. Data protection cannot be implemented any better.'
    },
    {
      q: 'How do I access and export my data from Google Drive?',
      a: 'You always retain full sovereignty (no vendor lock-in): 1) Free local export: You can log into the DriveDeck interface at any time and in the settings area under "Backup & Portability" download a complete backup of all your albums, pages, stickies, and tasks as a standard, human-readable JSON file. You can freely convert or save this data. 2) Via Google Drive: Since the data is stored directly in your Google account (in the secure AppData folder), you can also export it at any time via Google Takeout. Nobody locks your data away!'
    },
    {
      q: 'Is DriveDeck really completely free or are there hidden fees?',
      a: 'DriveDeck is 100% free and ad-free! There are no subscriptions, no trial expirations, and no paywalls. Because the app works serverlessly and stores your notes directly inside your own Google Drive and local browser, no expensive backend server costs are incurred.'
    },
    {
      q: 'Why is DriveDeck free and how does the project operate?',
      a: 'DriveDeck was built on the conviction that personal thoughts and private notes belong solely to you. Because DriveDeck operates on the "Bring Your Own Storage" principle, we do not need expensive cloud databases – you use your own existing Google Drive storage. DriveDeck is independent, ad-free, and guaranteed free of tracking or data monetization.'
    },
    {
      q: 'What about the further development of DriveDeck? Can I request new features?',
      a: 'Yes, absolutely and with pleasure! DriveDeck thrives on the feedback and needs of its users. If you miss a feature, have a suggestion for improvement, or need support for a new integration, just write a personal email to hj.wuethrich@gmail.com. All feedback goes directly into planning future updates!'
    },
    {
      q: 'Are my passwords or Google credentials stored on DriveDeck servers?',
      a: 'Never! Sign-in is handled via Google OAuth 2.0. You enter your credentials directly on Google\'s secure login page. DriveDeck only receives an encrypted security token of limited duration. We never have access to your Google password or any other private contents outside of DriveDeck\'s scope.'
    },
    {
      q: 'Is there a limit to how many pages or images I can create in DriveDeck?',
      a: 'No, there are no artificial boundaries imposed by DriveDeck. You can create as many pages, notes, and project folders as you like. The only limiting factor is your Google Drive quota (Google offers 15 GB for free) and the disk storage of your computer\'s local drive.'
    },
    {
      q: 'Why are shared documents copied into the visible "DriveDeck" folder instead of sharing the original directly?',
      a: 'This is a deliberate safety feature! By default, all your files on Google Drive are strictly private. To let others subscribe to your folder (subscription channel), DriveDeck would have to change permissions on your original file. To completely avoid any risks (such as accidental overwrites, eavesdropping, or unintentional sharing), DriveDeck generates an isolated copy inside your visible "DriveDeck" folder. Only this copy is shared. Your original file remains protected and invisible!'
    }
  ];

  return (
    <div id="landing-page-wrapper" className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 font-sans select-none relative">
      {/* Flag-Selector Floating */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-40">
        <button
          onClick={() => setThemeLanguage('de')}
          className={`p-1.5 rounded-lg text-lg border cursor-pointer hover:scale-105 transition-all ${
            language === 'de' 
              ? 'bg-white shadow-2xs border-slate-200 scale-105 filter-none' 
              : 'bg-slate-50/50 border-transparent opacity-60 hover:opacity-100 filter grayscale'
          }`}
          title="Deutsch"
        >
          🇩🇪
        </button>
        <button
          onClick={() => setThemeLanguage('en')}
          className={`p-1.5 rounded-lg text-lg border cursor-pointer hover:scale-105 transition-all ${
            language === 'en' 
              ? 'bg-white shadow-2xs border-slate-200 scale-105 filter-none' 
              : 'bg-slate-50/50 border-transparent opacity-60 hover:opacity-100 filter grayscale'
          }`}
          title="English"
        >
          🇬🇧
        </button>
      </div>

      {/* Hero Header Area with Grey Dot Grid Concept */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden bg-slate-100 py-12 sm:py-20 px-6 sm:px-12 text-center border-b border-slate-200 group/hero"
      >
        {/* Base Layer: Grey background with radial fading black dot grid */}
        <div 
          className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(#000000_2px,transparent_2px)] [background-size:24px_24px] pointer-events-none transition-opacity duration-300"
          style={{ 
            maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)', 
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)' 
          }}
        />

        {/* Dynamic Spotlight Layer */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 bg-[radial-gradient(#000000_3.5px,transparent_3.5px)] [background-size:24px_24px]"
          style={{ 
            opacity: isHovered ? 0.48 : 0,
            maskImage: `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)`, 
            WebkitMaskImage: `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)` 
          }}
        />

        <div className="max-w-3xl mx-auto relative z-10 bg-white/75 backdrop-blur-xl border border-white/50 rounded-2xl p-6 sm:p-10 shadow-xl overflow-hidden pt-8 sm:pt-12">
          {/* Google Color Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex rounded-t-2xl overflow-hidden">
            <div className="flex-1 bg-[#4285F4]"></div>
            <div className="flex-1 bg-[#EA4335]"></div>
            <div className="flex-1 bg-[#FBBC05]"></div>
            <div className="flex-1 bg-[#34A853]"></div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold tracking-wide mb-5 select-none animate-in fade-in slide-in-from-top-3">
            <div className="flex gap-1 items-center mr-1">
              <span className="w-2 h-2 rounded-full bg-[#4285F4] animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-[#EA4335]"></span>
              <span className="w-2 h-2 rounded-full bg-[#FBBC05]"></span>
              <span className="w-2 h-2 rounded-full bg-[#34A853]"></span>
            </div>
            <span className="text-slate-600">{t('landing.top_badge')}</span>
          </div>

          <h1 id="landing-hero-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-sans mt-2 mb-4 leading-tight">
            {language === 'de' ? 'Willkommen bei ' : 'Welcome to '}<span className="text-[#4285F4]">DriveDeck</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            {t('landing.hero_subtitle')}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 mt-6">
            <button
              onClick={() => onConnectDrive('popup')}
              className="w-full sm:w-auto px-8 py-3 bg-[#4285F4] hover:bg-[#357ae8] text-white font-black rounded-lg shadow-md ring-offset-2 ring-offset-white focus:outline-none focus:ring-2 focus:ring-[#4285F4] transition-all cursor-pointer flex items-center justify-center gap-3 text-sm"
              id="google-signin-hero-btn"
            >
              <span>{t('landing.btn_login')}</span>
              <ArrowRight className="w-4.5 h-4.5 text-white" />
            </button>
            <button
              onClick={() => onConnectDrive('redirect')}
              className="text-xs text-slate-500 hover:text-[#4285F4] transition-colors flex items-center gap-1 underline font-semibold cursor-pointer"
              id="google-signin-redirect-link"
            >
              <span>{t('landing.btn_redirect')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Feature Grid container */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Simple explanation card: "Was ist DriveDeck?" */}
        <div className="mb-16 bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100/80 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 border border-sky-200 rounded-full text-xs text-sky-800 font-bold mb-4 select-none">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>{language === 'de' ? 'DriveDeck auf den Punkt erklärt 💡' : 'DriveDeck in a nutshell 💡'}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              {t('landing.pitch_title')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl mb-8">
              {language === 'de' 
                ? 'Stell dir ein blockbasiertes Notizen-Programm vor, bei dem aber keine einzige Zeile deiner sensiblen Gedanken oder geschäftlichen Dokumente jemals auf fremden Servern landet. Das ist DriveDeck.'
                : 'Imagine a block-style editing environment where not a single line of your sensitive notes or legal reports ever touches third-party databases. That is DriveDeck.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-3xs flex flex-col items-start transition-all hover:shadow-xs hover:border-sky-200">
                <span className="text-4xl mb-3.5 select-none font-sans">💻</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">{t('landing.pillar1_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('landing.pillar1_desc')}
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-3xs flex flex-col items-start transition-all hover:shadow-xs hover:border-sky-200">
                <span className="text-4xl mb-3.5 select-none font-sans">🛡️</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">{t('landing.pillar2_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('landing.pillar2_desc')}
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-3xs flex flex-col items-start transition-all hover:shadow-xs hover:border-sky-200">
                <span className="text-4xl mb-3.5 select-none font-sans">☁️</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">{t('landing.pillar3_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('landing.pillar3_desc')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 leading-relaxed">
                📢 <strong>{language === 'de' ? 'Kurz gesagt: ' : 'In short: '}</strong> 
                {language === 'de' 
                  ? 'DriveDeck ist deine private Notizen-Zentrale, die Google Drive als sichere Festplatte nutzt, ohne dass Dritte deine Daten sehen können.'
                  : 'DriveDeck is your private notes dashboard that uses Google Drive as a secure cloud drive, keeping everyone else out.'}
              </div>
              <button
                onClick={() => onConnectDrive('popup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold rounded text-xs select-none shadow-xs cursor-pointer transition-all"
                id="google-signin-middle-btn"
              >
                <span>{language === 'de' ? 'Mit Google anmelden' : 'Sign in with Google'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <h2 id="core-advantages-heading" className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-8">
          {language === 'de' ? 'Die tragenden Säulen von DriveDeck 🎯' : 'Key Pillars of DriveDeck 🎯'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md shrink-0">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {language === 'de' ? '100% Client-Side Sicherheit (Kein Backend!)' : '100% Client-Side Privacy (Zero Servers)'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'de' 
                  ? 'Deine Daten gehören dir. Es gibt bei uns keinen Application-Server oder eine Cloud-Datenbank, die deine Inhalte liest oder speichert. Alles läuft vollständig in deinem Browser-Tab.'
                  : 'Your notes belong entirely to you. We maintain no application database or scraping servers that index or inspect your logs. Everything operates inside your own browser tab.'}
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-md shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {language === 'de' ? '"Bahn-Ready" (Komplett Offline-Fähig)' : '"Train-Ready" (Fully Offline Compatible)'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'de'
                  ? 'Egal ob im Funkloch, im ICE durch Tunnel oder im Flieger: Da deine gesamte Datenstruktur in der browserintegrierten IndexedDB gesichert ist, arbeitest du flüssig ohne Internet.'
                  : 'Offline-first by design. Whether you are in a tunnel, remote area, or in flight mode: because your workspace state lives in IndexedDB, you enjoy lightning-fast access with zero delays.'}
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-md shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {language === 'de' ? '"Bring Your Own Cloud" mit Google Drive' : '"Bring Your Own Cloud" via Google Drive'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'de'
                  ? 'Wenn du die Synchronisierung aktivierst, speichert DriveDeck verschlüsselt in dem verborgenen appdata-Sicherheitsordner deines privaten Google Drives. Nur du hast Zugriff.'
                  : 'When you link Google Drive, your files are synchronized using standard APIs directly to a private, sandboxed appdata folder inside your own cloud. No third party inspects it.'}
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-md shrink-0">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {language === 'de' ? 'Sichere Multimedia- & Dateieinbettung' : 'Safe Multimedia & Files Embedding'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'de'
                  ? 'Bette Google Docs, Sheets, YouTube, Bilder oder Drive-Kalender per ID ein. Der Browser rendert die Previews verschlüsselt in lokalen iFrames direkt über offizielle Google-Server.'
                  : 'Embed Docs, spreadsheets, charts, YouTube videos, or calendars cleanly. Previews are generated directly via official sandboxed Google iFrames so your sensitive docs stay protected.'}
              </p>
            </div>
          </div>
        </div>

        {/* Security / Privacy details with checklist */}
        <div className="mt-12 bg-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-emerald-500/25 relative overflow-hidden shadow-md text-left">
          <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-10 text-emerald-600/15 pointer-events-none hidden md:block select-none">
            <Shield className="w-52 h-52 stroke-[1]" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-emerald-950 mb-3 flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-700 rounded-lg shrink-0 border border-emerald-500/20 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-emerald-900 font-extrabold tracking-tight">{t('landing.sec_security_title')}</span>
            </h3>
            
            {/* Premium GDPR & Privacy Badges */}
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 mb-4 select-none overflow-x-auto no-scrollbar">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                {t('landing.top_badge')}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                {t('landing.sec_security_pill_bydesign')}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                {t('landing.sec_security_pill_eu')}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                {t('landing.sec_security_pill_zero')}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-emerald-800/90 leading-relaxed mb-5 font-medium">
              {t('landing.sec_security_subtitle')}
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-left">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed" dangerouslySetInnerHTML={{__html: t('landing.sec_security_bullet1')}}></span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed" dangerouslySetInnerHTML={{__html: t('landing.sec_security_bullet2')}}></span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed" dangerouslySetInnerHTML={{__html: t('landing.sec_security_bullet3')}}></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dynamic Interactive Preview Showcase */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {language === 'de' ? 'Unterstützte Integrationen & Ökosystem' : 'Supported Elements & Integrations'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xl mx-auto mb-6">
            {language === 'de' 
              ? 'Gestalten Sie Ihren Arbeitsplatz mit interaktiven Elementen, Kanban-Boards und Google-Diensten, die Sie mit der schnellen Slash-Steuerung (/) erstellen können:'
              : 'Design your personal dashboard with interactive items, Kanban boards, and Google services spawned quickly using the keyboard Slash command (/):'}
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full">
            {/* 1. Google Docs */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <FileText className="w-5 h-5 text-blue-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Docs</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Metadaten & Entwürfe' : 'Reports & drafts'}</span>
            </div>

            {/* 2. Google Sheets */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Sheets</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Kalkulationen' : 'Spreadsheets'}</span>
            </div>

            {/* 3. Google Slides */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <Presentation className="w-5 h-5 text-amber-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Slides</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Präsentationsfolien' : 'Presentations'}</span>
            </div>

            {/* 4. Google Forms */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <ClipboardList className="w-5 h-5 text-purple-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Forms</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Feedback-Bögen' : 'Forms & polls'}</span>
            </div>

            {/* 5. Google Calendar */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <Calendar className="w-5 h-5 text-violet-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Calendar</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Termine & Meetings' : 'Events & schedulers'}</span>
            </div>

            {/* 6. Gmail */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <Mail className="w-5 h-5 text-rose-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Gmail</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Briefkasten' : 'Inbox mailers'}</span>
            </div>

            {/* 7. Kanban Board (Promoted & Highlighted) */}
            <div className="bg-gradient-to-b from-sky-50/70 to-white border border-sky-300/80 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-xs transition-all relative">
              <span className="absolute top-1.5 right-1.5 px-1 py-0.2 bg-sky-500 text-white text-[8px] font-extrabold rounded uppercase tracking-wider leading-none">
                {language === 'de' ? 'Neu' : 'New'}
              </span>
              <Kanban className="w-5 h-5 text-sky-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Kanban Board</span>
              <span className="text-[10px] text-sky-700/80 font-medium mt-0.5">{language === 'de' ? 'Projekt- & Statusboards' : 'Agile & project boards'}</span>
            </div>

            {/* 8. DriveTasks */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <ListTodo className="w-5 h-5 text-teal-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">DriveTasks</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Aufgaben-Listen' : 'To-Do & plan list'}</span>
            </div>

            {/* 9. Google Keep */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <StickyNote className="w-5 h-5 text-yellow-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Keep</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Haftnotizen' : 'Memos & ideas'}</span>
            </div>

            {/* 10. Google Photos */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <Image className="w-5 h-5 text-pink-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Photos</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Bilder & Alben' : 'Images & assets'}</span>
            </div>

            {/* 11. YouTube Embeds */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <Youtube className="w-5 h-5 text-red-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">YouTube Embeds</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Videos & Tutorials' : 'Videos & tutorials'}</span>
            </div>

            {/* 12. Code & Skripte */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all">
              <FileCode className="w-5 h-5 text-indigo-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">{language === 'de' ? 'Code & Skripte' : 'Code & Scripts'}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{language === 'de' ? 'Syntax-Highlighter' : 'Syntax highlighted'}</span>
            </div>
          </div>
        </div>

        {/* 100% Free & Unlimited Workspace Showcase */}
        <div className="mt-16 text-left w-full relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-semibold mb-4 select-none">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'de' ? '100% Kostenlos & Werbefrei: Für immer frei nutzbar' : '100% Free & Ad-Free: Forever Free'}</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mb-3">
              {language === 'de' ? 'Komplett kostenlos für alle' : 'Completely Free for Everyone'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mb-8">
              {language === 'de' 
                ? 'Keine Abonnements, keine versteckten Kosten und keine Testphasen-Schranken. DriveDeck nutzt deinen eigenen Google Drive-Speicher, weshalb keine teuren Serverkosten anfallen. Alle Produktivitäts-Funktionen stehen dir dauerhaft und uneingeschränkt zur Verfügung:'
                : 'No subscriptions, no hidden fees, and no trial paywalls. DriveDeck runs directly on your personal Google Drive storage, eliminating expensive server overhead. All workspace features are permanently unlocked:'}
            </p>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Feature 1: Sovereignty */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 hover:shadow-2xs transition-all">
                <div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg inline-block mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1.5">
                    {language === 'de' ? 'Volle Datenhoheit' : 'Full Data Sovereignty'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'de' 
                      ? 'Deine Notizen, Bilder und Aufgaben liegen sicher in deinem eigenen Google Drive und Browser-Speicher. Niemand sperrt deine Daten weg.'
                      : 'Your notes, images, and tasks stay securely in your own Google Drive and local browser. No vendor lock-in, ever.'}
                  </p>
                </div>
              </div>
 
              {/* Feature 2: All Features Unlocked */}
              <div className="bg-sky-50/30 p-5 rounded-xl border-2 border-sky-500/40 flex flex-col justify-between relative hover:shadow-2xs transition-all">
                <div>
                  <div className="p-2 bg-sky-100 text-sky-700 rounded-lg inline-block mb-3">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5">
                    {language === 'de' ? 'Alle Features freigeschaltet' : 'All Features Included'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'de' 
                      ? 'Unbegrenzte Seiten, Notizen, Audio-Aufnahmen, Drag & Drop-Dateien und Google Tasks-Synchronisation – komplett ohne Einschränkungen.'
                      : 'Unlimited pages, notes, audio dictations, drag & drop files, and Google Tasks sync – completely unrestricted.'}
                  </p>
                </div>
              </div>
 
              {/* Feature 3: BYOS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 hover:shadow-2xs transition-all">
                <div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg inline-block mb-3">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1.5">
                    {language === 'de' ? 'Bring Your Own Storage' : 'Bring Your Own Storage'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'de' 
                      ? 'Weil du deinen bestehenden Google-Speicherplatz nutzt, gibt es keine künstlichen Limits und keinen Grund für ein kostspieliges Abonnement.'
                      : 'Because you use your own Google Drive space, there are no artificial limits and zero need for recurring subscriptions.'}
                  </p>
                </div>
              </div>
            </div>
 
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-lg text-left">
                ✨ <strong className="text-emerald-800 font-bold">{language === 'de' ? '100% Kostenlos & Werbefrei:' : '100% Free & Open Spirit:'}</strong> 
                {language === 'de' 
                  ? ' DriveDeck ist und bleibt ein unabhängiges, kostenloses Werkzeug für deine Notizen und Aufgaben ohne Tracking oder Bezahlschranken.'
                  : ' DriveDeck remains an independent, free privacy workspace for your notes and tasks with no paywalls or ads.'}
              </p>
              <p className="text-[11px] text-slate-400 text-left sm:text-right sm:max-w-[240px] shrink-0 leading-normal">
                {language === 'de' 
                  ? 'Einfach mit Google anmelden und direkt loslegen – ganz ohne Registrierungsformulare.'
                  : 'Simply sign in with Google and start immediately – no payment forms.'}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ - Frequently Asked Questions Section */}
        <div className="mt-20 border-t border-slate-200 pt-12 text-left w-full max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6.5 h-6.5 text-[#4285F4] shrink-0" />
              <span>{t('landing.sec_faq_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'de' ? 'Alles über Datensicherheit, Privatsphäre und die Funktionsweise von DriveDeck.' : 'Clear statements handling storage security, privacy, and mechanics.'}
            </p>
          </div>

          <div className="space-y-3.5">
            {faqData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200/90 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-3xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none focus:bg-slate-50/40 select-none group"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-slate-900 leading-snug">
                      {faq.q}
                    </span>
                    <span className="p-1 rounded-md bg-slate-50 text-slate-450 group-hover:bg-slate-100 transition-colors shrink-0 mt-0.5">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 border-t border-slate-50 text-xs leading-relaxed selection:bg-sky-100 select-text font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center border-t border-slate-200 pt-10 w-full font-sans">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-full text-[10px] text-sky-700 font-bold tracking-wide mb-6">
            <Globe2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Offizielle Projekt-Domain:</span>
            <a href="https://drivedeck.xyz" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-900 font-mono">drivedeck.xyz</a>
            <span className="bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded-full text-[8px] uppercase">{t('common.active')}</span>
          </div>

          <p className="text-xs text-slate-500 italic mb-4">
            {language === 'de' ? 'Bereit für ein neues Level an digitaler Souveränität?' : 'Ready for complete digital workspace sovereignty?'}
          </p>
          <div className="flex justify-center mb-8">
            <button
              onClick={() => onConnectDrive('popup')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold rounded text-xs select-none shadow-xs cursor-pointer transition-all"
              id="google-signin-footer-btn"
            >
              <span>{language === 'de' ? 'Jetzt mit Google anmelden & loslegen' : 'Sign in with Google Drive to start'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-sans mt-2 border-t border-slate-100 pt-5 gap-3 flex-wrap">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left flex-wrap">
              <span>© {new Date().getFullYear()} DriveDeck. {language === 'de' ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}</span>
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <button 
                  onClick={() => setIsImpressumOpen(true)} 
                  className="hover:text-slate-600 underline cursor-pointer transition-colors"
                  id="footer-link-impressum"
                >
                  {t('landing.footer_impressum')}
                </button>
                <span className="text-slate-300">|</span>
                <a 
                  href="/datenschutz"
                  onClick={(e) => { e.preventDefault(); onNavigate('/datenschutz'); }}
                  className="hover:text-slate-600 underline cursor-pointer transition-colors"
                  id="footer-link-privacy"
                >
                  {t('landing.footer_privacy')}
                </a>
                <span className="text-slate-300">|</span>
                <a 
                  href="/nutzungsbedingungen"
                  onClick={(e) => { e.preventDefault(); onNavigate('/nutzungsbedingungen'); }}
                  className="hover:text-slate-600 underline cursor-pointer transition-colors"
                  id="footer-link-terms"
                >
                  {t('landing.footer_terms')}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 sm:mt-0 select-none">
              <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500">100% Serverless SPA</span>
              <span className="font-mono text-[10px] bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 text-emerald-600">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Impressum Modal */}
      {isImpressumOpen && (
        <div id="impressum-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in text-left">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{t('landing.footer_impressum')}</h3>
              <button 
                onClick={() => setIsImpressumOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                id="close-impressum-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-4 select-text selection:bg-sky-100 selection:text-sky-900 font-sans">
              <div>
                <p className="font-bold text-slate-700 mb-1">Angaben gemäß § 5 TMG / Swiss Law:</p>
                <p className="leading-relaxed font-semibold text-slate-805">
                  Hansjürg Wüthrich<br />
                  Obermülistrasse 21<br />
                  8320 Fehraltorf<br />
                  Schweiz
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">{language === 'de' ? 'Kontakt:' : 'Contact:'}</p>
                <p className="leading-relaxed">
                  E-Mail: <a href="mailto:hj.wuethrich@gmail.com" className="text-sky-600 hover:underline font-semibold">hj.wuethrich@gmail.com</a>
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">{language === 'de' ? 'Haftungsausschluss (Disclaimer):' : 'Disclaimer:'}</p>
                <p className="leading-relaxed text-slate-500">
                  {language === 'de' ? (
                    <>
                      <strong>Haftung für Inhalte:</strong> Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.<br /><br />
                      <strong>Haftung für Links:</strong> Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.<br /><br />
                      <strong>Betrieb, Einstellung und API-Änderungen:</strong> DriveDeck ist ein unabhängiges Software-Projekt. Wir behalten uns das Recht vor, den Dienst und dessen Funktionalitäten jederzeit ohne Angabe von Gründen temporär einzustellen, anzupassen oder dauerhaft aufzugeben.<br /><br />
                      <strong>100% Datenhoheit & Kein Lock-In:</strong> Da DriveDeck serverlos arbeitet, landen Ihre Notizen, Configs und Daten niemals bei uns. Alle Daten verbleiben ausschließlich in Ihrem direkten Besitz.
                    </>
                  ) : (
                    <>
                      <strong>Content Liability:</strong> Although generated with care, we don\'t assume legal warranty or liability regarding absolute precision or accessibility of web materials.<br /><br />
                      <strong>Link Directory Liability:</strong> We direct references to external endpoints but maintain no authorization or direct impact regarding their operations.<br /><br />
                      <strong>Lifespan Disclaimer:</strong> DriveDeck represents an autonomous, self-made software release. We retain full rights to alter capabilities, edit parameters, or suspend sync services if external Google API updates or operator health dictates.<br /><br />
                      <strong>100% Data Sovereignty:</strong> No logs, pages, folders, or assets are copied to any secondary database hosts. Your storage remains strictly in your own files.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsImpressumOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs cursor-pointer transition-colors"
                id="close-impressum-modal-btn"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function setThemeLanguage(lang: 'de' | 'en') {
    setLanguage(lang);
  }
}
