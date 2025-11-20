// Configuração do Google Drive API
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const PARENT_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID || '1Y06FFvPPVIjxeu9P2M7HjPL3CDQsIvgB';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Inicializar Google API
export const initializeGoogleDrive = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // @ts-ignore - gapi é carregado via script externo
    if (typeof gapi === 'undefined') {
      console.error('gapi não está disponível');
      resolve(false);
      return;
    }

    // @ts-ignore
    gapi.load('client', async () => {
      try {
        // @ts-ignore
        await gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons(resolve);
      } catch (error) {
        console.error('Erro ao inicializar gapi.client:', error);
        resolve(false);
      }
    });

    // @ts-ignore - google é carregado via script externo
    if (typeof google !== 'undefined') {
      // @ts-ignore
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // definido na autorização
      });
      gisInited = true;
      maybeEnableButtons(resolve);
    }
  });
};

function maybeEnableButtons(resolve: (value: boolean) => void) {
  if (gapiInited && gisInited) {
    resolve(true);
  }
}

// Criar pasta do projeto
export const createProjectFolder = async (projectName: string): Promise<{ folderId: string; folderName: string }> => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const folderName = `${projectName}_${dateStr}`;
  
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [PARENT_FOLDER_ID]
  };

  try {
    // @ts-ignore
    const response = await gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id, name'
    });
    return {
      folderId: response.result.id,
      folderName: response.result.name
    };
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    throw error;
  }
};

// Upload de arquivo para o Drive
export const uploadFileToDrive = async (file: File, folderId: string, fileName: string): Promise<any> => {
  const metadata = {
    name: fileName,
    parents: [folderId]
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  try {
    // @ts-ignore
    const token = gapi.client.getToken().access_token;
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
};

// Upload de metadata.json
export const uploadMetadata = async (folderId: string, metadata: any): Promise<any> => {
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json');
  return uploadFileToDrive(file, folderId, 'metadata.json');
};

// Solicitar autorização
export const requestAuthorization = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client não inicializado'));
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
      }
      resolve(resp);
    };

    // @ts-ignore
    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};
