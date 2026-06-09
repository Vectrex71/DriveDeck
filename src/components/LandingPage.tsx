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
  File,
  FileCode,
  Video,
  Folder,
  X,
  ChevronDown,
  HelpCircle
} from 'lucide-react';

interface LandingPageProps {
  onConnectDrive: (method: 'popup' | 'redirect') => void;
}

export default function LandingPage({ onConnectDrive }: LandingPageProps) {
  const [isImpressumOpen, setIsImpressumOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
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

  return (
    <div id="landing-page-wrapper" className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 font-sans select-none">
      {/* Hero Header Area with Grey Dot Grid Concept */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden bg-slate-100 py-12 sm:py-20 px-6 sm:px-12 text-center border-b border-slate-200 group/hero"
      >
        {/* Base Layer: Grey background with radial fading black dot grid (larger and slightly darker) */}
        <div 
          className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(#000000_2px,transparent_2px)] [background-size:24px_24px] pointer-events-none transition-opacity duration-300"
          style={{ 
            maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)', 
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)' 
          }}
        />

        {/* Dynamic Spotlight Layer: Exquisite interactive spotlight centered exactly around the mouse cursor */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 bg-[radial-gradient(#000000_3.5px,transparent_3.5px)] [background-size:24px_24px]"
          style={{ 
            opacity: isHovered ? 0.48 : 0,
            maskImage: `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)`, 
            WebkitMaskImage: `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)` 
          }}
        />

        <div className="max-w-3xl mx-auto relative z-10 bg-white/75 backdrop-blur-xl border border-white/50 rounded-2xl p-6 sm:p-10 shadow-xl overflow-hidden pt-8 sm:pt-12">
          {/* Subtle Google Core Brand Bar Accent at Top */}
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
            <span className="text-slate-600">Alle deine Notizen auf GDrive</span>
          </div>

          <h1 id="landing-hero-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-sans mt-2 mb-4 leading-tight">
            Willkommen bei <span className="text-[#4285F4]">DriveDeck</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            Das hochpräzise, blockbasierte Arbeitswerkzeug für Google Drive-Notizen. 100% datenschutzfreundlich, komplett offlinefähig und sicher im lokalen Browser persistiert.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 mt-6">
            <button
              onClick={() => onConnectDrive('popup')}
              className="w-full sm:w-auto px-8 py-3 bg-[#4285F4] hover:bg-[#357ae8] text-white font-black rounded-lg shadow-md ring-offset-2 ring-offset-white focus:outline-none focus:ring-2 focus:ring-[#4285F4] transition-all cursor-pointer flex items-center justify-center gap-3 text-sm"
              id="google-signin-hero-btn"
            >
              <span>Mit Google anmelden &amp; testen (3 Monate gratis)</span>
              <ArrowRight className="w-4.5 h-4.5 text-white" />
            </button>
            <button
              onClick={() => onConnectDrive('redirect')}
              className="text-xs text-slate-500 hover:text-[#4285F4] transition-colors flex items-center gap-1 underline font-semibold cursor-pointer"
              id="google-signin-redirect-link"
            >
              <span>Popup blockiert? Per Google-Weiterleitung (Redirect) anmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Feature Grid container */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Simple visual explanation card: "Was ist DriveDeck?" */}
        <div className="mb-16 bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100/80 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 border border-sky-200 rounded-full text-xs text-sky-800 font-bold mb-4 select-none">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>DriveDeck auf den Punkt erklärt 💡</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Was ist DriveDeck und wie funktioniert es?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl mb-8">
              Stell dir ein blockbasiertes Notizen-Programm vor, bei dem aber <strong>keine einzige Zeile</strong> deiner sensiblen Gedanken oder geschäftlichen Dokumente jemals auf fremden Servern landet. Das ist DriveDeck.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-3xs flex flex-col items-start transition-all hover:shadow-xs hover:border-sky-200">
                <span className="text-4xl mb-3.5 select-none">💻</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">1. Vollständig im Webbrowser</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Die App läuft zu 100% in deinem Browser-Tab auf deinem Computer oder Handy. Alles, was du eintippst (Notizen, To-Dos, Skizzen), wird direkt auf deiner eigenen Festplatte gesichert.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-3xs flex flex-col items-start transition-all hover:shadow-xs hover:border-sky-200">
                <span className="text-4xl mb-3.5 select-none">🛡️</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">2. Es gibt keinen DriveDeck-Server</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Herkömmliche Apps laden deine privaten Notizen in fremde Datenbanken hoch. DriveDeck hat kein Backend und keine Server-Datenbank. Deine Privatsphäre ist somit technisch garantiert.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-3xs flex flex-col items-start transition-all hover:shadow-xs hover:border-sky-200">
                <span className="text-4xl mb-3.5 select-none">☁️</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">3. Dein Google Drive als Cloud</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Um Notizen auf mehreren Geräten zu synchronisieren, verbindest du einfach dein Google Drive. Die App speichert deine Daten verschlüsselt in deiner eigenen Cloud. Niemand außer dir hat Zugriff.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 leading-relaxed">
                📢 <strong>Kurz gesagt:</strong> DriveDeck ist deine private Notizen-Zentrale, die Google Drive als sichere Festplatte nutzt, ohne dass Dritte deine Daten sehen können.
              </div>
              <button
                onClick={() => onConnectDrive('popup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold rounded text-xs select-none shadow-xs cursor-pointer transition-all"
                id="google-signin-middle-btn"
              >
                <span>Mit Google anmelden</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <h2 id="core-advantages-heading" className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-8">
          Die vier tragenden Säulen von DriveDeck 🎯
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md shrink-0">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">100% Client-Side Sicherheit (Kein Backend!)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deine Daten gehören dir. Es gibt bei uns keinen Application-Server oder eine Cloud-Datenbank, die deine Inhalte liest oder speichert. Alles läuft vollständig in deinem Browser-Tab (Sandboxed). Dein privater Tresor liegt lokal.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-md shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">&#34;Bahn-Ready&#34; (Komplett Offline-Fähig)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Egal ob im Funkloch, im ICE durch Tunnel oder im Flieger: Da deine gesamte Datenstruktur in der lokalen browserintegrierten <strong>IndexedDB</strong>-Datenbank gesichert ist, gibt es keinerlei Wartezeiten, Offline-Ladebildschirme oder Datenverluste.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-md shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">&#34;Bring Your Own Cloud&#34; mit Google Drive</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Möchtest du Notizen synchronisieren, entscheidest DU allein über den Speicherort. Wenn du Google Drive koppelst, speichert DriveDeck verschlüsselt in dem verborgenen <code>appdata</code>-Bereich deines privaten Google Drives. Kein Dritter hat Zugriff.
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-md shrink-0">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Sichere Multimedia- &amp; Dateibetung</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Betten Sie Google Docs, Tabellenblätter, YouTube-Videos, Bilder oder Google Kalender über Drive-Identifikatoren sicher ein. Da dies über lokale, sandboxed iFrames direkt von Google-Servern erfolgt, fließen deine vertraulichen Dokumentdaten niemals durch fremde Analyse-APIs.
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
              <span className="text-emerald-900 font-extrabold tracking-tight">Sicherheits- &amp; DSGVO-Garantie: Warum DriveDeck absolut sicher ist</span>
            </h3>
            
            {/* Premium GDPR & Privacy Badges */}
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 mb-4 select-none overflow-x-auto no-scrollbar">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                🇪🇺 100% DSGVO-Konform
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                🔒 Privacy by Design
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                🇩🇪 EU-Datenschutz
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-600/15 text-emerald-900 font-bold text-[9px] sm:text-[10px] md:text-[11px] rounded border border-emerald-500/30 uppercase tracking-wide whitespace-nowrap">
                🛡️ Zero Server Storage
              </span>
            </div>

            <p className="text-xs sm:text-sm text-emerald-800/90 leading-relaxed mb-5 font-medium">
              Herkömmliche Editoren speichern deine sensiblen geschäftlichen und privaten Notizen auf Servern von Drittanbietern. DriveDeck bricht mit diesem Modell auf revolutionäre Weise und setzt neue Maßstäbe bei DSGVO und Datenschutz:
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-left">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed"><strong>Rechtssicher &amp; DSGVO-konform:</strong> Da keinerlei personenbezogene Daten oder Notiz-Inhalte auf Servern von DriveDeck zwischengespeichert oder verarbeitet werden, entfällt das Risiko von Datenlecks vollständig. Du behältst die vollkommene Datensouveränität (ideal für Freiberufler, Kanzleien und Unternehmen).</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed"><strong>Lokaler Browser-Tresor:</strong> Deine Pages werden ungefiltert in deiner lokalen IndexedDB des Browsers abgelegt.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed"><strong>Dateisperre für Dritte:</strong> Bei Anbindung deines Google Drives werden deine Notizen ausschließlich in deinem persönlichen Drive in einer gekapselten Sandbox-Struktur (<code>appdata</code>) gehalten. Sie fließen niemals über DriveDeck-Server.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed"><strong>Sicherer iFrame Embed:</strong> Dokument-Einbettungen (wie Docs oder Sheets) nutzen das offizielle Google Drive-Sicherheitsmodell. DriveDeck erhält lediglich die Referenz-ID, die Vorschau wird per direktem iFrame gerendert.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed"><strong>Kapselung für Abonnenten &amp; Sharing (Sicherheits-Feature):</strong> Beim Teilen von Alben oder Seiten kopiert DriveDeck diese in einen separaten, sichtbaren <code>DriveDeck</code>-Ordner auf deinem Google Drive. Abonnenten erhalten nur Leserechte auf diese isolierten Backup-Kopien. Deine Originaldatei ist zu 100% geschützt, unsichtbar und kann nicht verändert werden – selbst wenn du mal eine Berechtigung falsch konfigurierst!</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-emerald-900/95 leading-relaxed"><strong>Keine Tracking-Cookies:</strong> Wir analysieren oder loggen deine Eingaben nicht. Keine Keylogger, keine Cloud-Lese-Skripte.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dynamic Interactive Preview Showcase */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Unterstützte Integrationen &amp; Ökosystem</h3>
          <p className="text-xs text-slate-500 max-w-xl mx-auto mb-6">
            Gestalten Sie Ihren Arbeitsplatz mit interaktiven Elementen, die Sie mit der schnellen Tastatur-Slash-Steuerung (<kbd className="px-1.5 py-0.5 border border-slate-300 rounded text-[10px] bg-slate-100 font-mono font-bold">/</kbd>) erstellen können oder direkt über das Google Drive-Explorer Deck verwalten:
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <FileText className="w-5 h-5 text-blue-500 mb-1.5 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">Google Docs</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Berichte &amp; Notizen</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Sheets</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-sans">Kalkulationen</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Presentation className="w-5 h-5 text-amber-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Slides</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Präsentationsfolien</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <ClipboardList className="w-5 h-5 text-purple-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Forms</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Umfragen &amp; Bögen</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Calendar className="w-5 h-5 text-violet-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Kalender</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Termine &amp; Timelines</span>
            </div>

            {/* Row 2 */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <ListTodo className="w-5 h-5 text-teal-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">DriveTasks</span>
              <span className="text-[10px] text-slate-400 mt-0.5">To-Do- &amp; Checklisten</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Image className="w-5 h-5 text-pink-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Photos</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Bilder &amp; Portfolios</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <StickyNote className="w-5 h-5 text-yellow-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Google Keep</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Geistesblitze &amp; Memos</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Mail className="w-5 h-5 text-rose-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800 font-sans">Gmail</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Postfach &amp; Kontakte</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Youtube className="w-5 h-5 text-red-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">YouTube Embeds</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Lehr- &amp; Erklärvideos</span>
            </div>

            {/* Row 3 - General Files & Code formats */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <File className="w-5 h-5 text-rose-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">PDF-Dokumente</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Berichte &amp; E-Books</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Video className="w-5 h-5 text-orange-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Videodateien</span>
              <span className="text-[10px] text-slate-400 mt-0.5">MP4, MKV &amp; Screencasts</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <FileCode className="w-5 h-5 text-cyan-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Programmcode</span>
              <span className="text-[10px] text-slate-400 mt-0.5">HTML, JS, Python, CSS</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <File className="w-5 h-5 text-slate-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">TXT &amp; Logs</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Rohdaten &amp; Notizen</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center shadow-3xs hover:-translate-y-0.5 transition-transform">
              <Folder className="w-5 h-5 text-indigo-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Dateien &amp; Archive</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-sans">Zip, RAR &amp; freie Formate</span>
            </div>
          </div>
        </div>

        {/* Pricing Information Card */}
        <div className="mt-16 text-left w-full relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-750 font-semibold mb-4 select-none animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Transparent &amp; Fair: 3 Monate komplett kostenlos</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mb-3">
              Volle Kraft für deine Produktivität
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mb-8">
              Jeder User bekommt die ersten <strong className="text-emerald-700 font-bold px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200 text-xs">3 Monate völlig kostenlos</strong> und kann die komplette Anwendung ohne jegliche Einschränkungen nutzen. Danach entscheidest du ganz entspannt selbst, wie es weitergeht:
            </p>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: Monthly */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 hover:shadow-2xs transition-all">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Monats-Abo</span>
                  <h4 className="text-2xl font-black text-slate-800 mt-1 mb-2">4.90$<span className="text-xs font-normal text-slate-400"> / Monat</span></h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Maximale Flexibilität. Monatlich kündbar, perfekt für den kurzfristigen oder flexiblen Einsatz.
                  </p>
                </div>
              </div>
 
              {/* Option 2: Annual */}
              <div className="bg-sky-50/20 p-5 rounded-xl border-2 border-sky-500/80 flex flex-col justify-between relative hover:shadow-2xs transition-all">
                <div className="absolute -top-3 right-4 bg-sky-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
                  Empfohlen
                </div>
                <div>
                  <span className="text-[10px] text-sky-600 uppercase font-bold tracking-wider">Jahres-Abo</span>
                  <h4 className="text-2xl font-black text-slate-950 mt-1 mb-1">49.00$<span className="text-xs font-normal text-slate-400"> / Jahr</span></h4>
                  <div className="text-[11px] text-emerald-700 font-bold mb-2.5 bg-emerald-50 py-0.5 px-2 rounded border border-emerald-200 inline-block">
                    2 Monate kostenlos
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Spare bares Geld gegenüber dem Monatsabo. Optimal für kontinuierliche, langfristige Planung.
                  </p>
                </div>
              </div>
 
              {/* Option 3: Lifetime */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 hover:shadow-2xs transition-all">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Einmalkauf</span>
                  <h4 className="text-2xl font-black text-slate-800 mt-1 mb-2">139.00$<span className="text-xs font-normal text-slate-400"> / Lebenslang</span></h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Einmal kaufen, immer nutzen. Inklusive aller zukünftigen Updates und Features, ganz ohne Abo.
                  </p>
                </div>
              </div>
            </div>
 
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-650 font-medium leading-relaxed max-w-2xl bg-indigo-50/60 border border-indigo-100 p-3.5 rounded-lg text-left">
                ❤️ <strong className="text-indigo-800 font-bold">Entwicklung unterstützen:</strong> Mit einem Abo oder Einmalkauf hilfst du direkt dabei, die Weiterentwicklung von DriveDeck aufrechtzuerhalten. Es sind bereits viele weitere spannende Features geplant, um dein Workspace-Erlebnis noch besser zu machen!
              </p>
              <p className="text-[11px] text-slate-400 text-left sm:text-right sm:max-w-[240px] shrink-0 leading-normal">
                * Keine Kreditkarte für die Testphase nötig. Da DriveDeck serverlos arbeitet, liegen alle Daten sicher bei dir.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ - Frequently Asked Questions Section */}
        <div className="mt-20 border-t border-slate-200 pt-12 text-left w-full max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6.5 h-6.5 text-[#4285F4] shrink-0" />
              <span>Häufig gestellte Fragen (FAQ)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Alles, was du über Datensicherheit, Kosten und die Zukunft von DriveDeck wissen musst.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
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
                q: 'Wie komme ich an meine Daten im versteckten Google Drive Ordner, wenn ich nicht mehr zahle oder den Dienst beenden will?',
                a: 'Du behältst immer die volle Souveränität (kein Vendor Lock-in): 1) Lokaler Gratis-Export: Du kannst dich jederzeit in der DriveDeck-Benutzeroberfläche anmelden – auch komplett ohne aktives Abonnement – und im Einstellungsbereich (Zahnrad-Symbol unten links) unter "Daten-Backup & Portabilität" mit einem Klick ein vollständiges Backup all deiner Alben, Seiten, Haftnotizen und Aufgabenlisten als standardisierte, menschenlesbare JSON-Datei herunterladen. Diese Daten kannst du frei konvertieren oder sichern. 2) Über Google Drive: Da die Daten direkt in deinem Google Account (im sicheren AppData-Ordner) gespeichert sind, kannst du sie auch jederzeit über Google Takeout exportieren. Niemand sperrt deine Daten weg!'
              },
              {
                q: 'Was passiert mit meinen Daten, wenn ich nach 3 Monaten entscheide, den Service vorerst nicht weiter zu abonnieren?',
                a: 'Deine Daten bleiben zu 100% erhalten. Deine Notizen und Alben werden auf keinen Fall gelöscht. Du kannst sie weiterhin offline im Browser aufrufen, editieren und manuell exportieren. Lediglich die automatische Echtzeit-Synchronisation im Hintergrund zwischen deiner lokalen IndexedDB des Browsers und deinem Google Drive wird pausiert, bis du das Abonnement reaktivierst.'
              },
              {
                q: 'Wozu zahle ich als User eigentlich, wenn Ihr doch nicht selbst teure Server unterhalten müsst?',
                a: 'Das ist eine absolut ehrliche und berechtigte Frage! Du zahlst hier nicht für teure Cloud-Speicher-Server (denn diesen Speicherplatz stellt Google dir direkt bereit), sondern für die kontinuierliche Entwicklung, regelmäßige Sicherheits-Audits, die Pflege der Integrationen sowie den persönlichen Kundensupport. Außerdem fallen Gebühren für die Google-API-Zertifizierung (ein aufwendiger Überprüfungsprozess von Google für Datensicherheit) und die Stripe-Zahlungs-Schnittstellen an. Durch deinen Beitrag bleibt DriveDeck unabhängig von Investoren und garantiert völlig frei von nerviger Werbung oder Datenhandel.'
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
            ].map((faq, idx) => {
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
        <div className="mt-16 text-center border-t border-slate-200 pt-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-full text-[10px] text-sky-700 font-bold tracking-wide mb-6">
            <Globe2 className="w-3.5 h-3.5 text-sky-600 animate-spin-slow" />
            <span>Offizielle Projekt-Domain:</span>
            <a href="https://drivedeck.xyz" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-900 font-mono">drivedeck.xyz</a>
            <span className="bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded-full text-[8px] uppercase">Aktiv</span>
          </div>

          <p className="text-xs text-slate-500 italic mb-4">
            Bereit für ein neues Level an digitaler Souveränität?
          </p>
          <div className="flex justify-center mb-8">
            <button
              onClick={() => onConnectDrive('popup')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold rounded text-xs select-none shadow-xs cursor-pointer transition-all"
              id="google-signin-footer-btn"
            >
              <span>Jetzt mit Google anmelden &amp; loslegen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-sans mt-2 border-t border-slate-100 pt-5 gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span>© {new Date().getFullYear()} DriveDeck. Alle Rechte vorbehalten.</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsImpressumOpen(true)} 
                  className="hover:text-slate-600 underline cursor-pointer transition-colors"
                  id="footer-link-impressum"
                >
                  Impressum
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={() => setIsPrivacyOpen(true)} 
                  className="hover:text-slate-600 underline cursor-pointer transition-colors"
                  id="footer-link-privacy"
                >
                  Datenschutzerklärung
                </button>
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
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Impressum</h3>
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
                <p className="leading-relaxed font-semibold text-slate-855">
                  Hansjürg Wüthrich<br />
                  Obermülistrasse 21<br />
                  8320 Fehraltorf<br />
                  Schweiz
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">Kontakt:</p>
                <p className="leading-relaxed">
                  E-Mail: <a href="mailto:hj.wuethrich@gmail.com" className="text-sky-600 hover:underline font-semibold">hj.wuethrich@gmail.com</a>
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">Haftungsausschluss (Disclaimer):</p>
                <p className="leading-relaxed text-slate-500">
                  <strong>Haftung für Inhalte:</strong> Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.<br /><br />
                  <strong>Haftung für Links:</strong> Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.<br /><br />
                  <strong>Betrieb, Einstellung und API-Änderungen:</strong> DriveDeck ist ein unabhängiges Software-Projekt. Wir behalten uns das Recht vor, den Dienst und dessen Funktionalitäten jederzeit ohne Angabe von Gründen temporär einzustellen, anzupassen oder dauerhaft aufzugeben (beispielsweise beim Wegbrechen externer Schnittstellen wie Google APIs, bei Krankheit des Betreibers oder sonstigen unvorhersehbaren technischen oder gesundheitlichen Hindernissen). Wir versprechen im selben Atemzug, nach bestem Wissen und Gewissen alles in unserer Macht stehende zu tun, um den Dienst stabil, sicher und dauerhaft aufrechtzuerhalten.<br /><br />
                  <strong>100% Datenhoheit &amp; Kein Lock-In:</strong> Da DriveDeck serverlos arbeitet, landen Ihre Notizen, Configs und Daten <strong>niemals bei uns</strong>. Alle Daten verbleiben zu jeder Sekunde ausschließlich in Ihrem direkten Besitz (gespeichert in Ihrem Browser-Speicher oder in Ihrem eigenen Google Drive-Ordner). Selbst bei einer vollständigen oder plötzlichen Einstellung von DriveDeck können Sie Ihre Daten jederzeit gefahrlos über Ihre persönlichen Google Drive JSON-Sicherungen, per lokalem JSON-Export oder via Google Takeout sichern und migrieren. Es besteht zu keinem Zeitpunkt das Risiko eines Datenverlusts durch uns.
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsImpressumOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs cursor-pointer transition-colors"
                id="close-impressum-modal-btn"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Datenschutz Modal */}
      {isPrivacyOpen && (
        <div id="privacy-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in text-left">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Datenschutzerklärung</h3>
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                id="close-privacy-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-4 select-text selection:bg-sky-100 selection:text-sky-900 font-sans">
              <h4 className="text-sm font-bold text-slate-800">1. Datenschutz auf einen Blick</h4>
              <p className="leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. DriveDeck arbeitet nach dem Prinzip der <strong>100% serverlosen Architektur</strong>. Das bedeutet: Wir betreiben keine eigenen Datenbanken für Ihre Notizen oder Google Drive-Inhalte. Sämtliche Notizen werden ausschließlich in Ihrem lokalen Browser (IndexedDB) verschlüsselt oder direkt in Ihrem persönlichen Google Drive Konto gesichert.
              </p>

              <h4 className="text-sm font-bold text-slate-800">2. Verantwortliche Stelle</h4>
              <p className="leading-relaxed">
                Verantwortlicher für die Datenverarbeitung im Sinne der DSGVO sowie anderer nationaler Datenschutzgesetze ist:<br />
                <strong>Hansjürg Wüthrich</strong><br />
                Obermülistrasse 21, 8320 Fehraltorf, Schweiz<br />
                E-Mail: <span className="font-semibold text-[#4285F4]">hj.wuethrich@gmail.com</span>
              </p>

              <h4 className="text-sm font-bold text-slate-800">3. Google API Services &amp; Google Drive Integration</h4>
              <p className="leading-relaxed">
                DriveDeck integriert sich mit Google Drive-Diensten, um Ihnen das Speichern und Laden Ihrer Notizen direkt auf Ihrer persönlichen Cloud-Festplatte zu ermöglichen.
              </p>
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 space-y-2.5">
                <p className="font-semibold text-slate-800">Einhaltung der Google-Nutzerdatenrichtlinien (Adherence to Google API Services User Data Policy):</p>
                <p className="italic text-slate-700">
                  "DriveDeck's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements."
                </p>
                <p className="text-slate-700">
                  <strong>Übermittlung an Dritte:</strong> Ihre Google Drive-Nutzerdaten werden von uns niemals an externe Server, Drittanbieter oder Werbenetzwerke übertragen, geteilt oder verkauft. Alle Aufrufe erfolgen direkt als sichere Client-zu-Google API HTTPS-Anfragen direkt aus Ihrem Webbrowser.
                </p>
              </div>

              <h4 className="text-sm font-bold text-slate-800">4. Nutzung der Google APIs &amp; Berechtigungen (Scopes)</h4>
              <p className="leading-relaxed">
                Für die vollständige Funktionalität von DriveDeck werden folgende Berechtigungen über Ihren Google-Account angefordert:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                <li><strong>.../auth/drive.file</strong> – Ermöglicht das Erstellen, Lesen, Aktualisieren und Löschen von Dateien (z.B. Notizblöcken, .json-Synchronisationsdateien), die explizit mit DriveDeck erstellt oder geöffnet wurden.</li>
                <li><strong>.../auth/drive.appdata</strong> – Ermöglicht das Speichern verdeckter Applikationsdaten (z.B. Sortiereinstellungen, Vorlagen) zur Personalisierung Ihrer App.</li>
                <li><strong>.../auth/calendar.readonly</strong> – Ermöglicht die Anzeige Ihrer anstehenden Termine direkt im Kalender-Widget Ihrer Arbeitsumgebung.</li>
                <li><strong>.../auth/tasks</strong> – Ermöglicht die nahtlose Synchronisation und Verwaltung Ihrer Google-Aufgaben (Tasks) direkt in Ihrem DriveDeck-Aufgaben-Widget.</li>
              </ul>

              <h4 className="text-sm font-bold text-slate-800">5. Stripe Zahlungsabwicklung</h4>
              <p className="leading-relaxed">
                Wenn Sie ein kostenpflichtiges Abonnement aktivieren, wird Ihre Google-E-Mail-Adresse verschlüsselt an Stripe übermittelt, um Kundensatzerstellungen und die Rechnungslegung abzuwickeln. Eine Speicherung dieser Daten durch uns erfolgt nicht.
              </p>

              <h4 className="text-sm font-bold text-slate-800">6. Ihre Rechte</h4>
              <p className="leading-relaxed">
                Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezenden Daten. Da wir keine Daten zentral speichern, können Sie Ihre Einwilligung zur Datenverarbeitung jederzeit widerrufen, indem Sie die Google-Konto-Verbindung trennen oder Ihre Cookies &amp; Websitedaten im Browser zurücksetzen.
              </p>

              <h4 className="text-sm font-bold text-slate-800">7. Datenhoheit, Dienst-Verfügbarkeit &amp; Backup-Garantie</h4>
              <p className="leading-relaxed text-slate-500">
                Wir versprechen, alles in unserer Macht Stehende zu tun, um DriveDeck dauerhaft, performant und zuverlässig bereinzustellen. Da dieser Dienst jedoch auf externen Programmierschnittstellen (z.B. Google APIs, Stripe) basiert und als unabhängiges Software-Projekt betrieben wird, behalten wir uns das Recht vor, den Dienst jederzeit und ohne Angabe von Gründen anzupassen, zu pausieren oder vollständig einzustellen (beispielsweise bei unvorhersehbaren technischen API-Einschränkungen der Drittanbieter, Krankheit des Betreibers oder sonstigen unbeeinflussbaren Hinderungsgründen).<br /><br />
                <strong>Kein Datenverlust &amp; Kein Lock-In:</strong> Ihre Daten landen zu keinem Zeitpunkt auf unseren Systemen, sondern verbleiben zu jeder Sekunde zu 100% in Ihrem persönlichen Besitz (in Ihrer lokalen IndexedDB-Datenbank oder direkt in Ihrem eigenen Google Drive Konto). Selbst falls dieser Webservice jemals eingestellt werden sollte, können Sie auch völlig ohne unsere Applikation jederzeit direkt in Ihrem Google Drive über Ihre vertrauten Datei-Ordner auf Ihre Rohdaten (Sicherungsdateien im standardisierten JSON-Format) zugreifen, diese lokal exportieren oder bequem per Google Takeout sichern. Ein Verlust Ihrer produktiven Arbeitsfortschritte ist somit techisch vollständig ausgeschlossen.
              </p>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs cursor-pointer transition-colors"
                id="close-privacy-modal-btn"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
