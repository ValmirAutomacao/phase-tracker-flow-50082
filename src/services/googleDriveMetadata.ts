import { requestAuthorization, createProjectFolder, uploadFileToDrive, listFilesInFolder, deleteFile } from './googleDrive';

export interface VideoMetadata {
  video_id: string;
  nome: string;
  obra_id: string;
  obra_nome: string;
  status: 'criado' | 'upload_realizado' | 'processando' | 'concluido' | 'erro';
  created_at: string;
  updated_at: string;
  drive_folder_id: string;
  total_fotos: number;
  video_url: string | null;
  n8n_job_id: string | null;
}

export interface VideoProject {
  metadata: VideoMetadata;
  folder_name: string;
  photos: any[];
}

// Pasta principal dos vídeos no Google Drive
const VIDEOS_PARENT_FOLDER = import.meta.env.VITE_DRIVE_FOLDER_ID || '1Y06FFvPPVIjxeu9P2M7HjPL3CDQsIvgB';

// Criar novo projeto de vídeo
export const createVideoProject = async (projectData: {
  nome: string;
  obra_id: string;
  obra_nome: string;
}): Promise<VideoProject> => {
  try {
    await requestAuthorization();

    // Gerar ID único para o vídeo
    const videoId = crypto.randomUUID();

    // Criar pasta no Drive
    const { folderId, folderName } = await createProjectFolder(projectData.obra_nome);

    // Criar metadata
    const metadata: VideoMetadata = {
      video_id: videoId,
      nome: projectData.nome,
      obra_id: projectData.obra_id,
      obra_nome: projectData.obra_nome,
      status: 'criado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      drive_folder_id: folderId,
      total_fotos: 0,
      video_url: null,
      n8n_job_id: null
    };

    // Salvar metadata.json no Drive
    await uploadMetadataToFolder(folderId, metadata);

    return {
      metadata,
      folder_name: folderName,
      photos: []
    };

  } catch (error) {
    console.error('Erro ao criar projeto de vídeo:', error);
    throw error;
  }
};

// Listar todos os projetos de vídeo
export const listVideoProjects = async (): Promise<VideoProject[]> => {
  try {
    await requestAuthorization();

    // Listar todas as pastas na pasta principal
    // @ts-ignore
    const response = await gapi.client.drive.files.list({
      q: `'${VIDEOS_PARENT_FOLDER}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc'
    });

    const folders = response.result.files || [];
    const projects: VideoProject[] = [];

    // Para cada pasta, buscar o metadata.json
    for (const folder of folders) {
      try {
        const metadata = await getVideoMetadata(folder.id);
        if (metadata) {
          const photos = await listFilesInFolder(folder.id);
          projects.push({
            metadata,
            folder_name: folder.name,
            photos: photos.filter(file => file.name !== 'metadata.json')
          });
        }
      } catch (error) {
        console.warn(`Erro ao carregar metadata da pasta ${folder.name}:`, error);
      }
    }

    return projects;

  } catch (error) {
    console.error('Erro ao listar projetos de vídeo:', error);
    throw error;
  }
};

// Obter metadata de um vídeo específico
export const getVideoMetadata = async (folderId: string): Promise<VideoMetadata | null> => {
  try {
    await requestAuthorization();

    // Buscar arquivo metadata.json na pasta
    // @ts-ignore
    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and name='metadata.json' and trashed=false`,
      fields: 'files(id)'
    });

    const files = response.result.files || [];
    if (files.length === 0) {
      return null;
    }

    // Baixar conteúdo do metadata.json
    // @ts-ignore
    const fileResponse = await gapi.client.drive.files.get({
      fileId: files[0].id,
      alt: 'media'
    });

    return JSON.parse(fileResponse.body) as VideoMetadata;

  } catch (error) {
    console.error('Erro ao obter metadata:', error);
    return null;
  }
};

// Atualizar metadata de um vídeo
export const updateVideoMetadata = async (folderId: string, updates: Partial<VideoMetadata>): Promise<VideoMetadata> => {
  try {
    const currentMetadata = await getVideoMetadata(folderId);
    if (!currentMetadata) {
      throw new Error('Metadata não encontrado');
    }

    const updatedMetadata: VideoMetadata = {
      ...currentMetadata,
      ...updates,
      updated_at: new Date().toISOString()
    };

    await uploadMetadataToFolder(folderId, updatedMetadata);

    return updatedMetadata;

  } catch (error) {
    console.error('Erro ao atualizar metadata:', error);
    throw error;
  }
};

// Deletar projeto de vídeo completo
export const deleteVideoProject = async (folderId: string): Promise<void> => {
  try {
    await requestAuthorization();

    // Deletar a pasta inteira (inclui todos os arquivos)
    await deleteFile(folderId);

  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    throw error;
  }
};

// Upload de metadata.json para uma pasta
const uploadMetadataToFolder = async (folderId: string, metadata: VideoMetadata): Promise<void> => {
  try {
    // Verificar se já existe metadata.json
    // @ts-ignore
    const existingResponse = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and name='metadata.json' and trashed=false`,
      fields: 'files(id)'
    });

    const existingFiles = existingResponse.result.files || [];

    // Se existe, deletar primeiro
    if (existingFiles.length > 0) {
      await deleteFile(existingFiles[0].id);
    }

    // Criar novo arquivo metadata.json
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json');

    await uploadFileToDrive(file, folderId, 'metadata.json');

  } catch (error) {
    console.error('Erro ao salvar metadata:', error);
    throw error;
  }
};

// Utilitários para o PhotoManager
export const updatePhotoCount = async (folderId: string, count: number): Promise<void> => {
  await updateVideoMetadata(folderId, { total_fotos: count });
};

export const updateVideoStatus = async (folderId: string, status: VideoMetadata['status']): Promise<void> => {
  await updateVideoMetadata(folderId, { status });
};

export const setN8nJobId = async (folderId: string, jobId: string): Promise<void> => {
  await updateVideoMetadata(folderId, {
    n8n_job_id: jobId,
    status: 'processando'
  });
};

export const setVideoCompleted = async (folderId: string, videoUrl: string): Promise<void> => {
  await updateVideoMetadata(folderId, {
    video_url: videoUrl,
    status: 'concluido'
  });
};