/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface TermsOfServicePageProps {
  onNavigate: (path: string) => void;
}

export default function TermsOfServicePage({ onNavigate }: TermsOfServicePageProps) {
  const { language, t } = useLanguage();

  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (language === 'en') {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-900 text-left">
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
              <Scale className="w-6 h-6" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold">Workspace Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last updated: June 10, 2026. Please read these terms carefully.
            </p>
          </div>

          {/* Content Block */}
          <div className="space-y-8 text-sm leading-relaxed text-slate-600 select-text">

            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                1. Scope &amp; Legal Relations
              </h2>
              <p className="mb-3">
                These conditions determine the legal relationship between you as an active subscriber and the private software project <strong>DriveDeck</strong> (represented by: Hansjürg Wüthrich, Fehraltorf, Switzerland).
              </p>
              <p className="mb-3">
                DriveDeck represents a client-side layout dashboard and note-editing workbench which uses your personal Google Drive storage space as a secure dezentralized asset storage node.
              </p>
              <p>
                By signing in using Google OAuth or visiting this landing domain, you agree to these legal conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                2. Explicit Dezentralized Serverless Principle
              </h2>
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 text-xs text-sky-900">
                <p className="font-bold mb-1.5 flex items-center gap-1.5 text-sky-800">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Sovereignty Over Your Cache</span>
                </p>
                <p className="leading-relaxed">
                  The subscriber notes that DriveDeck is built on serverless architectures. <strong>Your documents, credentials, and settings never pass through or are saved to primary server databases.</strong> Managing proper data exports and offline backups is the sole authority of the user. Only you own your drive.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                3. Access Status &amp; Interactive Nodes
              </h2>
              <p>
                To utilize the workspace features, an active Google Account is required. You represent that you will strictly comply with official Google Terms of Service and API security parameters as well.
              </p>
              <p>
                Any reverse engineering, automated API script hammering, or intentional denial-of-service attempts will lead to immediate cancellation of your client registration.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#34A853] rounded-full inline-block"></span>
                4. Free of Charge &amp; No Subscription Fees
              </h2>
              <p>
                DriveDeck is made available completely free of charge and ad-free. There are no subscriptions, no paywalls, and no recurring fees.
              </p>
              <p>
                All features, including real-time cloud background synchronization with your Google Drive and task workflows, are permanently accessible without payment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                5. Outage Warranties &amp; Liability Clauses
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-900 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span>Warranty Constraints (As-Is)</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-800">
                  DriveDeck serves client scripts on an "As-Is" and "As Available" basis. No warranties regarding constant, error-free API sync are promised.
                </p>
                <p className="text-xs leading-relaxed text-amber-800">
                  <strong>Service Lifespan:</strong> We preserve authorization to modify layouts, suspend sync workflows, or cancel deployment of the SPA.
                </p>
                <p className="text-xs leading-relaxed text-amber-800">
                  <strong>Loss of Materials:</strong> We bear no liability regarding folder data changes, lost client hours, or commercial damages. Because drive connections are direct to Google Cloud, we are technically incapable of destroying or accessing your personal workspace documents.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                6. Governing Jurisdiction Area
              </h2>
              <p>
                All legal differences resulting from these conditions are subjected to Switzerland\'s formal law structures.
              </p>
              <p>
                The exclusive courthouse is placed at the legal address of the software creator (<strong>Fehraltorf, Switzerland</strong>).
              </p>
            </section>

          </div>

          {/* Footer back button */}
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

  // Otherwise, default German layout
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
            <Scale className="w-6 h-6" />
            <span className="font-mono text-xs uppercase tracking-wider font-bold">Nutzungsvereinbarung</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Nutzungsbedingungen (Terms of Service)
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Letzte Aktualisierung: 10. Juni 2026. Bitte lesen Sie diese Bestimmungen sorgfältig durch.
          </p>
        </div>

        {/* Content Block */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600 select-text font-sans">

          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              1. Geltungsbereich &amp; Vertragsgegenstand
            </h2>
            <p className="mb-3">
              Diese Nutzungsbedingungen regeln das Rechtsverhältnis zwischen Ihnen als Nutzer und dem Softwareprojekt <strong>DriveDeck</strong> (vertretungsberechtigt: Hansjürg Wüthrich, Fehraltorf, Schweiz).
            </p>
            <p className="mb-3">
              Gegenstand der Software ist das Angebot einer Web-Applikation ("DriveDeck"), welche als hochpräzises, blockbasiertes Interface für die dezentrale Verwaltung von Notizblöcken, Fotos, Alben und Aufgaben auf Basis Ihres persönlichen Google Drives dient.
            </p>
            <p>
              Durch das Zugreifen auf unsere Webseite oder die Anmeldung mit Ihrem Google Drive willigen Sie in diese Nutzungsbedingungen rechtsverbindlich ein.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              2. 100% Serverloses Architektur-Prinzip (Wichtig)
            </h2>
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 text-xs text-sky-900">
              <p className="font-bold mb-1.5 flex items-center gap-1.5 text-sky-850">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Dezentrale Datenarchitektur</span>
              </p>
              <p className="leading-relaxed">
                Der Nutzer nimmt ausdrücklich zur Kenntnis, dass DriveDeck serverlos arbeitet. <strong>Ihre Daten verbleiben zu jeder Sekunde in Ihrem persönlichen Besitz (entweder in der lokalen IndexedDB-Datenbank Ihres Webbrowsers oder in Ihrem Google Drive).</strong> DriveDeck hostet keine eigenen Datenbanken für Ihre Arbeitsfortschritte. Ein Daten-Backup liegt daher zu 100% in der Eigenverantwortung des Nutzers.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              3. Nutzungsrechte &amp; Registrierung
            </h2>
            <p>
              Zur vollumfänglichen Nutzung von DriveDeck ist ein Google-Konto erforderlich. Sie verpflichten sich, im Rahmen der Google API Anforderungen, die Datenschutzbestimmungen der Google-Plattform ebenfalls einzuhalten. Sie sind dafür verantwortlich, Ihren Google Drive Zugriff ordnungsgemäß zu verwalten.
            </p>
            <p>
              Zulässig ist die Nutzung von DriveDeck ausschließlich nach den gesetzlich vorgeschriebenen Auflagen. Missbrauch des Angebots (wie z.B. Reverse Engineering oder automatisierte Denial-of-Service Attacken) ist strengstens untersagt und führt zum sofortigen Ausschluss.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              4. Kostenfreie Nutzung &amp; Keine Abonnements
            </h2>
            <p>
              DriveDeck wird dem Nutzer vollständig kostenlos und werbefrei zur Verfügung gestellt. Es fallen keinerlei Abonnements, Gebühren oder versteckte Kosten an.
            </p>
            <p>
              Sämtliche Funktionen, einschließlich der Echtzeit-Synchronisation mit Ihrem persönlichen Google Drive und der Aufgabenverwaltung, stehen Ihnen dauerhaft und uneingeschränkt kostenfrei zur Verfügung.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              5. Gewährleistung, Dienstausfall &amp; Haftungsausschluss
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-900 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-amber-805">
                <Scale className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <span>Haftungsausschluss &amp; Drittanbieter-Risiken</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-805">
                DriveDeck stellt den Dienst in der vorliegenden Form ("wie gesehen" / "as-is") zur Verfügung. Da DriveDeck ein unabhängiges Softwareprojekt ist, übernehmen wir keine Gewähr für die ständige, ununterbrochene Verfügbarkeit des Dienstes. 
              </p>
              <p className="text-xs leading-relaxed text-amber-805">
                <strong>Betriebsänderungen:</strong> Wir behalten uns das Recht vor, den Dienst und dessen Funktionalitäten jederzeit ohne Gestalt von Gründen anzupassen, zu pausieren oder vollständig einzustellen (beispielsweise bei unaufhaltsamen Änderungen externer APIs durch Google, im Krankheitsfall des Betreibers oder sonstigen unvorhersehbaren technischen Ereignissen).
              </p>
              <p className="text-xs leading-relaxed text-amber-805">
                <strong>Haftung für Schäden:</strong> Eine Haftung für Datenverlust, entgangenen Gewinn oder sonstige Begleit- und Folgeschäden, die aus der Nutzung oder Nichtnutzbarkeit des Workspace resultieren, wird im gesetzlich maximal zulässigen Maße ausgeschlossen. Da Ihre Daten ausschließlich in Ihrem privaten Google Drive liegen, ist ein Verlust oder Beschädigung durch Verschulden von uns technisch unmöglich.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              6. Anwendbares Recht &amp; Gerichtsstand
            </h2>
            <p>
              Für alle Streitigkeiten aus oder im Zusammenhang mit dieser Nutzungsvereinbarung gilt ausschließlich das materielle Recht der **Schweiz**.
            </p>
            <p>
              Ausschließlicher Gerichtsstand für sämtliche Streitigkeiten ist der Wohnsitz des Betreibers (<strong>8320 Fehraltorf, Schweiz</strong>).
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-6">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
              7. Salvatorische Klausel
            </h2>
            <p>
              Sollte eine Bestimmung dieser Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt. Die unwirksame Bestimmung ist durch eine rechtlich zulässige Regelung zu ersetzen, die dem wirtschaftlichen Zweck der ursprünglichen Regelung am nächsten kommt.
            </p>
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
