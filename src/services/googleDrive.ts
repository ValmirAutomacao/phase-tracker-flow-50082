// Configuração do Google Drive API
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const PARENT_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID || '1Y06FFvPPVIjxeu9P2M7HjPL3CDQsIvgB';

// Service Account credentials (para autenticação silenciosa)
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_SERVICE_ACCOUNT_PRIVATE_KEY;

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Inicializar Google API
// Auto-restaurar token salvo (chamada silenciosa)
const tryRestoreSavedToken = (): boolean => {
  try {
    const storedToken = localStorage.getItem('google_drive_token');

    if (storedToken) {
      const token = JSON.parse(storedToken);
      const now = Date.now();

      if (token.access_token && token.expires_at && now < token.expires_at) {
        // @ts-ignore
        if (typeof gapi !== 'undefined' && gapi.client) {
          // @ts-ignore
          gapi.client.setToken(token);
          console.log('🔄 Token restaurado automaticamente do localStorage');
          console.log('⏰ Token válido até:', new Date(token.expires_at));
          return true;
        }
      } else {
        // Token expirado, remover
        console.log('⏰ Token expirado, removendo do localStorage');
        localStorage.removeItem('google_drive_token');
      }
    }
  } catch (error) {
    console.log('⚠️ Erro ao restaurar token:', error);
    localStorage.removeItem('google_drive_token');
  }

  return false;
};

// Função para forçar restauração do token quando necessário
export const ensureTokenIsRestored = (): boolean => {
  try {
    // @ts-ignore
    if (typeof gapi === 'undefined' || !gapi.client) {
      console.log('⚠️ gapi não está disponível para restaurar token');
      return false;
    }

    // Verificar se já há token no gapi.client
    // @ts-ignore
    const currentToken = gapi.client.getToken();
    if (currentToken && currentToken.access_token) {
      console.log('✅ Token já está presente no gapi.client');
      return true;
    }

    // Tentar restaurar do localStorage
    return tryRestoreSavedToken();
  } catch (error) {
    console.log('❌ Erro ao garantir restauração do token:', error);
    return false;
  }
};

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
          apiKey: API_KEY, // Usar API Key para operações que não precisam de OAuth
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
        prompt: '', // Remove QUALQUER prompt
        hint: '', // Remove hint de conta
        include_granted_scopes: true,
        enable_granular_consent: false,
        auto_select: true // Seleção automática quando possível
      });
      gisInited = true;
      maybeEnableButtons(resolve);
    }
  });
};

function maybeEnableButtons(resolve: (value: boolean) => void) {
  if (gapiInited && gisInited) {
    // Tentar restaurar token salvo automaticamente
    tryRestoreSavedToken();
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
    // Verificar se há token válido antes do upload
    if (!hasValidToken()) {
      console.log('⚠️ Token inválido, solicitando autorização para upload...');
      await requestAuthorization();
    }

    // @ts-ignore
    const token = gapi.client.getToken()?.access_token;
    if (!token) {
      throw new Error('Token de acesso não disponível');
    }

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      // Se for erro 401, tentar reautorizar
      if (response.status === 401) {
        console.log('🔐 Erro 401 no upload, reautorizando...');
        await requestAuthorization();

        // @ts-ignore
        const newToken = gapi.client.getToken()?.access_token;
        const retryResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`
          },
          body: formData
        });

        if (!retryResponse.ok) {
          throw new Error(`Erro no upload após reautorização: ${retryResponse.status}`);
        }

        const retryResult = await retryResponse.json();
        return retryResult;
      }

      throw new Error(`Erro no upload: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
};

// Upload de metadata.json
export const uploadMetadata = async (folderId: string, metadata: any): Promise<any> => {
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json');
  return uploadFileToDrive(file, folderId, 'metadata.json');
};

// Deletar arquivo do Google Drive
export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    // @ts-ignore
    await gapi.client.drive.files.delete({
      fileId: fileId
    });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
};

// Listar arquivos de uma pasta (SEM autenticação OAuth - usa API Key)
export const listFilesInFolder = async (folderId: string): Promise<any[]> => {
  try {
    console.log('📁 Listando arquivos na pasta (sem OAuth):', folderId);

    // Verificar se gapi está inicializado
    // @ts-ignore
    if (typeof gapi === 'undefined' || !gapi.client) {
      throw new Error('Google API não inicializado');
    }

    // Usar API Key diretamente - SEM OAuth
    // @ts-ignore
    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, thumbnailLink, createdTime, mimeType)',
      orderBy: 'createdTime',
      key: API_KEY // Usar API Key explicitamente
    });

    console.log('📋 Resposta da API (sem OAuth):', response.result);
    const files = response.result.files || [];
    console.log('📂 Arquivos encontrados:', files.length, files);

    return files;
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);

    // Se API Key falhar, tentar com OAuth como fallback
    console.log('🔄 Tentando com OAuth como fallback...');
    return await listFilesInFolderWithAuth(folderId);
  }
};

// Fallback com OAuth (apenas se API Key falhar)
const listFilesInFolderWithAuth = async (folderId: string): Promise<any[]> => {
  try {
    // Verificar se há token válido
    if (!hasValidToken()) {
      console.log('⚠️ Tentando operação sem token válido');
      throw new Error('Token inválido para operação com OAuth');
    }

    // @ts-ignore
    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, thumbnailLink, createdTime, mimeType)',
      orderBy: 'createdTime'
    });

    return response.result.files || [];
  } catch (error) {
    console.error('❌ Fallback OAuth também falhou:', error);
    return [];
  }
};

// Gerar URL de thumbnail autenticada
export const getAuthenticatedThumbnail = async (fileId: string, size: number = 400): Promise<string> => {
  try {
    // @ts-ignore
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'thumbnailLink, webContentLink'
    });

    const file = response.result;

    // Tentar diferentes estratégias de URL
    const urls = [
      file.thumbnailLink?.replace(/=s\d+/, `=s${size}`),
      `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`,
      `https://lh3.googleusercontent.com/d/${fileId}=s${size}`,
      file.webContentLink
    ].filter(Boolean);

    return urls[0] || '';
  } catch (error) {
    console.error('Erro ao obter thumbnail autenticada:', error);
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }
};

// Excluir pasta completa do Drive
export const deleteDriveFolder = async (folderId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Excluindo pasta do Drive:', folderId);

    // Verificar se há token válido antes de tentar excluir
    if (!hasValidToken()) {
      console.log('⚠️ Token inválido, solicitando autorização para exclusão...');
      try {
        await requestAuthorization();
        console.log('✅ Autorização obtida para exclusão');
      } catch (authError) {
        console.error('❌ Falha na autorização para exclusão:', authError);
        return false;
      }
    }

    // Verificar novamente se o token está configurado corretamente
    // @ts-ignore
    const currentToken = gapi.client.getToken();
    if (!currentToken || !currentToken.access_token) {
      console.error('❌ Token ainda não está disponível após autorização');
      return false;
    }

    // Tentar excluir a pasta
    // @ts-ignore
    await gapi.client.drive.files.delete({
      fileId: folderId
    });

    console.log('✅ Pasta excluída do Drive com sucesso');
    return true;

  } catch (error: any) {
    console.error('❌ Erro ao excluir pasta do Drive:', error);

    // Verificar se é erro de autorização
    if (error?.status === 401 || error?.result?.error?.code === 401) {
      console.log('🔐 Erro de autorização detectado, tentando reautorizar...');
      try {
        await requestAuthorization();

        // Tentar novamente após reautorização
        // @ts-ignore
        await gapi.client.drive.files.delete({
          fileId: folderId
        });

        console.log('✅ Pasta excluída após reautorização');
        return true;
      } catch (retryError) {
        console.error('❌ Falha na segunda tentativa de exclusão:', retryError);
        return false;
      }
    }

    // Se não é erro de autorização, retornar false
    return false;
  }
};

// Verificar se há token válido sem solicitar autorização
export const hasValidToken = (): boolean => {
  try {
    console.log('🔍 Verificando token válido...');

    // @ts-ignore
    if (typeof gapi === 'undefined' || !gapi.client) {
      console.log('❌ gapi ou gapi.client não disponível');
      return false;
    }

    // Primeiro, tentar restaurar do localStorage se disponível
    const storedToken = localStorage.getItem('google_drive_token');
    let token = null;

    if (storedToken) {
      try {
        token = JSON.parse(storedToken);
        console.log('📱 Token recuperado do localStorage:', token);

        // Restaurar token no gapi.client
        // @ts-ignore
        gapi.client.setToken(token);
      } catch (error) {
        console.log('❌ Erro ao parsear token do localStorage:', error);
        localStorage.removeItem('google_drive_token');
        return false;
      }
    }

    // Verificar token no gapi.client após restauração
    // @ts-ignore
    const gapiToken = gapi.client.getToken();
    if (gapiToken && gapiToken.access_token) {
      token = gapiToken;
      console.log('✅ Token confirmado no gapi.client');
    }

    if (!token || !token.access_token) {
      console.log('❌ Token não existe ou sem access_token');
      return false;
    }

    const now = Date.now();
    const expiry = token.expires_at || 0;
    console.log('⏰ Token expira em:', new Date(expiry), 'Agora:', new Date(now));

    const isValid = now < expiry;

    if (!isValid) {
      console.log('⏰ Token expirado, removendo do localStorage');
      localStorage.removeItem('google_drive_token');
    }

    console.log('✅ Token válido:', isValid);
    return isValid;
  } catch (error) {
    console.log('❌ Erro ao verificar token:', error);
    return false;
  }
};

// Solicitar autorização
export const requestAuthorization = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client não inicializado'));
      return;
    }

    // Verificar se gapi e gapi.client estão disponíveis
    // @ts-ignore
    if (typeof gapi === 'undefined' || !gapi.client) {
      reject(new Error('Google API não inicializado'));
      return;
    }

    // PRIMEIRO: Verificar se já temos um token válido (incluindo localStorage)
    if (hasValidToken()) {
      console.log('✅ Token válido já existe, não solicitando autorização');
      try {
        // @ts-ignore
        const currentToken = gapi.client.getToken();
        resolve(currentToken);
        return;
      } catch (error) {
        console.log('⚠️ Erro ao obter token atual:', error);
      }
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        console.error('❌ Erro na autorização:', resp);
        reject(resp);
        return;
      }

      // Definir o token no gapi.client e salvar no localStorage
      try {
        const tokenData = {
          access_token: resp.access_token,
          expires_at: Date.now() + (resp.expires_in * 1000)
        };

        // @ts-ignore
        gapi.client.setToken(tokenData);

        // Salvar no localStorage para persistência
        localStorage.setItem('google_drive_token', JSON.stringify(tokenData));
        console.log('✅ Novo token obtido e salvo no localStorage');
        resolve(tokenData);
      } catch (error) {
        console.error('⚠️ Erro ao definir token:', error);
        reject(error);
      }
    };

    // Verificar se já existe um token de acesso válido no gapi.client
    try {
      // @ts-ignore
      const token = gapi.client.getToken();

      if (token && token.access_token) {
        // Token existe, verificar se ainda é válido
        const now = Date.now();
        const expiry = token.expires_at || 0;

        if (now < expiry) {
          // Token ainda é válido, resolver sem solicitar novo
          console.log('✅ Token válido no gapi.client, sem necessidade de popup');
          resolve(token);
          return;
        } else {
          console.log('⏰ Token no gapi.client expirado');
        }
      } else {
        console.log('ℹ️ Nenhum token encontrado no gapi.client');
      }

      // Se chegamos aqui, precisamos de um novo token
      console.log('🔐 Solicitando nova autorização (popup necessário)...');

      // Solicitar com prompt consent apenas se realmente necessário
      tokenClient.requestAccessToken({
        prompt: 'select_account',  // Permite seleção de conta, mas menos intrusivo que 'consent'
        include_granted_scopes: true,
        enable_granular_consent: false
      });

    } catch (error) {
      // Se getToken() falhar, solicitar nova autorização
      console.error('❌ Erro ao verificar token, solicitando autorização:', error);
      tokenClient.requestAccessToken({
        prompt: 'select_account',
        include_granted_scopes: true
      });
    }
  });
};
