/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  Folder
} from 'lucide-react';

interface LandingPageProps {
  onStartCreating: () => void;
  onConnectDrive: () => void;
}

export default function LandingPage({ onStartCreating, onConnectDrive }: LandingPageProps) {
  return (
    <div id="landing-page-wrapper" className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 font-sans select-none">
      {/* Hero Header Area with Friendly Bright Concept */}
      <div className="relative overflow-hidden bg-slate-100 py-12 sm:py-20 px-6 sm:px-12 text-center border-b border-slate-200">
        <img 
          src="/BannerLogo.png" 
          alt="Banner Logo" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-400/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative z-10 bg-white/45 backdrop-blur-xl border border-white/40 rounded-2xl p-6 sm:p-10 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-100 rounded-full text-xs text-sky-700 font-bold tracking-wide mb-4 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>100% Serverloses Zero-Backend &amp; Maximale Privatsphäre</span>
          </div>
          
          <h1 id="landing-hero-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-sans mt-2 mb-4 leading-tight">
            Willkommen bei <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-500">DriveDeck</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            Das hochpräzise, Notion-style Arbeitswerkzeug für Google Drive-Notizen. 100% datenschutzfreundlich, komplett offlinefähig und sicher im lokalen Browser persistiert.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <button
              onClick={onStartCreating}
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded shadow-md ring-offset-2 ring-offset-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Arbeitsbereich starten</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onConnectDrive}
              className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded shadow-xs focus:outline-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FolderSync className="w-4 h-4 text-sky-600" />
              <span>Drive verbinden (Optional)</span>
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
              Stell dir ein Notizen-Programm wie Notion vor, bei dem aber <strong>keine einzige Zeile</strong> deiner sensiblen Gedanken oder geschäftlichen Dokumente jemals auf fremden Servern landet. Das ist DriveDeck.
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
                onClick={onStartCreating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded text-xs select-none shadow-xs cursor-pointer transition-colors"
              >
                <span>Direkt ausprobieren</span>
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
              <span className="text-emerald-900 font-extrabold tracking-tight">Sicherheitsgarantie: Warum DriveDeck absolut sicher ist</span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800/90 leading-relaxed mb-6 font-medium">
              Herkömmliche Editoren speichern deine sensiblen geschäftlichen und privaten Notizen auf Servern von Drittanbietern. DriveDeck bricht mit diesem Modell auf revolutionäre Weise:
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-left">
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
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-5xl mx-auto">
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
              <span className="text-xs font-bold text-slate-800">Google Tasks</span>
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
              <span className="text-[10px] text-slate-400 mt-0.5">Zip, RAR &amp; freie Formate</span>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center border-t border-slate-200 pt-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-full text-[10px] text-sky-700 font-bold tracking-wide mb-6">
            <Globe2 className="w-3.5 h-3.5 text-sky-600 animate-spin-slow" />
            <span>Offizielle Projekt-Domain:</span>
            <a href="https://drivedeck.xyz" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-900 font-mono">drivedeck.xyz</a>
            <span className="bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded-full text-[8px] uppercase">Aktiv</span>
          </div>

          <p className="text-xs text-slate-500 italic mb-4">
            Bereit für ein neues Level an digitaler Souveränität?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              onClick={onStartCreating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded text-xs select-none shadow-xs cursor-pointer transition-all"
            >
              <span>Direkt loslegen (Ohne Anmeldung)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="https://drivedeck.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded text-xs select-none cursor-pointer transition-colors"
            >
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span>drivedeck.xyz öffnen</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-sans mt-2 border-t border-slate-100 pt-5">
            <span>© {new Date().getFullYear()} DriveDeck. Alle Rechte vorbehalten.</span>
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
              <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500">100% Serverless SPA</span>
              <span className="font-mono text-[10px] bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 text-emerald-600">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
