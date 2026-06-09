import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Cloud, 
  CloudOff, 
  CreditCard, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink,
  Info,
  Database,
  Download
} from 'lucide-react';
import { getAllPages } from '../lib/db';

interface SettingsPageProps {
  user: any;
  token: string | null;
  syncStatus: 'offline' | 'syncing' | 'synced' | 'error';
  onConnectDrive: (method?: 'popup' | 'redirect') => Promise<void>;
  onDisconnectDrive: () => Promise<void>;
  isPremium: boolean;
  onResetPremium: () => void;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
}

export default function SettingsPage({
  user,
  token,
  syncStatus,
  onConnectDrive,
  onDisconnectDrive,
  isPremium,
  onResetPremium,
  trialDaysLeft,
  isTrialExpired,
}: SettingsPageProps) {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // 1. Get all pages from IndexedDB
      const pages = await getAllPages();

      // 2. Fetch localStorage items
      const albumsData = localStorage.getItem('drivedeck_albums');
      const stickyNotesData = localStorage.getItem('drivedeck_sticky_notes');
      const taskListsData = localStorage.getItem('drivedeck_task_lists');
      const tasksData = localStorage.getItem('drivedeck_tasks_data');

      const albums = albumsData ? JSON.parse(albumsData) : [];
      const stickyNotes = stickyNotesData ? JSON.parse(stickyNotesData) : [];
      const taskLists = taskListsData ? JSON.parse(taskListsData) : [];
      const tasks = tasksData ? JSON.parse(tasksData) : [];

      // 3. Assemble backup payload
      const backup = {
        app: 'DriveDeck',
        exportedAt: new Date().toISOString(),
        pages,
        albums,
        stickyNotes,
        taskLists,
        tasks
      };

      // 4. Create blob and download
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `drivedeck_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup fehlgeschlagen: ' + error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          email: user?.email || '',
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Fehler beim Erstellen der Stripe Checkout-Sitzung.');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Keine Checkout-URL vom Server erhalten.');
      }
    } catch (error: any) {
      console.error('[Stripe Client Error]:', error);
      setStripeError(error?.message || 'Verbindung mit Stripe fehlgeschlagen.');
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-100">
        <div className="p-2 bg-sky-500/10 rounded-lg text-[#0288D1]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Profil &amp; Einstellungen</h1>
          <p className="text-xs text-notion-secondary font-medium">Verwalte dein Konto, die Google Drive-Verbindung und Premium-Dienste</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Quick Profile Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Mein Profil</h2>
            <div className="flex flex-col items-center text-center">
              <div className="relative w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 overflow-hidden shadow-2xs">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Nutzer Profilbild" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
                {token && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-50 border-2 border-white rounded-full" title="Mit Google verbunden" />
                )}
              </div>
              
              <span className="font-bold text-slate-800 text-sm max-w-full truncate">
                {user?.displayName || 'DriveDeck Nutzer'}
              </span>
              <span className="text-xs text-slate-400 mb-4 max-w-full truncate">
                {user?.email || 'lokaler_modus@drivedeck.internal'}
              </span>

              <div className="w-full pt-3.5 border-t border-slate-100 text-left space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Sitzungstyp:</span>
                  <span className="font-bold text-slate-700">
                    {token ? 'Google Cloud' : 'Lokale Sandbox'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Synchronisierung:</span>
                  <span className={`font-bold ${
                    syncStatus === 'synced' ? 'text-emerald-600' :
                    syncStatus === 'syncing' ? 'text-sky-600 animate-pulse' :
                    syncStatus === 'error' ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    {syncStatus === 'synced' && 'Aktiv / Aktuell'}
                    {syncStatus === 'syncing' && 'In Arbeit...'}
                    {syncStatus === 'error' && 'Sync-Fehler'}
                    {syncStatus === 'offline' && 'Nur lokal (Inaktiv)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Sicherheit &amp; Privatsphäre</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Deine Daten verlassen deinen Browser nie zu fremden Servern. Jegliche Daten-Synchronisation verläuft direkt und verschlüsselt zwischen diesem Browser und deinem persönlichen, privaten Google Drive App-Ordner.
            </p>
          </div>
        </div>

        {/* Right Column: Google Drive & Stripe Options */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Cloud Synchronization Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-md ${token ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {token ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Google Drive Cloud-Anbindung</h3>
              </div>
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                token ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200/60'
              }`}>
                {token ? 'Verbunden' : 'Lokal / Offline'}
              </span>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              {token ? (
                <span>
                  Dein Desktop ist mit deinem Google Drive (E-Mail: <strong>{user?.email}</strong>) gekoppelt. Alle Haftnotizen, Aufgabenlisten und benutzerdefinierten Dateien werden sicher im Hintergrund hochgeladen.
                </span>
              ) : (
                <span>
                  Koppele die Anwendung mit deinem Google Drive. Dadurch werden Haftnotizen, Textdokumente und Layouts völlig geräteübergreifend synchronisiert. Deine Passwörter oder sonstigen Dateien sind geschützt – DriveDeck nutzt ausschließlich einen abgeschotteten Anwendungsordner (appDataFolder).
                </span>
              )}
            </p>

            {token ? (
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-[11px] leading-relaxed text-emerald-800">
                  <p className="font-bold">☁️ Cloud-Speicher aktiv</p>
                  <p className="opacity-90">Sichere Verbindung besteht. Keine unbeteiligten Server haben Einsicht oder Kontrolle.</p>
                </div>
                <button
                  onClick={onDisconnectDrive}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-bold rounded cursor-pointer transition-colors shrink-0"
                >
                  Verbindung trennen
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="text-[11px] leading-normal text-slate-600 max-w-md">
                    <p className="font-bold">🌐 Lokale Sandbox-Datei aktiv</p>
                    <p className="opacity-90">Deine Notizen werden derzeit in der lokalen Browser-Datenbank gespeichert. Melde dich bei Google an, um die automatische Sicherung zu starten.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => onConnectDrive('popup')}
                      className="px-3.5 py-1.5 bg-[#0288D1] hover:bg-[#0277bd] text-white text-xs font-bold rounded cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Drive verbinden</span>
                    </button>
                    <button
                      onClick={() => onConnectDrive('redirect')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700 text-[10px] font-medium rounded cursor-pointer transition-colors text-center"
                      title="Falls Popup-Blocker die Kopplung stören"
                    >
                      Verzeichnis-Redirect (Backup)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premium & Invoice Stripe Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs overflow-hidden relative">
            {/* Background Decorative Accent */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-sky-400/5 rounded-full filter blur-xl pointer-events-none" />

            <div className="flex items-center space-x-2 mb-3.5">
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Zahlungen &amp; Premium-Lizenzen (Stripe)</h3>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-5">
              Schalte fortgeschrittene Funktionen wie API-Organisation, Team-Vorschau und unbegrenzten Google Kalender Sync frei. Die Abrechnung erfolgt sicher über unseren Partner <strong>Stripe billing</strong>.
            </p>

            {user && !isPremium && (() => {
              const getTrialStyle = () => {
                if (isTrialExpired) {
                  return {
                    container: 'bg-rose-50 border-rose-200 text-rose-950',
                    iconColor: 'text-rose-600 animate-pulse',
                    badge: 'bg-rose-100 text-rose-900'
                  };
                }
                const days = trialDaysLeft ?? 90;
                if (days <= 30) {
                  return {
                    container: 'bg-rose-50/80 border-rose-200 text-rose-900',
                    iconColor: 'text-rose-600 animate-pulse',
                    badge: 'bg-rose-100/80 text-rose-950'
                  };
                }
                if (days <= 60) {
                  return {
                    container: 'bg-amber-50/80 border-amber-200 text-amber-900',
                    iconColor: 'text-amber-600',
                    badge: 'bg-amber-100 text-amber-950'
                  };
                }
                return {
                  container: 'bg-emerald-50/60 border-emerald-100/80 text-emerald-900',
                  iconColor: 'text-emerald-600',
                  badge: 'bg-emerald-100/80 text-emerald-950'
                };
              };

              const style = getTrialStyle();

              return (
                <div className={`p-4 rounded-lg mb-5 text-xs leading-relaxed border animate-in slide-in-from-top-3 duration-200 ${style.container}`}>
                  <div className="flex items-center gap-2 font-bold mb-1.5">
                    <Info className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
                    <span>{isTrialExpired ? 'Testphase abgelaufen (Hintergrund-Synchronisation pausiert)' : 'Kostenlose Testphase aktiv (3 Monate gratis)'}</span>
                  </div>
                  {isTrialExpired ? (
                    <p>
                      Deine 3-monatige Testphase ist leider abgelaufen. Die automatische Echtzeit-Synchronisation im Hintergrund zwischen deiner IndexedDB und Google Drive wird <strong>pausiert</strong>, bis du ein Abonnement aktivierst. Deine Notizen und Alben sind weiterhin zu 100% lokal im Browser abruf- und editierbar.
                    </p>
                  ) : (
                    <p>
                      Dir stehen die ersten 3 Monate vollkommen kostenlos zur Verfügung. Du hast aktuell noch <strong className={`font-extrabold px-1.5 py-0.5 rounded border border-black/5 ${style.badge}`}>{trialDaysLeft !== null ? `${trialDaysLeft} Tage` : '---'}</strong> übrig, in denen dein Google Drive vollautomatisch synchronisiert wird.
                    </p>
                  )}
                </div>
              );
            })()}

            {isPremium ? (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-4 mb-4 text-xs text-emerald-800 animate-in zoom-in-95 leading-relaxed">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Premium Plus freigeschaltet!</span>
                  </div>
                  <button
                    onClick={onResetPremium}
                    className="text-[10px] hover:underline text-slate-500 hover:text-rose-600 font-bold transition-all bg-slate-100 hover:bg-rose-50 border border-slate-200 px-2.5 py-1 rounded"
                    title="Premium-Status zum Testen zurücksetzen"
                  >
                    Status zurücksetzen
                  </button>
                </div>
                Deine Lizenz wurde erfolgreich mit deinem Google-Konto gekoppelt. Alle Teamfunktionen und Integrationsfeatures stehen dir in dieser Sitzung uneingeschränkt zur Verfügung. Vielen Dank für dein Vertrauen!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {/* Monats-Abo */}
                <div 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`border p-3.5 rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPlan === 'monthly' 
                      ? 'border-[#0288D1] bg-sky-50/10 ring-1 ring-[#0288D1]/30' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Monats-Abo</span>
                      {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 text-[#0288D1]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">Maximale Flexibilität. Monatlich kündbar, perfekt für den flexiblen Einsatz.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 self-start">4.90$<span className="text-[9px] font-normal text-slate-400"> / Monat</span></span>
                </div>

                {/* Jahres-Abo */}
                <div 
                  onClick={() => setSelectedPlan('yearly')}
                  className={`border p-3.5 rounded-lg cursor-pointer transition-all flex flex-col justify-between relative ${
                    selectedPlan === 'yearly' 
                      ? 'border-[#0288D1] bg-sky-50/10 ring-1 ring-[#0288D1]/30' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="absolute -top-2 right-2 bg-sky-500 text-white px-1.5 py-0.2 rounded-full text-[7.5px] font-bold uppercase tracking-wider shadow-xs animate-pulse">
                    Empfohlen
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-sky-600 uppercase font-bold tracking-wider flex items-center gap-0.5">
                        <span>Jahres-Abo</span>
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-current" />
                      </span>
                      {selectedPlan === 'yearly' && <Check className="w-3.5 h-3.5 text-[#0288D1]" />}
                    </div>
                    <div className="text-[8px] text-emerald-700 font-bold mb-1.5 bg-emerald-50 py-0.2 px-1 border border-emerald-100 rounded inline-block">
                      2 Monate kostenlos
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">Spare bares Geld gegenüber dem Monatsabo. Optimal für kontinuierliche Planung.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 self-start">49.00$<span className="text-[9px] font-normal text-slate-400"> / Jahr</span></span>
                </div>

                {/* Einmalkauf */}
                <div 
                  onClick={() => setSelectedPlan('lifetime')}
                  className={`border p-3.5 rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPlan === 'lifetime' 
                      ? 'border-[#0288D1] bg-sky-50/10 ring-1 ring-[#0288D1]/30' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Einmalkauf</span>
                      {selectedPlan === 'lifetime' && <Check className="w-3.5 h-3.5 text-[#0288D1]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">Einmal kaufen, immer nutzen. Inklusive aller zukünftigen Updates, ganz ohne Abo.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 self-start">139.00$<span className="text-[9px] font-normal text-slate-400"> / Lebenslang</span></span>
                </div>
              </div>
            )}

            {stripeError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-lg p-3 text-xs mb-4 font-sans text-left leading-relaxed">
                <span className="font-bold">Stripe Konfigurationsfehler:</span> {stripeError}
                <div className="mt-1.5 opacity-90 text-[11px] leading-normal font-medium bg-white/50 p-2 rounded border border-rose-150">
                  ⚠️ Um Stripe in deinem Workspace zu testen, musst du in den <strong>Einstellungen (Secrets panel)</strong> die folgenden Keys hinterlegen:
                  <ul className="list-disc pl-3 mt-1 space-y-0.5">
                    <li>`STRIPE_SECRET_KEY` (aus deinem Stripe-Dashboard)</li>
                    <li>`STRIPE_PRICE_MONTHLY` (z. B. price_1...)</li>
                    <li>`STRIPE_PRICE_YEARLY` (z. B. price_2...)</li>
                    <li>`STRIPE_PRICE_LIFETIME` (z. B. price_3...)</li>
                  </ul>
                </div>
              </div>
            )}

            {!isPremium && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Sichere Übertragung via Stripe billing</span>
                </div>
                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={stripeLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                      <span>Verbinde Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>Mit Stripe upgrade erhalten</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Backup & Data Portability Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-sky-50 text-[#0288D1]">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Daten-Backup & Portabilität</h3>
              </div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                100% Exportierbar
              </span>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              Deine Notizen, Alben, Haftnotizen und Aufgabenlisten gehören ausschließlich dir. Da alle Daten dezentral in deiner lokalen Browser-Datenbank (IndexedDB) und in deinem persönlichen Google Drive abgelegt sind, kannst du sie hier jederzeit vollständig in einem standardisierten, menschenlesbaren Format herunterladen (kein Lock-In).
            </p>

            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="text-[11px] leading-relaxed text-slate-600 max-w-md">
                <p className="font-bold">📥 Vollständige Rohdaten sichern</p>
                <p className="opacity-90">Sichert all deine Seiten, Strukturen, Alben und Aufgaben in einer einzigen strukturierten JSON-Datei, die universell importierbar ist.</p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {isExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                    <span>Lese Daten...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Vollständiges Backup (JSON)</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
