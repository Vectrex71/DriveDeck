/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Cloud, 
  CloudOff, 
  Check, 
  Sparkles, 
  Shield,
  HelpCircle,
  ExternalLink,
  Info,
  Database,
  Download,
  Bell,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getAllPages } from '../lib/db';
import { useLanguage } from '../lib/LanguageContext';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  playNotificationSound, 
  showSystemNotification 
} from '../lib/notificationService';

interface SettingsPageProps {
  user: any;
  token: string | null;
  syncStatus: 'offline' | 'syncing' | 'synced' | 'error';
  onConnectDrive: (method?: 'popup' | 'redirect') => Promise<void>;
  onDisconnectDrive: () => Promise<void>;
}

export default function SettingsPage({
  user,
  token,
  syncStatus,
  onConnectDrive,
  onDisconnectDrive,
}: SettingsPageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [notificationPerm, setNotificationPerm] = useState<string>(() => getNotificationPermission());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('drivedeck_tasks_sound') !== 'false';
  });
  const [testSent, setTestSent] = useState(false);

  const handleRequestPush = async () => {
    const res = await requestNotificationPermission();
    setNotificationPerm(res);
  };

  const handleSendTestNotification = () => {
    playNotificationSound();
    showSystemNotification(
      language === 'de' ? '🔔 DriveDeck Test-Erinnerung' : '🔔 DriveDeck Test Reminder',
      {
        body: language === 'de' 
          ? 'Super! Push-Benachrichtigungen für Aufgaben & Kanban funktionieren einwandfrei.'
          : 'Great! Push notifications for Tasks & Kanban are working smoothly.'
      }
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('drivedeck_tasks_sound', String(next));
    if (next) playNotificationSound();
  };

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
      alert(language === 'de' ? 'Backup fehlgeschlagen: ' + error : 'Backup failed: ' + error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-300 text-left">
      {/* Page Header */}
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-100">
        <div className="p-2 bg-sky-500/10 rounded-lg text-[#0288D1]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {language === 'de' ? 'Profil & Einstellungen' : 'Profile & Settings'}
          </h1>
          <p className="text-xs text-slate-450 font-medium">
            {language === 'de' ? 'Verwalte dein Konto, die Google Drive-Verbindung und deine Einstellungen' : 'Configure your account, cloud drive sync, and workspace settings'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Quick Profile Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
              {language === 'de' ? 'Mein Profil' : 'My Account'}
            </h2>
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
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border border-white rounded-full" title="Connected to Google" />
                )}
              </div>
              
              <span className="font-bold text-slate-800 text-sm max-w-full truncate">
                {user?.displayName || (language === 'de' ? 'DriveDeck Nutzer' : 'DriveDeck Master')}
              </span>
              <span className="text-xs text-slate-450 mb-2 max-w-full truncate">
                {user?.email || 'lokaler_modus@drivedeck.internal'}
              </span>

              <span className="inline-flex items-center gap-1 mb-3 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-black rounded-full uppercase tracking-wider shadow-3xs">
                ✨ {language === 'de' ? '100% Kostenlos' : '100% Free'}
              </span>

              <div className="w-full pt-3.5 border-t border-slate-100 text-left space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">{language === 'de' ? 'Sitzungstyp:' : 'Sign-in state:'}</span>
                  <span className="font-bold text-slate-700">
                    {token ? 'Google Account' : (language === 'de' ? 'Lokale Sandbox' : 'Local Sandbox')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">{language === 'de' ? 'Konto-Status:' : 'Account Tier:'}</span>
                  <span className="font-bold text-emerald-700">
                    {language === 'de' ? '100% Kostenlos & Unbegrenzt' : '100% Free & Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">{language === 'de' ? 'Synchronisierung:' : 'Cloud Synced:'}</span>
                  <span className={`font-bold ${
                    syncStatus === 'synced' ? 'text-emerald-605' :
                    syncStatus === 'syncing' ? 'text-sky-600 animate-pulse' :
                    syncStatus === 'error' ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    {syncStatus === 'synced' && (language === 'de' ? 'Aktiv / Aktuell' : 'Active / Up to date')}
                    {syncStatus === 'syncing' && (language === 'de' ? 'In Arbeit...' : 'Syncing...')}
                    {syncStatus === 'error' && (language === 'de' ? 'Sync-Fehler' : 'Sync error')}
                    {syncStatus === 'offline' && (language === 'de' ? 'Nur lokal (Inaktiv)' : 'Offline storage')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Language Selector block */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'de' ? 'Sprachauswahl' : 'Language Selection'}
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              {language === 'de' ? 'Wähle deine bevorzugte Sprache für die Benutzeroberfläche:' : 'Configure your language locale preferred for the app views:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLanguage('de')}
                className={`py-1.5 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  language === 'de' 
                    ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-300/30' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>🇩🇪</span>
                <span>DE</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`py-1.5 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  language === 'en' 
                    ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-300/30' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>{language === 'de' ? 'Sicherheit & Privatsphäre' : 'Security & Privacy'}</span>
            </h3>
            <p className="text-[11px] text-slate-505 leading-relaxed font-sans">
              {language === 'de' 
                ? 'Deine Daten verlassen deinen Browser nie zu fremden Servern. Jegliche Daten-Synchronisation verläuft direkt und verschlüsselt zwischen diesem Browser und deinem persönlichen, privaten Google Drive App-Ordner.'
                : 'Your document logs and cards never visit our analytics servers. Synchronization process proceeds encrypted strictly between this browser instance and your secure Google Drive Storage sandbox.'}
            </p>
          </div>
        </div>

        {/* Right Column: Google Drive & Storage Options */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Cloud Synchronization Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-md ${token ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {token ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{language === 'de' ? 'Google Drive Cloud-Anbindung' : 'Google Drive Backup Sync'}</h3>
              </div>
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                token ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200/60'
              }`}>
                {token ? (language === 'de' ? 'Verbunden' : 'Linked') : (language === 'de' ? 'Lokal / Offline' : 'Offline Mode')}
              </span>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              {token ? (
                <span>
                  {language === 'de' 
                    ? `Dein Desktop ist mit deinem Google Drive (E-Mail: ${user?.email}) gekoppelt. Alle Haftnotizen, Aufgabenlisten und benutzerdefinierten Dateien werden sicher im Hintergrund hochgeladen.`
                    : `Your workspace node is authorized to Google Drive (Account: ${user?.email}). Stickies, note pages, and custom folders synchronize to safety now.`}
                </span>
              ) : (
                <span>
                  {language === 'de'
                    ? 'Koppele die Anwendung mit deinem Google Drive. Dadurch werden Haftnotizen, Textdokumente und Layouts völlig geräteübergreifend synchronisiert. Deine Passwörter sind geschützt – DriveDeck nutzt eine abgeschottete Sandbox.'
                    : 'Connect the application structure to your personal Google Drive account. Your notes, checklist decks, and canvas parameters adapt instantly across screens without passing through any third-party app servers.'}
                </span>
              )}
            </p>

            {token ? (
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-[11px] leading-relaxed text-emerald-800">
                  <p className="font-bold">☁️ {language === 'de' ? 'Cloud-Speicher aktiv' : 'Cloud Storage Integration Approved'}</p>
                  <p className="opacity-90">{language === 'de' ? 'Sichere Verbindung besteht. Keine unbeteiligten Server haben Einsicht.' : 'Your notes link safely direct to Google quota servers. 100% cloud-secure.'}</p>
                </div>
                <button
                  onClick={onDisconnectDrive}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-bold rounded cursor-pointer transition-colors shrink-0"
                >
                  {language === 'de' ? 'Verbindung trennen' : 'Disconnect'}
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="text-[11px] leading-normal text-slate-605 max-w-md">
                    <p className="font-bold">🌐 {language === 'de' ? 'Lokale Sandbox active' : 'Local Sandboxed Offline Run'}</p>
                    <p className="opacity-90">{language === 'de' ? 'Deine Notizen werden derzeit in der lokalen Browser-Datenbank gespeichert. Melde dich bei Google an, um Backups zu starten.' : 'Your data resides locally on browser caches right now. Connect your Google account to secure cloud-level preservation.'}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 font-sans">
                    <button
                      onClick={() => onConnectDrive('popup')}
                      className="px-3.5 py-1.5 bg-[#0288D1] hover:bg-[#0277bd] text-white text-xs font-bold rounded cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{language === 'de' ? 'Drive verbinden' : 'Link Google Drive'}</span>
                    </button>
                    <button
                      onClick={() => onConnectDrive('redirect')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-505 hover:text-slate-700 text-[10px] font-medium rounded cursor-pointer transition-colors text-center font-sans"
                    >
                      {language === 'de' ? 'Verzeichnis-Redirect (Alternativ)' : 'Manual Redirect (Alternative)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 100% Free & Unlimited Workspace Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs overflow-hidden relative">
            <div className="flex items-center space-x-2 mb-3.5">
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {language === 'de' ? '100% Kostenlos & Unbegrenzt' : '100% Free & Unlimited Access'}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {language === 'de' ? 'Dauerhaft Gratis' : 'Forever Free'}
              </span>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              {language === 'de' 
                ? 'DriveDeck ist vollkommen kostenlos nutzbar – ohne Abonnements, ohne Testphasen-Beschränkungen und ohne versteckte Gebühren. Sämtliche Synchronisierungen, Kanban-Boards, Sprachnotizen und Google Tasks stehen dir dauerhaft und unbegrenzt zur Verfügung.' 
                : 'DriveDeck is 100% free forever – no subscriptions, no evaluation expirations, and no hidden fees. All real-time synchronizations, Kanban boards, audio dictations, and Google Tasks features are completely unlocked.'}
            </p>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3.5 space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'de' ? 'Unbegrenzte Seiten, Notizen, Alben und Aufgaben' : 'Unlimited pages, notes, albums, and task lists'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'de' ? 'Vollständige Google Drive Synchronisation (Bring Your Own Storage)' : 'Seamless Google Drive synchronization (Bring Your Own Storage)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'de' ? '100% Datenschutz: Keine Drittserver, keine Werbung, kein Datenverkauf' : '100% Privacy: Zero third-party databases, no tracking, no ads'}</span>
              </div>
            </div>
          </div>

          {/* Push Notifications & Task Reminders Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'de' ? 'Push-Benachrichtigungen & Aufgaben-Erinnerungen' : 'Push Notifications & Task Reminders'}
                </h3>
              </div>
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${
                notificationPerm === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : notificationPerm === 'denied'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {notificationPerm === 'granted'
                  ? (language === 'de' ? 'Aktiv 🔔' : 'Active 🔔')
                  : notificationPerm === 'denied'
                  ? (language === 'de' ? 'Blockiert ❌' : 'Blocked ❌')
                  : (language === 'de' ? 'Inaktiv' : 'Inactive')}
              </span>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              {language === 'de'
                ? 'Erhalte rechtzeitige System-Erinnerungen für fällige Aufgaben (Google Tasks) und Kanban-Karten mit Fälligkeitsdatum & Uhrzeit – auch wenn du in einem anderen Tab oder Fenster arbeitest.'
                : 'Receive timely desktop reminders for due tasks (Google Tasks) and Kanban cards with scheduled dates & times – even when working in another tab.'}
            </p>

            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-[11px] leading-relaxed text-slate-600">
                  <p className="font-bold text-slate-800">
                    {notificationPerm === 'granted'
                      ? (language === 'de' ? '✅ Browser-Benachrichtigungen sind aktiv' : '✅ Browser push notifications enabled')
                      : (language === 'de' ? '🔔 Benachrichtigungen im Browser erlauben' : '🔔 Allow desktop notifications in browser')}
                  </p>
                  <p className="opacity-90">
                    {notificationPerm === 'granted'
                      ? (language === 'de' ? 'DriveDeck erinnert dich automatisch bei Fälligkeit.' : 'DriveDeck will notify you automatically when due.')
                      : (language === 'de' ? 'Klicke auf den Button, um die Systemberechtigung im Browser anzufordern.' : 'Click to prompt browser permission for notifications.')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notificationPerm !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestPush}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{language === 'de' ? 'Aktivieren' : 'Enable'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{testSent ? (language === 'de' ? 'Gesendet! ✅' : 'Sent! ✅') : (language === 'de' ? 'Test senden 🔔' : 'Send Test 🔔')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sound toggle row */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-sky-600 shrink-0" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-medium text-slate-700">
                    {language === 'de' ? 'Signalton bei Fälligkeit abspielen' : 'Play audio chime on due reminders'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? 'bg-sky-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Data Portability Section */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-sky-50 text-[#0288D1]">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{language === 'de' ? 'Daten-Backup & Portabilität' : 'Data Preservation & Security Backup'}</h3>
              </div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                100% Exportable
              </span>
            </div>

            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              {language === 'de' 
                ? 'Deine Notizen, Alben, Haftnotizen und Aufgabenlisten gehören ausschließlich dir. Da alle Daten dezentral abgelegt sind, kannst du sie hier jederzeit vollständig in einem standardisierten, menschenlesbaren Format herunterladen.'
                : 'Your notebooks, customized layouts, sticker boards, and planner tasks belong strictly on your storage nodes. Download them here in standard open JSON layout anytime. Zero locker lock-in.'}
            </p>

            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="text-[11px] leading-relaxed text-slate-606 max-w-md">
                <p className="font-bold">📥 {language === 'de' ? 'Vollständiges Rohdaten-Backup' : 'Assemble Raw Data Core'}</p>
                <p className="opacity-90">{language === 'de' ? 'Sichert all deine Seiten, Alben, Skizzen und Aufgaben in einer einzigen JSON-Datei.' : 'Compiles all note pages, albums, sticky notes, and checklist boards into a structured JSON file.'}</p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full sm:w-auto px-4 py-2.5 bg-sky-650 hover:bg-sky-700 text-white text-xs font-bold rounded cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 font-sans"
              >
                {isExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                    <span>{language === 'de' ? 'Lese Daten...' : 'Compiling...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'de' ? 'Vollständiges Backup (JSON)' : 'Full Backup (JSON)'}</span>
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
