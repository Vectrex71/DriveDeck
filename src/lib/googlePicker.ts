import firebaseConfig from '../../firebase-applet-config.json';

let isPickerLoaded = false;

/**
 * Loads the Google API client library, then loads the 'picker' module.
 */
export function loadGooglePickerAPI(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (isPickerLoaded && (window as any).google && (window as any).google.picker) {
      resolve((window as any).google);
      return;
    }

    // Check if the script already exists in the document
    let script = document.getElementById('google-api-js') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-api-js';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const checkGapiAndLoadPicker = () => {
      const gapi = (window as any).gapi;
      if (gapi) {
        gapi.load('picker', {
          callback: () => {
            isPickerLoaded = true;
            resolve((window as any).google);
          },
          onerror: () => {
            reject(new Error('Fehler beim Laden des Google Picker Moduls.'));
          }
        });
      } else {
        setTimeout(checkGapiAndLoadPicker, 100);
      }
    };

    if (script.onload) {
      // Script is already loading, wait and poll
      checkGapiAndLoadPicker();
    } else {
      script.onload = () => {
        checkGapiAndLoadPicker();
      };
      script.onerror = () => {
        reject(new Error('Fehler beim Laden des Google API Scripts.'));
      };
    }
  });
}

export interface GooglePickerFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  webViewLink?: string;
}

/**
 * Launches the official Google Picker popup.
 */
export async function launchGooglePicker(
  token: string,
  onFilePicked: (file: GooglePickerFile) => void,
  mimeTypeFilter?: string
): Promise<void> {
  const google = await loadGooglePickerAPI();
  if (!google || !google.picker) {
    throw new Error('Google Picker API konnte nicht initialisiert werden.');
  }

  // Create standard DocsView supporting Google Drive folders and files crawling
  const isFoldersOnly = mimeTypeFilter === 'application/vnd.google-apps.folder';
  const viewId = isFoldersOnly ? google.picker.ViewId.FOLDERS : google.picker.ViewId.DOCS;

  // Compile navigable filter that always includes folders to keep folder exploration working perfectly
  let allowedMimeTypes: string | undefined = undefined;
  if (mimeTypeFilter && !isFoldersOnly) {
    if (mimeTypeFilter.includes('*')) {
      // Wildcards like 'image/*' or 'audio/*' are NOT supported by Google Picker's setMimeTypes and cause "No documents" bugs.
      // We map standard wildcard groups to lists of precise supported MIME types, which Google Picker understands perfectly!
      if (mimeTypeFilter.startsWith('image/')) {
        allowedMimeTypes = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/vnd.google-apps.folder';
      } else if (mimeTypeFilter.startsWith('audio/')) {
        allowedMimeTypes = 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/x-m4a,audio/mp4,application/vnd.google-apps.folder';
      } else if (mimeTypeFilter.startsWith('video/')) {
        allowedMimeTypes = 'video/mp4,video/webm,video/quicktime,video/x-matroska,application/vnd.google-apps.folder';
      } else {
        // Fallback: If some other wildcard is used, do not filter mime-types to avoid blocking the user
        allowedMimeTypes = undefined;
      }
    } else {
      allowedMimeTypes = mimeTypeFilter.includes('application/vnd.google-apps.folder')
        ? mimeTypeFilter
        : `${mimeTypeFilter},application/vnd.google-apps.folder`;
    }
  }

  // 1. Create View for "My Drive" (Personal)
  const myDriveView = new google.picker.DocsView(viewId);
  myDriveView.setLabel('Mein Drive');
  myDriveView.setParent('root'); // Start exactly at the ROOT level of the user's personal Google Drive
  myDriveView.setIncludeFolders(true);
  if (isFoldersOnly) {
    myDriveView.setSelectFolderEnabled(true);
  }
  if (allowedMimeTypes) {
    myDriveView.setMimeTypes(allowedMimeTypes);
  }

  // 2. Create View for "Shared drives" (Collaborative)
  const sharedDrivesView = new google.picker.DocsView(viewId);
  sharedDrivesView.setLabel('Gemeinsame Ablagen');
  sharedDrivesView.setIncludeFolders(true);
  sharedDrivesView.setEnableDrives(true); // Supports shared drives too
  if (isFoldersOnly) {
    sharedDrivesView.setSelectFolderEnabled(true);
  }
  if (allowedMimeTypes) {
    sharedDrivesView.setMimeTypes(allowedMimeTypes);
  }

  // 3. Create View for "Shared with me" (Received from others)
  const sharedWithMeView = new google.picker.DocsView(viewId);
  sharedWithMeView.setLabel('Für mich freigegeben');
  sharedWithMeView.setIncludeFolders(true);
  sharedWithMeView.setParent('sharedWithMe');
  if (isFoldersOnly) {
    sharedWithMeView.setSelectFolderEnabled(true);
  }
  if (allowedMimeTypes) {
    sharedWithMeView.setMimeTypes(allowedMimeTypes);
  }

  // Set list view mode for all views to avoid showing empty, broken grid thumbnail boxes (caused by the lack of Google's drive.readonly restricted scope)
  try {
    myDriveView.setMode(google.picker.DocsViewMode.LIST);
    sharedDrivesView.setMode(google.picker.DocsViewMode.LIST);
    sharedWithMeView.setMode(google.picker.DocsViewMode.LIST);
  } catch (e) {
    console.warn('[Picker] Could not set List view mode:', e);
  }

  const pickerBuilder = new google.picker.PickerBuilder()
    .addView(myDriveView)
    .addView(sharedDrivesView)
    .addView(sharedWithMeView)
    .setOAuthToken(token)
    .setDeveloperKey((import.meta as any).env.VITE_GOOGLE_PICKER_API_KEY || firebaseConfig.apiKey)
    .setAppId(firebaseConfig.messagingSenderId)
    .setCallback((data: any) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        onFilePicked({
          id: doc[google.picker.Document.ID],
          name: doc[google.picker.Document.NAME],
          mimeType: doc[google.picker.Document.MIME_TYPE],
          url: doc[google.picker.Document.URL],
          webViewLink: doc[google.picker.Document.URL] // Fallback URL for drive file
        });
      }
    });

  // Set the current origin to bypass origin verification errors in standard domains/iframes
  try {
    const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    pickerBuilder.setOrigin(origin);
  } catch (e) {
    console.warn('[Picker] Error defining origin:', e);
  }

  const picker = pickerBuilder.build();
  picker.setVisible(true);
}
