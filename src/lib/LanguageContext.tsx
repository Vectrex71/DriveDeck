import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'de' | 'en';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Comprehensive translation vocabulary
const translations: Record<Language, Record<string, string>> = {
  de: {
    // Common / Buttons
    'common.back': 'Zurück',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'common.close': 'Schließen',
    'common.add': 'Hinzufügen',
    'common.edit': 'Bearbeiten',
    'common.confirm': 'Bestätigen',
    'common.warning': 'Warnung',
    'common.active': 'Aktiv',
    'common.inactive': 'Inaktiv',
    'common.unnamed': 'Unbenannt',
    'common.search': 'Suchen...',
    'common.none': 'Keine',
    'common.uploading': 'Wird hochgeladen...',

    // Landing Page
    'landing.top_badge': 'Alle deine Notizen auf GDrive',
    'landing.hero_title': 'Willkommen bei DriveDeck',
    'landing.hero_subtitle': 'Das hochpräzise, blockbasierte Arbeitswerkzeug für Google Drive-Notizen. 100% datenschutzfreundlich, komplett offlinefähig und sicher im lokalen Browser persistiert.',
    'landing.btn_login': 'Mit Google anmelden',
    'landing.btn_redirect': 'Popup blockiert? Per Google-Weiterleitung (Redirect) anmelden',
    
    'landing.pitch_title': 'Was ist DriveDeck und wie funktioniert es?',
    'landing.pitch_subtitle': 'DriveDeck ist ein hocheffizienter Workspace, der deine privaten Notizen, Medien, Aufgaben und Kalendertermine an einem eleganten Ort zusammenfasst. Du behältst die absolute Kontrolleüber deine Daten:',
    
    'landing.pillar1_title': '1. Vollständig im Webbrowser',
    'landing.pillar1_desc': 'Die App läuft zu 100% in deinem Browser. Keine Installation notwendig, voll responsive auf Smartphones, Tablets und Desktops.',
    
    'landing.pillar2_title': '2. Es gibt keine DriveDeck-Server',
    'landing.pillar2_desc': 'Deine vertraulichen Inhalte werden nicht auf Servern von Drittanbietern gesichert. Keine unbefugte KI-Datenanalyse, kein Vendor Lock-in.',
    
    'landing.pillar3_title': '3. Dein Google Drive als Cloud-Ablage',
    'landing.pillar3_desc': 'Wir verbinden dich mit deinem Google Drive. Daten fließen verschlüsselt und direkt zwischen deinem Browser und deinem Speicher.',
    
    'landing.sec_features_title': 'Revolutionäre Bausteine für dein Dashboard',
    'landing.sec_features_subtitle': 'DriveDeck vereint das Beste aus textbasierten Editoren, Board-Systemen und Widgets, ohne die Nachteile herkömmlicher SaaS-Plattformen.',
    
    'landing.feat_editor_title': 'Blockbasierter Editor',
    'landing.feat_editor_desc': 'Schreibe Dokumente mit einem Slash-Command-Menü ähnlich wie Notion. Organisiere Text, Listen, Code-Snippets und bette Drive-Inhalte nahtlos ein.',
    
    'landing.feat_stickies_title': 'Flexible Haftnotizen',
    'landing.feat_stickies_desc': 'Halte flüchtige Gedanken auf bunten Haftnotizen fest. Pinne wichtige Notizen an, weise Schlagworte zu oder hänge Google Drive-Bilder an.',
    
    'landing.feat_tasks_title': 'Integrierter Task-Planer',
    'landing.feat_tasks_desc': 'Synchronisiere deine Google Tasks direkt auf deinem Dashboard. Organisiere Aufgabenlisten, Unteraufgaben, Prioritäten und Fälligkeiten im Handumdrehen.',
    
    'landing.feat_calendar_title': 'Google Kalender Widget',
    'landing.feat_calendar_desc': 'Verwalte deine anstehenden Termine in einer eleganten Monats- und Tagesansicht direkt neben deinen Notizblöcken.',
    
    'landing.feat_voice_title': 'Sprachaufzeichnungsgerät',
    'landing.feat_voice_desc': 'Nimm Sprachnotizen direkt auf der Seite auf. Der Editor wandelt diese in hochwertige MP3-Audiodateien um und sichert sie in deinem Google Drive.',
    
    'landing.feat_media_title': 'Sichere Medien-Galerien',
    'landing.feat_media_desc': 'Betrachte Deine in Google Drive gespeicherten Fotos und Videos in einem geschützten, responsive Player, ohne deine Privatsphäre zu kompromittieren.',

    'landing.sec_security_title': 'DSGVO und Privatsphäre auf neuem Standard',
    'landing.sec_security_subtitle': 'Herkömmliche Editoren speichern deine sensiblen geschäftlichen und privaten Notizen auf Servern von Drittanbietern. DriveDeck bricht mit diesem Modell auf revolutionäre Weise und setzt neue Maßstäbe bei DSGVO und Datenschutz:',
    'landing.sec_security_pill_bydesign': '🔒 Privacy by Design',
    'landing.sec_security_pill_eu': '🇩🇪 EU-Datenschutz',
    'landing.sec_security_pill_zero': '🛡️ Zero Server Storage',
    
    'landing.sec_security_bullet1': '<strong>Absolutes Lese- und Schreibprivileg:</strong> Deine Notizbücher liegen verschlüsselt im geschützten AppData-Ordner deines Google-Drive-Kontos. Niemand außer dir (und der App im Browser) kann diese Daten lesen.',
    'landing.sec_security_bullet2': '<strong>100% DSGVO-konform:</strong> Da keine Daten auf unseren Host-Systemen zwischengelagert werden, entfallen risikobehaftete Datenübermittlungen an Drittstaaten oder Werbenetzwerke.',
    'landing.sec_security_bullet3': '<strong>Offline-first Speicher:</strong> Selbst wenn du im Flugzeug oder ohne Empfang bist, arbeitet die App nahtlos auf Basis deiner lokalen IndexedDB weiter. Sobald du online bist, wird synchronisiert.',

    'landing.sec_faq_title': 'Häufig gestellte Fragen (FAQs)',
    'landing.sec_faq_q1': 'Was für ein Problem löst DriveDeck, das ich nicht auch mit anderen Notizen-Apps lösen könnte?',
    'landing.sec_faq_a1': 'Die allermeisten Notizen-Dienste (wie Notion, Evernote oder Obsidian-Sync) binden dich an ihre eigenen, proprietären Server. Deine sensiblen Gedanken liegen unverschlüsselt in deren Cloud-Datenbanken. DriveDeck löst das Problem des "Vendor Lock-in" und der Datenspionage: Du bekommst ein wunderschönes, schnelles Productivity-Dashboard, bei dem alle Daten zu 100% in deinem Besitz bleiben – gespeichert in deinem eigenen Google-Drive-Speicher und im lokalen Browser.',
    
    'landing.sec_faq_q2': 'Nutzt ihr Google Drive als Speicher? Ist das nicht ein Widerspruch bei der Privatsphäre?',
    'landing.sec_faq_a2': 'Das klingt im ersten Moment tatsächlich wie ein Paradoxon – ist aber in Wahrheit ein genialer Schachzug! Bei herkömmlichen Apps liegen deine Daten auf Servern eines kleinen Drittanbieters. Wenn dieser gehackt wird oder pleitegeht, bist du machtlos. DriveDeck betreibt absichtlich gar keine Server für deine Inhalte. Du nutzt Googles exzellente, billionenschwere Sicherheits-Infrastruktur als "dummen Cloud-Speicher", weigerst dich aber gleichzeitig, deine Daten an ein weiteres, neugieriges Drittanbieter-Backend auszuhändigen.',
    
    'landing.sec_faq_q3': 'Ist DriveDeck irgendwie mit Google verbandelt?',
    'landing.sec_faq_a3': 'Nein, absolut nicht! DriveDeck ist ein vollkommen eigenständiges, unabhängiges Softwareprojekt und steht in keinerlei geschäftlicher oder rechtlicher Verbindung zu Google LLC. Wir nutzen lediglich die offiziell bereitgestellten, offenen Programmierschnittstellen (Google APIs).',
    
    'landing.sec_faq_q4': 'Entspricht DriveDeck der DSGVO?',
    'landing.sec_faq_a4': 'Ja, zu 100% und im allerstrengsten Sinne (Privacy by Design)! Da wir keine eigenen Datenbankserver betreiben, können wir deine Daten gar nicht erst zweckentfremden, analysieren oder an Dritte weitergeben. Deine Daten befinden sich ausschließlich im lokalen Speicher deines Browsers (IndexedDB) und in deinem eigenen Google Drive.',
    
    'landing.sec_faq_q5': 'Wie komme ich an meine Daten, wenn ich den Dienst beenden will?',
    'landing.sec_faq_a5': 'Du behältst immer die volle Souveränität (kein Vendor Lock-in): Unter dem Einstellungsbereich kannst du mit einem Klick ein vollständiges Backup all deiner Alben, Seiten, Haftnotizen und Aufgabenlisten als standardisierte, menschenlesbare JSON-Datei herunterladen. Diese Daten kannst du frei konvertieren oder sichern.',

    'landing.footer_claim': 'DriveDeck – Bring Your Own Storage. 100% datenschutzkonforme Produktivität.',
    'landing.footer_impressum': 'Impressum',
    'landing.footer_privacy': 'Datenschutzerklärung',
    'landing.footer_terms': 'Nutzungsbedingungen',
    'landing.footer_terms_back': 'Zurück zur Startseite',
    
    // Sidebar Workspace
    'sidebar.title_workspace': 'Workspace',
    'sidebar.btn_new_page': 'Neue Seite',
    'sidebar.btn_new_album': 'Neues Album',
    'sidebar.lbl_pages': 'Seiten',
    'sidebar.lbl_albums': 'Alben & Ordner',
    'sidebar.lbl_trash': 'Mülleimer',
    'sidebar.lbl_favorites': 'Favoriten',
    'sidebar.lbl_sticky_notes': 'Haftnotiz-Board',
    'sidebar.lbl_media_lib': 'Medien-Galerie',
    'sidebar.lbl_settings': 'Einstellungen',
    'sidebar.lbl_sign_out': 'Abmelden',
    'sidebar.sync_synced': 'Drive synchronisiert',
    'sidebar.sync_syncing': 'Synchronisierung läuft...',
    'sidebar.sync_offline': 'Offline-Modus',
    'sidebar.sync_error': 'Synchronisationsfehler',
    'sidebar.sync_info_btn': 'Sync Details',

    // Editor & Page
    'editor.placeholder_title': 'Unbenannte Seite',
    'editor.placeholder_content': 'Schreibe "/" für Befehle oder Text hier...',
    'editor.slash_text': 'Text blockieren',
    'editor.slash_h1': 'Überschrift 1',
    'editor.slash_h2': 'Überschrift 2',
    'editor.slash_h3': 'Überschrift 3',
    'editor.slash_todo': 'To-Do Liste',
    'editor.slash_bullet': 'Aufzählungspunkte',
    'editor.slash_code': 'Code Snippet',
    'editor.slash_stickies': 'Haftnotiz-Board einbetten',
    'editor.slash_tasks': 'Google Aufgaben einbetten',
    'editor.slash_calendar': 'Google Kalender einbetten',
    'editor.slash_voice': 'Sprachaufnahme einbetten',
    'editor.slash_media': 'Sichere Medien-Galerie einbetten',
    'editor.page_delete_confirm_title': 'Seite löschen',
    'editor.page_delete_confirm_desc': 'Möchtest du diese Seite wirklich unwiderruflich löschen? Sie wird vom lokalen Speicher und Google Drive entfernt.',
    'editor.cover_add': 'Cover hinzufügen',
    'editor.cover_change': 'Cover ändern',
    'editor.cover_remove': 'Cover entfernen',
    'editor.icon_add': 'Icon hinzufügen',
    'editor.icon_change': 'Icon ändern',
    'editor.pinned_title': 'Wichtige Seiten',
    'editor.all_pages': 'Alle Seiten',

    // Sticky Notes Component
    'stickies.title': 'Buntes Haftnotiz-Board',
    'stickies.desc': 'Festhalten flüchtiger Gedanken. Automatisch gesichert.',
    'stickies.btn_new': 'Neue Notiz erstellen',
    'stickies.placeholder_title': 'Titel der Notiz...',
    'stickies.placeholder_content': 'Tippe deine Notiz hier ein...',
    'stickies.color_yellow': 'Gelb',
    'stickies.color_green': 'Grün',
    'stickies.color_blue': 'Blau',
    'stickies.color_pink': 'Pink',
    'stickies.color_purple': 'Violett',
    'stickies.color_orange': 'Orange',
    'stickies.color_gray': 'Grau',
    'stickies.pin': 'Anpinnen',
    'stickies.unpin': 'Vom Board lösen',
    'stickies.no_notes': 'Noch keine Haftnotizen vorhanden. Erstelle deine erste Notiz!',

    // Google Tasks Widget
    'tasks.title': 'Google Aufgabenplaner',
    'tasks.add_placeholder': 'Neue Aufgabe eingeben...',
    'tasks.no_tasks': 'Keine anstehenden Aufgaben in dieser Liste!',
    'tasks.subtasks': 'Unteraufgaben',
    'tasks.add_subtask_placeholder': 'Unteraufgabe hinzufügen...',
    'tasks.due_date': 'Fällig am',
    'tasks.recurrence': 'Wiederholung',
    'tasks.starred': 'Wichtig',
    'tasks.not_connected': 'Google Tasks ist nicht verbunden oder Autorisierung fehlt.',
    'tasks.connect_btn': 'Google Tasks verbinden',
    'tasks.lists_title': 'Aufgabenlisten',

    // Calendar Widget
    'calendar.title': 'Mein Google Planer',
    'calendar.not_connected': 'Google Kalender ist nicht verbunden.',
    'calendar.connect_btn': 'Kalender verbinden',
    'calendar.choose_active': 'Aktivierte Kalender auswählen',
    'calendar.weekday_mo': 'Mo',
    'calendar.weekday_tu': 'Di',
    'calendar.weekday_we': 'Mi',
    'calendar.weekday_th': 'Do',
    'calendar.weekday_fr': 'Fr',
    'calendar.weekday_sa': 'Sa',
    'calendar.weekday_su': 'So',
    'calendar.today': 'Heute',
    'calendar.all_day': 'Ganztägig',
    'calendar.no_events': 'Keine Termine für diesen Tag vorhanden.',

    // Voice Recorder Widget
    'voice.title': 'Sprachaufzeichnungsgerät',
    'voice.start': 'Aufnahme starten',
    'voice.stop': 'Aufnahme stoppen',
    'voice.cancel': 'Verwerfen',
    'voice.save_drive': 'In Google Drive speichern (MP3)',
    'voice.saving': 'Audiodatei wird verschlüsselt und hochgeladen...',
    'voice.playing': 'Abspielen',
    'voice.no_recording': 'Noch keine Aufnahme gemacht.',
    'voice.success_save': 'Sprachnotiz erfolgreich in Google Drive im Ordner "DriveDeck" gesichert.',

    // Media / Photos Widget
    'media.title': 'Privater Medienplayer & Alben',
    'media.choose_drive_btn': 'Bilder/Videos von Drive wählen',
    'media.no_media': 'Noch keine Bilder oder Videos in diesem Block. Wähle Medien aus deinem Google Drive aus.',
    'media.unsupported': 'Dieses Format wird im Browserplayer nicht unterstützt.',

    // Settings Page
    'settings.title': 'Profil & Einstellungen',
    'settings.subtitle': 'Verwalte dein Konto, die Google Drive-Verbindung und lokale Backups',
    'settings.section_profile': 'Mein Profil',
    'settings.section_drive': 'Google Drive Verbindung',
    'settings.drive_connected_desc': 'DriveDeck ist erfolgreich mit deinem Google Drive synchronisiert.',
    'settings.drive_disconnected_desc': 'Keine aktive Google Drive-Verbindung. Deine Notizen werden ausschließlich lokal im Browser gespeichert.',
    'settings.btn_connect': 'Google Drive verbinden',
    'settings.btn_disconnect': 'Verbindung trennen',
    
    'settings.section_subscription': '100% Kostenlos & Unbegrenzt',
    'settings.sub_active_premium': 'DriveDeck ist dauerhaft kostenlos. Alle Funktionen stehen dir uneingeschränkt zur Verfügung.',
    'settings.sub_trial': 'Kostenlose Vollversion',
    'settings.sub_trial_days': 'Unbegrenzt kostenlos nutzbar.',
    'settings.sub_trial_expired': 'DriveDeck ist komplett kostenlos.',
    'settings.btn_checkout': 'Kostenlos',
    'settings.plan_monthly': 'Kostenlos',
    'settings.plan_yearly': 'Kostenlos',
    'settings.plan_lifetime': 'Kostenlos',
    
    'settings.section_backup': 'Daten-Backup & Portabilität',
    'settings.backup_desc': 'Deine Daten gehören dir. Lade ein vollständiges, maschinenlesbares JSON-Backup all deiner Seiten, Notizen und Aufgaben herunter.',
    'settings.btn_export': 'Daten-Backup runterladen (JSON)',
    'settings.exporting': 'Backup wird erstellt...',

    'settings.section_danger': 'Gefahrenzone',
    'settings.danger_desc': 'Diese Aktion ist unwiderruflich. Löscht alle lokalen States (Seiten, Entwürfe und Tasks) im Browser-Speicher.',
    'settings.btn_reset': 'Lokalen Speicher komplett zurücksetzen',
    'settings.reset_confirm': 'Möchtest du wirklich alle lokalen Daten löschen? Dies betrifft nicht die Daten in deinem Google Drive, führt jedoch zum erneuten Ausloggen.',
    'settings.language_label': 'Sprachauswahl (Language)',
    'settings.language_desc': 'Wähle deine bevorzugte Anzeigesprache'
  },
  en: {
    // Common / Buttons
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.confirm': 'Confirm',
    'common.warning': 'Warning',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.unnamed': 'Unnamed',
    'common.search': 'Search...',
    'common.none': 'None',
    'common.uploading': 'Uploading...',

    // Landing Page
    'landing.top_badge': 'All your notes on GDrive',
    'landing.hero_title': 'Welcome to DriveDeck',
    'landing.hero_subtitle': 'The high-precision, block-based workspace for Google Drive notes. 100% privacy-friendly, fully offline-compatible, and safely persisted inside your local browser.',
    'landing.btn_login': 'Sign in with Google',
    'landing.btn_redirect': 'Popup blocked? Sign in using Google Redirect',
    
    'landing.pitch_title': 'What is DriveDeck and how does it work?',
    'landing.pitch_subtitle': 'DriveDeck is an elegant, high-efficiency workspace combining your private notes, media, tasks, and calendar events in one refined interface. You retain absolute data ownership:',
    
    'landing.pillar1_title': '1. Entirely in your Browser',
    'landing.pillar1_desc': 'The app runs 100% inside your Web Browser. No installation required, fully responsive on smartphones, tablets, and desktops.',
    
    'landing.pillar2_title': '2. Zero DriveDeck Cloud Servers',
    'landing.pillar2_desc': 'Your confidential contents are never saved on third-party servers. No unauthorized AI scanning or processing, absolute privacy.',
    
    'landing.pillar3_title': '3. Google Drive as Cloud Storage',
    'landing.pillar3_desc': 'We connect you directly to your own Google Drive. Information flows encrypted and directly between your browser and your storage account.',
    
    'landing.sec_features_title': 'Revolutionary Building Blocks for your Dashboard',
    'landing.sec_features_subtitle': 'DriveDeck integrates the best of text-based editing, card-style boards, and widgets without the disadvantages of traditional SaaS platforms.',
    
    'landing.feat_editor_title': 'Block-based Editor',
    'landing.feat_editor_desc': 'Write documents with a slash-command menu similar to Notion. Organize text, headers, checklists, code blocks, and embed Drive contents seamlessly.',
    
    'landing.feat_stickies_title': 'Flexible Sticky Notes',
    'landing.feat_stickies_desc': 'Capture fleeting ideas on colorful sticky notes. Pin important notes, assign tags, or link images from your Google Drive.',
    
    'landing.feat_tasks_title': 'Integrated Task Planner',
    'landing.feat_tasks_desc': 'Synchronize your Google Tasks directly on your dashboard. Organize tasks, subtasks, priorities, and due dates effortlessly.',
    
    'landing.feat_calendar_title': 'Google Calendar Widget',
    'landing.feat_calendar_desc': 'Manage your upcoming meetings and events in an elegant month and day calendar layout next to your notes.',
    
    'landing.feat_voice_title': 'Voice Voice Recorder',
    'landing.feat_voice_desc': 'Record voice memos right on your pages. The editor encodes them into high-quality MP3s and uploads them directly to your personal Drive.',
    
    'landing.feat_media_title': 'Protected Media Galleries',
    'landing.feat_media_desc': 'View your pictures and videos saved in Google Drive inside a private, fully responsive player without compromising any user privacy.',

    'landing.sec_security_title': 'GDPR and Privacy on a Whole New Level',
    'landing.sec_security_subtitle': 'Traditional editors store your sensitive business and private notes on third-party databases. DriveDeck breaks this framework in a revolutionary way, defining new paradigms for GDPR and privacy:',
    'landing.sec_security_pill_bydesign': '🔒 Privacy by Design',
    'landing.sec_security_pill_eu': '🇪🇺 EU GDPR Compliant',
    'landing.sec_security_pill_zero': '🛡️ Zero Server Storage',
    
    'landing.sec_security_bullet1': '<strong>Absolute Read/Write Sovereignty:</strong> Your notebooks reside encrypted inside your Drive\'s private AppData storage. No one except you (and the local browser app) can read this information.',
    'landing.sec_security_bullet2': '<strong>100% GDPR Compliant:</strong> Since no contents are hosted on our servers, there are zero risky transfers of sensitive data to third-party entities or ad networks.',
    'landing.sec_security_bullet3': '<strong>Offline-first Storage:</strong> Even when you are offline or in flight mode, you can write and edit seamlessly. The app syncs with Drive automatically once your connection resumes.',

    'landing.sec_faq_title': 'Frequently Asked Questions (FAQs)',
    'landing.sec_faq_q1': 'What problem does DriveDeck solve compared to hundreds of other notes apps?',
    'landing.sec_faq_a1': 'Nearly all notes services (such as Notion, Evernote, or Obsidian-Sync) tie you to their own proprietary servers. Your confidential data is stored unencrypted in their cloud databases. DriveDeck solves vendor lock-in and corporate tracking: you get a beautiful, fast productivity dashboard where all data remains 100% in your hands – saved in your own Google Drive and browser storage.',
    
    'landing.sec_faq_q2': 'You claim absolute privacy, but use Google Drive as storage? Isn\'t that a contradiction?',
    'landing.sec_faq_a2': 'It sounds like a paradox at first, but it is actually a smart architecture! Standard apps keep your secrets on small third-party database backends. If they are hacked, bankrupt, or acquired, you lose control. DriveDeck operates absolutely no servers for your content. You utilize Google\'s elite multi-billion dollar security infrastructure as "dumb cloud storage" while refusing to leak your database records to yet another third-party startup backend.',
    
    'landing.sec_faq_q3': 'Is DriveDeck affiliated with Google?',
    'landing.sec_faq_a3': 'No, absolutely not! DriveDeck is a fully independent software project and has no business, financial, or legal connection to Google LLC. We merely utilize the public, official developer APIs (Google APIs) to provide a localized, client-side productivity experience directly on your storage.',
    
    'landing.sec_faq_q4': 'Is DriveDeck fully GDPR compliant?',
    'landing.sec_faq_a4': 'Yes, 100% (Privacy by Design)! Because we have no central database servers, we cannot scan, analyze, monetize, or sell your contents to anybody. Your notes stay fully in your browser sandbox (IndexedDB) and encrypted inside your personal Google Drive storage. It is privacy in its purest form.',
    
    'landing.sec_faq_q5': 'How do I download my data if I want to stop using DriveDeck?',
    'landing.sec_faq_a5': 'You maintain complete sovereignty (no vendor lock-in): in your app settings, you can export a full backup of all your albums, pages, sticky notes, and tasks as a standard, human-readable JSON file with a single click. There are no proprietary file format locks.',

    'landing.footer_claim': 'DriveDeck – Bring Your Own Storage. 100% privacy-focused productivity.',
    'landing.footer_impressum': 'Legal Notice (Impressum)',
    'landing.footer_privacy': 'Privacy Policy',
    'landing.footer_terms': 'Terms of Service',
    'landing.footer_terms_back': 'Back to Homepage',

    // Sidebar Workspace
    'sidebar.title_workspace': 'Workspace',
    'sidebar.btn_new_page': 'New Page',
    'sidebar.btn_new_album': 'New Folder',
    'sidebar.lbl_pages': 'Pages',
    'sidebar.lbl_albums': 'Folders & Categories',
    'sidebar.lbl_trash': 'Trash Bin',
    'sidebar.lbl_favorites': 'Favorites',
    'sidebar.lbl_sticky_notes': 'Sticky Notes Board',
    'sidebar.lbl_media_lib': 'Media Gallery',
    'sidebar.lbl_settings': 'Settings',
    'sidebar.lbl_sign_out': 'Sign Out',
    'sidebar.sync_synced': 'Drive synced',
    'sidebar.sync_syncing': 'Syncing with Drive...',
    'sidebar.sync_offline': 'Offline Mode',
    'sidebar.sync_error': 'Sync error',
    'sidebar.sync_info_btn': 'Sync Details',

    // Editor & Page
    'editor.placeholder_title': 'Untitled Page',
    'editor.placeholder_content': 'Type "/" for commands or text here...',
    'editor.slash_text': 'Text block',
    'editor.slash_h1': 'Heading 1',
    'editor.slash_h2': 'Heading 2',
    'editor.slash_h3': 'Heading 3',
    'editor.slash_todo': 'To-Do list',
    'editor.slash_bullet': 'Bullet points',
    'editor.slash_code': 'Code block',
    'editor.slash_stickies': 'Embed Sticky Board',
    'editor.slash_tasks': 'Embed Google Tasks',
    'editor.slash_calendar': 'Embed Google Calendar',
    'editor.slash_voice': 'Embed Voice Recorder',
    'editor.slash_media': 'Embed Media Gallery',
    'editor.page_delete_confirm_title': 'Delete Page',
    'editor.page_delete_confirm_desc': 'Are you sure you want to permanently delete this page? It will be removed from your browser database and Google Drive backup.',
    'editor.cover_add': 'Add cover',
    'editor.cover_change': 'Change cover',
    'editor.cover_remove': 'Remove cover',
    'editor.icon_add': 'Add icon',
    'editor.icon_change': 'Change icon',
    'editor.pinned_title': 'Favorites',
    'editor.all_pages': 'All Pages',

    // Sticky Notes Component
    'stickies.title': 'Colorful Sticky Board',
    'stickies.desc': 'Doodle fleeting thoughts. Automatically preserved.',
    'stickies.btn_new': 'Create New Note',
    'stickies.placeholder_title': 'Sticky title...',
    'stickies.placeholder_content': 'Type your message here...',
    'stickies.color_yellow': 'Yellow',
    'stickies.color_green': 'Green',
    'stickies.color_blue': 'Blue',
    'stickies.color_pink': 'Pink',
    'stickies.color_purple': 'Purple',
    'stickies.color_orange': 'Orange',
    'stickies.color_gray': 'Grey',
    'stickies.pin': 'Pin to top',
    'stickies.unpin': 'Unpin note',
    'stickies.no_notes': 'No sticky notes on this board yet. Create your first note!',

    // Google Tasks Widget
    'tasks.title': 'Google Tasks Planner',
    'tasks.add_placeholder': 'Create any task...',
    'tasks.no_tasks': 'No active tasks in this list!',
    'tasks.subtasks': 'Subtasks',
    'tasks.add_subtask_placeholder': 'Add a subtask...',
    'tasks.due_date': 'Due date',
    'tasks.recurrence': 'Recurrence',
    'tasks.starred': 'Starred',
    'tasks.not_connected': 'Google Tasks is not connected or requires authentication.',
    'tasks.connect_btn': 'Connect Google Tasks',
    'tasks.lists_title': 'Task lists',

    // Calendar Widget
    'calendar.title': 'My Google Calendar',
    'calendar.not_connected': 'Google Calendar is not connected.',
    'calendar.connect_btn': 'Connect Calendar',
    'calendar.choose_active': 'Select Active Calendars',
    'calendar.weekday_mo': 'M',
    'calendar.weekday_tu': 'T',
    'calendar.weekday_we': 'W',
    'calendar.weekday_th': 'T',
    'calendar.weekday_fr': 'F',
    'calendar.weekday_sa': 'S',
    'calendar.weekday_su': 'S',
    'calendar.today': 'Today',
    'calendar.all_day': 'All Day',
    'calendar.no_events': 'No events scheduled for this day.',

    // Voice Recorder Widget
    'voice.title': 'Voice Dictation Device',
    'voice.start': 'Start Recording',
    'voice.stop': 'Stop Recording',
    'voice.cancel': 'Discard',
    'voice.save_drive': 'Save to Google Drive (MP3)',
    'voice.saving': 'Encoding audio and uploading secure file...',
    'voice.playing': 'Playing',
    'voice.no_recording': 'No audio recorded yet.',
    'voice.success_save': 'Voice note successfully saved inside the "DriveDeck" folder on Google Drive.',

    // Media / Photos Widget
    'media.title': 'Private Media Player & Folders',
    'media.choose_drive_btn': 'Select Image/Video from Drive',
    'media.no_media': 'No media in this section yet. Choose pictures or videos from your Google Drive cabinet.',
    'media.unsupported': 'This file format is not supported in browser-native playback.',

    // Settings Page
    'settings.title': 'Profile & Settings',
    'settings.subtitle': 'Manage your profile account, Google Drive cloud connection, and local backups',
    'settings.section_profile': 'My Profile',
    'settings.section_drive': 'Google Drive Cloud Connection',
    'settings.drive_connected_desc': 'DriveDeck is successfully synchronizing with your personal Google Drive storage.',
    'settings.drive_disconnected_desc': 'No active Google Drive connection. Your files are only stored offline inside this browser sandbox.',
    'settings.btn_connect': 'Link Google Drive',
    'settings.btn_disconnect': 'Disconnect Link',
    
    'settings.section_subscription': '100% Free & Unlimited',
    'settings.sub_active_premium': 'DriveDeck is permanently free. All features are fully unlocked for you.',
    'settings.sub_trial': 'Full Free Edition',
    'settings.sub_trial_days': 'Permanently free to use.',
    'settings.sub_trial_expired': 'DriveDeck is completely free.',
    'settings.btn_checkout': 'Free',
    'settings.plan_monthly': 'Free',
    'settings.plan_yearly': 'Free',
    'settings.plan_lifetime': 'Free',
    
    'settings.section_backup': 'Backup File Portability',
    'settings.backup_desc': 'All statistics and pages belong entirely to you. Capture a full, uncompressed, open JSON archive copy of your lists, stickies, and blocks.',
    'settings.btn_export': 'Export Backup File (JSON)',
    'settings.exporting': 'Assembling zip file...',

    'settings.section_danger': 'Danger Zone',
    'settings.danger_desc': 'This is highly destructive and permanent. Purges all offline storage caches (pages, notes, lists) from this computer.',
    'settings.btn_reset': 'Hard Wipe Local Offline Databases',
    'settings.reset_confirm': 'Are you sure you want to completely wipe all local workspace data? This does not delete any backups inside your Drive, but log you out immediately.',
    'settings.language_label': 'Language Preference',
    'settings.language_desc': 'Choose your preferred dashboard language'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('drivedeck_language');
      if (saved === 'de' || saved === 'en') return saved;
      
      // Fallback to browser language
      const userLang = navigator.language.slice(0, 2).toLowerCase();
      if (userLang === 'de') return 'de';
    } catch (e) {}
    return 'en'; // default to English so it meets global user intent out-of-the-box
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('drivedeck_language', lang);
    } catch (e) {}
  };

  // Translation helper function
  const t = (key: string, variables?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['de'][key] || key;
    
    if (variables) {
      Object.entries(variables).forEach(([vKey, vVal]) => {
        text = text.replace(new RegExp(`\\{${vKey}\\}`, 'g'), String(vVal));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
