/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Shield, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export default function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  const { language, t } = useLanguage();

  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (language === 'en') {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-900">
        {/* Upper Brand bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

        <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
          {/* Back navigation button */}
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded px-3 py-1.5 shadow-xs cursor-pointer transition-all mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.back')}</span>
          </button>

          {/* Header Block */}
          <div className="border-b border-slate-200 pb-8 mb-8">
            <div className="flex items-center gap-2.5 mb-3 text-sky-600">
              <Shield className="w-6 h-6" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold">Privacy &amp; Security</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last updated: June 10, 2026. 100% serverless, private, and secure.
            </p>
          </div>

          {/* Content Block */}
          <div className="space-y-8 text-sm leading-relaxed text-slate-600 select-text">
            
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                1. Privacy at a Glance
              </h2>
              <p className="mb-3">
                The protection of your personal identity and notes is our absolute priority. DriveDeck is engineered strictly upon a <strong>100% serverless client-side SPA structure</strong>.
              </p>
              <p className="mb-3">
                This means: <strong>We do not maintain any backend database servers, tracking algorithms, or storage caches of your notes and document details.</strong>
              </p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 text-xs text-emerald-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Where is your data?</span>
                </div>
                <p>
                  All active workspaces, text lines, images, dates, and boards live strictly in these two locations under your own exclusive authority:
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-1 font-mono text-[11px]">
                  <li><strong>Local Browser Sandbox:</strong> Encapsulated safely in your browser\'s local sandboxed cache (IndexedDB).</li>
                  <li><strong>Your Google Drive:</strong> Synchronized directly into your own private Google storage quota.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                2. Data Controller
              </h2>
              <p>
                The responsible party and controller for data processing under the European General Data Protection Regulation (GDPR) and the Swiss Federal Act on Data Protection (FADP) is:
              </p>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 font-sans text-xs text-slate-700 leading-relaxed font-medium text-left">
                <span className="font-extrabold text-slate-900 text-left">Hansjürg Wüthrich</span><br />
                Obermülistrasse 21<br />
                8320 Fehraltorf<br />
                Switzerland<br />
                <span className="flex items-center gap-1.5 mt-2 text-sky-600">
                  <Mail className="w-3.5 h-3.5" />
                  <a href="mailto:hj.wuethrich@gmail.com" className="hover:underline font-semibold font-mono">hj.wuethrich@gmail.com</a>
                </span>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                3. Google API Services - User Data Policy Disclosures
              </h2>
              <p>
                DriveDeck gives you the ability to link your personal Google account directly through client-side scripting. To provide standard clarity and complete compliance with Google policies, we disclose the access and processing below:
              </p>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                    <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                    🔑 Data Accessed
                  </h3>
                  <p className="text-xs text-slate-600 pl-3">
                    Using official secure API gateways, our script requests permissions to access the following data objects once approved on your Google consent prompt:
                  </p>
                  <ul className="list-disc pl-7 text-xs text-slate-605 space-y-1 font-sans">
                    <li><strong>Google Drive Files &amp; Folders:</strong> Structural directory layouts, document names, and content streams strictly selected via the file picker or isolated inside the application folder sandbox.</li>
                    <li><strong>Google Calendar Events:</strong> Upcoming event summaries (names, descriptions, timelines) from chosen personal calendars.</li>
                    <li><strong>User Profile Info (Google Auth):</strong> Primary email address and linked account ID to authenticate your session and personalize your local workspace.</li>
                  </ul>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                    <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                    🔄 Data Usage &amp; Handling
                  </h3>
                  <p className="text-xs text-slate-600 pl-3">
                    All processed data flows strictly locally on your endpoint. Purposes of use include:
                  </p>
                  <ul className="list-disc pl-7 text-xs text-slate-605 space-y-1 font-sans">
                    <li><strong>Calendar:</strong> Renders upcoming records directly in the calendar display widget of your local UI.</li>
                    <li><strong>Google Drive:</strong> Reading, writing, and automatically securing cloud backups of folders, note structures, and workspace packages you create. Our software never scans or touches anything beyond its own folder structure.</li>
                    <li><strong>User profile:</strong> Authenticating and personalizing your local workspace session via safe Firebase Authentication APIs.</li>
                  </ul>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    🔒 Data Storage &amp; Sharing
                  </h3>
                  <ul className="list-disc pl-7 text-xs text-slate-605 space-y-1 font-sans">
                    <li><strong>No Server Caching:</strong> DriveDeck never transfers or stores your private contents or files to database networks controlled by us.</li>
                    <li><strong>No Selling / Sharing:</strong> Your personal or metadata records are never packaged, scanned for promotional programs, shared with advertisers, or used for AI modeling.</li>
                    <li><strong>Encrypted Tokens:</strong> Secure authorization credentials remain isolated on your sandboxed device (IndexedDB/SessionStorage).</li>
                  </ul>
                </div>

                <div className="border-t border-sky-150 bg-sky-50/75 rounded-lg p-3.5 mt-2 text-xs text-sky-900 space-y-1.5">
                  <p className="font-bold text-[10px] text-sky-850 uppercase tracking-wide">
                    Google API Services User Data Policy Compliance
                  </p>
                  <p className="italic text-[11px] leading-relaxed border-l-2 border-sky-300 pl-3 text-sky-850">
                    "DriveDeck\'s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements."
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                4. List of OAuth Scopes Requested
              </h2>
              <p>
                Depending on active workspace integrations, the app may request permissions for:
              </p>
              <ul className="space-y-2.5 bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700">
                <li className="flex items-start gap-2 border-b border-slate-100 pb-2">
                  <span className="font-bold text-sky-600 select-none">✓</span>
                  <div>
                    <strong className="text-slate-800 block">.../auth/drive.file</strong>
                    <span className="text-[11px] text-slate-505 font-sans block mt-0.5">Allows writing and importing notes metadata using open .json standards directly into your Google Drive cluster.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 border-b border-slate-100 pb-2">
                  <span className="font-bold text-sky-600 select-none">✓</span>
                  <div>
                    <strong className="text-slate-800 block">.../auth/drive.appdata</strong>
                    <span className="text-[11px] text-slate-505 font-sans block mt-0.5 font-sans">Enables storing configuration variables safely in your own sandboxed app folder in drive.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 border-b border-slate-100 pb-2">
                  <span className="font-bold text-sky-600 select-none">✓</span>
                  <div>
                    <strong className="text-slate-800 block">.../auth/calendar.readonly</strong>
                    <span className="text-[11px] text-slate-505 font-sans block mt-0.5 font-sans">Allows pulling event details for quick viewing on your local widget. It never updates or writes.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 select-none">✓</span>
                  <div>
                    <strong className="text-slate-800 block">.../auth/tasks</strong>
                    <span className="text-[11px] text-slate-505 font-sans block mt-0.5 font-sans">Allows you to visualize drive lists and checklist events within our dashboard. Everything rests local.</span>
                  </div>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                5. No Payment Processors / 100% Free
              </h2>
              <p>
                DriveDeck is completely free and does not integrate any third-party payment gateways (such as Stripe or PayPal). No financial, credit card, or banking details are ever requested, transmitted, or processed.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                6. Your Legal Sovereignty Rights
              </h2>
              <p>
                Under European GDPR frameworks and Swiss FADP statutes, you can request full information, corrections, blocks, or deletions of your records at any time.
              </p>
              <p className="bg-sky-50/50 border border-sky-100/70 rounded-lg p-3.5 text-xs text-slate-600">
                Since we <strong>do not record or store any credentials or documents on our own endpoints</strong>, you can execute all deletion rights instantly yourself. Simply revoke app authorizations inside your Google Account Security Dashboard, or delete clear cached IndexedDB volumes directly via your browser tools.
              </p>
            </section>

          </div>

          {/* Footer actions */}
          <div className="border-t border-slate-200 mt-12 pt-8 flex justify-center">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('landing.footer_terms_back')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, default German Policy
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Upper Brand bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        {/* Back navigation button */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-505 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded px-3 py-1.5 shadow-xs cursor-pointer transition-all mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zurück zur Startseite</span>
        </button>

        {/* Header Block */}
        <div className="border-b border-slate-200 pb-8 mb-8">
          <div className="flex items-center gap-2.5 mb-3 text-sky-600">
            <Shield className="w-6 h-6" />
            <span className="font-mono text-xs uppercase tracking-wider font-bold">Datenschutz &amp; Vertrauen</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Letzte Aktualisierung: 10. Juni 2026. 100% serverlos, datenschutzfreundlich und sicher.
          </p>
        </div>

        {/* Content Block */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600 select-text">
          
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              1. Datenschutz auf einen Blick
            </h2>
            <p className="mb-3">
              Der Schutz Ihrer persönlichen Daten ist uns ein elementares Anliegen. DriveDeck ist nach dem Prinzip der <strong>100% serverlosen Architektur ("Serverless Client-Side SPA")</strong> konzipiert und implementiert.
            </p>
            <p className="mb-3">
              Das bedeutet konkret: <strong>Wir betreiben keine eigenen Backend-Server, Cloud-Datenbanken oder Tracking-Systeme für Ihre Notizen oder Workspace-Inhalte.</strong>
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 text-xs text-emerald-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Wo liegen Ihre Daten?</span>
              </div>
              <p>
                Sämtliche Arbeitsfortschritte, Texte, Fotos, Termine und Notizblöcke verbleiben ausschließlich an zwei sicheren Orten, die unter Ihrer alleinigen Kontrolle stehen:
              </p>
              <ul className="list-disc pl-4 space-y-1 mt-1 font-mono text-[11px]">
                <li><strong>Local Browser Sandbox:</strong> Gesichert im sandboxed Offline-Speicher (IndexedDB) Ihres Browsers.</li>
                <li><strong>Ihr Google Drive:</strong> Direkt synchronisiert in Ihrem privaten, persönlichen Google Cloud-Speicherkonto.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              2. Verantwortliche Stelle
            </h2>
            <p>
              Verantwortlicher für die Datenverarbeitung im Sinne der EU-Datenschutz-Grundverordnung (DSGVO) sowie des Schweizer Bundesgesetzes über den Datenschutz (DSG) ist:
            </p>
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 font-sans text-xs text-slate-700 leading-relaxed font-medium">
              <span className="font-extrabold text-slate-900 font-sans">Hansjürg Wüthrich</span><br />
              Obermülistrasse 21<br />
              8320 Fehraltorf<br />
              Schweiz<br />
              <span className="flex items-center gap-1.5 mt-2 text-sky-600">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:hj.wuethrich@gmail.com" className="hover:underline font-semibold font-mono">hj.wuethrich@gmail.com</a>
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              3. Google API Services - Datenzugriff &amp; Datennutzung (User Data Policy Disclosures)
            </h2>
            <p>
              DriveDeck bietet Ihnen die Möglichkeit, eine direkte, clientseitige Verbindung zu Ihrem persönlichen Google-Konto herzustellen. Zur Gewährleistung maximaler Transparenz und Einhaltung der Google-Sicherheitsvorgaben dokumentieren wir hiermit präzise den Datenzugriff und die Datennutzung unserer Anwendung:
            </p>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                  <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                  🔑 Datenzugriff (Data Accessed)
                </h3>
                <p className="text-xs text-slate-605 pl-3">
                  Unsere Anwendung greift unter Verwendung offizieller Google APIs auf folgende spezifische Nutzerdaten Ihres Google-Kontos zu, sofern Sie dem über den OAuth-Zustimmungsbildschirm zustimmen:
                </p>
                <ul className="list-disc pl-7 text-xs text-slate-605 space-y-1 font-sans">
                  <li><strong>Dateien &amp; Ordner (Google Drive):</strong> Metadaten und Medieninhalte (wie Fotos, Videos, Dokumente oder JSON-Notizdateien), die Sie gezielt über den Google Picker auswählen oder die im passenden App-Anwendungsordner liegen.</li>
                  <li><strong>Kalendertermine (Google Calendar):</strong> Bevorstehende Termininformationen (Titel, Start-/Endzeit, Beschreibungen) aus den von Ihnen ausgewählten Google Kalendern.</li>
                  <li><strong>Nutzerprofil &amp; Identität (Google Auth):</strong> Ihre primäre Google E-Mail-Adresse und Profilinformationen zur Benutzerauthentifizierung und Personalisierung Ihres lokalen Workspace.</li>
                </ul>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                  <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                  🔄 Datennutzung &amp; -verarbeitung (Data Usage &amp; Handling)
                </h3>
                <p className="text-xs text-slate-605 pl-3">
                  Jegliche abgerufene Nutzerdaten werden ausschließlich im Browser des Nutzers verarbeitet. Es findet eine streng zweckgebundene Verwendung statt:
                </p>
                <ul className="list-disc pl-7 text-xs text-slate-605 space-y-1 font-sans">
                  <li><strong>Zweck der Kalenderdaten:</strong> Synchronisation Ihrer nächsten Termine zur direkten Visualisierung innerhalb des lokalen Kalender-Widgets Ihres Dashboards.</li>
                  <li><strong>Zweck der Google Drive Daten:</strong> Speicherung, strukturiertes Lesen und automatisches Cloud-Backup Ihrer erstellten Alben, Notizen, Vorlagen und Aufgaben-Karten. Die App liest oder manipuliert niemals Dateien außerhalb der App-Sandbox oder des vom Benutzer importierten Medienmaterials im Google Picker.</li>
                  <li><strong>Zweck der Nutzerprofil-Daten:</strong> Sichere Authentifizierung und Anzeige Ihres Benutzerprofils in der Anwendung mittels der geschützten Firebase Authentication API.</li>
                </ul>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3.5">
                <h3 className="text-xs font-bold text-slate-905 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                  🔒 Datenspeicherung &amp; Drittweitergabe (Data Storage &amp; Sharing)
                </h3>
                <ul className="list-disc pl-7 text-xs text-slate-605 space-y-1 font-sans">
                  <li><strong>Keine Drittserver-Speicherung:</strong> DriveDeck betreibt keine eigenen Backend-Server und speichert zu keinem Zeitpunkt Google-Nutzerdaten oder persönliche Inhalte in externen Datenbanken ab.</li>
                  <li><strong>Keine Weitergabe / Kein Verkauf:</strong> Ihre Google-Nutzerdaten werden von uns niemals an Dritte weitergeleitet, für Werbekampagnen missbraucht, zu Analyse-Zwecken transferiert oder zum Training von KI-Modellen herangezogen.</li>
                  <li><strong>Verschlüsselte Authentifizierungstoken:</strong> Ihre Autorisierungs-Token verbleiben verschlüsselt im geschützten sandboxed Browserspeicher (IndexedDB/SessionStorage) Ihres Endgeräts.</li>
                </ul>
              </div>

              <div className="border-t border-sky-150 bg-sky-50/75 rounded-lg p-3.5 mt-2 text-xs text-sky-900 space-y-1.5">
                <p className="font-bold text-[10px] text-sky-850 uppercase tracking-wide">
                  Einhaltung der Google-Nutzerdatenrichtlinien (Google API Services User Data Policy)
                </p>
                <p className="italic text-[11px] leading-relaxed border-l-2 border-sky-305 pl-3 text-sky-850 font-sans">
                  "DriveDeck\'s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements."
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              4. Detaillierte Auflistung der OAuth-Scopes &amp; Berechtigungen (Requested Scopes)
            </h2>
            <p>
              Je nachdem, welche Widgets und Features Sie in Ihrem Dashboard aktivieren, erfragt die Anwendung Freigaben für folgende Google-OAuth-Scopes:
            </p>
            <ul className="space-y-2.5 bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700">
              <li className="flex items-start gap-2 border-b border-slate-100 pb-2">
                <span className="font-bold text-sky-600 select-none">✓</span>
                <div>
                  <strong className="text-slate-800 block">.../auth/drive.file</strong>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5">Ermöglicht das automatische Abspeichern und Einlesen Ihrer Notizblöcke, Templates und Alben im standardisierten, offenen JSON-Format direkt auf Ihrer Google Drive-Ablage.</span>
                </div>
              </li>
              <li className="flex items-start gap-2 border-b border-slate-100 pb-2">
                <span className="font-bold text-sky-600 select-none">✓</span>
                <div>
                  <strong className="text-slate-800 block">.../auth/drive.appdata</strong>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5 animate-pulse">Erlaubt das Ablegen kleinerer Konfigurationsdaten (wie z.B. Favoriten oder eingestellte Seiten-Sortierungen) in einem geschützten Anwendungsordner, um Ihren Workspace geräteübergreifend anzupassen.</span>
                </div>
              </li>
              <li className="flex items-start gap-2 border-b border-slate-100 pb-2">
                <span className="font-bold text-sky-600 select-none">✓</span>
                <div>
                  <strong className="text-slate-800 block">.../auth/calendar.readonly</strong>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5 font-sans">Liest anstehende Google Kalendertermine aus, um diese in Ihrem Desktop-Info-Widget anzuzeigen. Es werden niemals Kalendereinträge modifiziert oder geteilt.</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-sky-600 select-none">✓</span>
                <div>
                  <strong className="text-slate-800 block">.../auth/tasks</strong>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5 font-sans font-mono">Erlaubt das optionale direkte Verwalten von fälligen To-Dos im Task-Management-Widget von DriveDeck, sofern im Consent-Screen selektiert. Alle Aufgabenlisten verbleiben 100% lokal oder in Ihrer Drive-Datei.</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              5. Keine Zahlungsdienstleister &amp; Keine Gebühren
            </h2>
            <p>
              DriveDeck bindet keinerlei externe Zahlungsdienstleister oder Checkout-Schnittstellen (wie z.B. Stripe oder PayPal) ein. Die Applikation ist vollkommen kostenfrei nutzbar. Es werden zu keinem Zeitpunkt finanzielle Transaktionen, Bankverbindungen oder Kreditkartendaten erfasst oder verarbeitet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              6. Ihre gesetzlichen Rechte
            </h2>
            <p>
              Nach der DSGVO und dem Schweizer Datenschutzgesetz haben Sie das Recht auf unentgeltliche Auskunft über Herkunft, Berichtigung, Sperrung oder Löschung Ihrer Daten.
            </p>
            <p className="bg-sky-50/50 border border-sky-100/70 rounded-lg p-3.5 text-xs text-slate-600">
              Da wir absichtlich <strong>keine personenbezogenen Daten auf eigenen Servern vorhalten oder erfassen</strong>, können Sie all Ihre Löschrechte autonom und sekundenschnell direkt im Webbrowser vollziehen. Gehen Sie dazu in Ihre Google Sicherheitseinstellungen und widerrufen Sie die Anwendungsberechtigungen von DriveDeck, oder löschen Sie Ihre Browserdaten respektive das IndexedDB-Volumen der Seite in den DevTools.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-6">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              7. Absolute Datenhoheit &amp; "Kein Lock-In" Garantie
            </h2>
            <p>
              Weil uns Open-Data-Prinzipien am Herzen liegen, versprechen wir Ihnen die ultimative Unabhängigkeit:
            </p>
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <p>
                <strong>Unabhängig von der Plattform:</strong> Selbst im theoretisch schlechtesten Fall einer plötzlichen oder dauerhaften Abschaltung dieser Webseite, können Sie jederzeit über Ihren gewohnten Google Drive Account direkt auf alle Rohdaten (.json Synchronisationsdateien) zugreifen.
              </p>
              <p>
                Es findet <strong>kein Lock-In</strong> statt. Sie können Ihre Notizen und Alben jederzeit via Google-Standard-Tools (z.B. Google Takeout) oder mittels lokaler Exporte sichern und in andere Systeme überführen. Ein digitaler Verlust Ihrer Arbeitsleistungen ist dadurch technisch absolut unmöglich.
              </p>
            </div>
          </section>

        </div>

        {/* Footer actions of page */}
        <div className="border-t border-slate-200 mt-12 pt-8 flex justify-center">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs cursor-pointer shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('landing.footer_terms_back')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
