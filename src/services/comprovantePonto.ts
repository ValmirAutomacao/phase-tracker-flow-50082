import jsPDF from 'jspdf';
import { RegistroPonto, FuncionarioCompleto, TIPO_REGISTRO_LABELS } from '@/types/ponto';

export interface DadosComprovante {
  funcionario: FuncionarioCompleto;
  registro: RegistroPonto;
  empresaNome: string;
  empresaCNPJ: string;
}

export const gerarComprovantePDF = (dados: DadosComprovante): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let currentY = 20;

      // Header da empresa
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(dados.empresaNome, pageWidth / 2, currentY, { align: 'center' });

      currentY += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`CNPJ: ${dados.empresaCNPJ}`, pageWidth / 2, currentY, { align: 'center' });

      currentY += 20;

      // Título
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('COMPROVANTE DE REGISTRO DE PONTO', pageWidth / 2, currentY, { align: 'center' });

      currentY += 20;

      // Linha separadora
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 15;

      // Dados do funcionário
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('DADOS DO FUNCIONÁRIO', 20, currentY);
      currentY += 10;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      // Nome
      doc.text('Nome:', 20, currentY);
      doc.text(dados.funcionario.nome, 60, currentY);
      currentY += 8;

      // CPF
      if (dados.funcionario.cpf) {
        doc.text('CPF:', 20, currentY);
        doc.text(dados.funcionario.cpf, 60, currentY);
        currentY += 8;
      }

      // CTPS
      if (dados.funcionario.ctps) {
        doc.text('CTPS:', 20, currentY);
        doc.text(dados.funcionario.ctps, 60, currentY);
        currentY += 8;
      }

      // Data de admissão
      if (dados.funcionario.data_admissao) {
        doc.text('Data de Admissão:', 20, currentY);
        doc.text(new Date(dados.funcionario.data_admissao).toLocaleDateString('pt-BR'), 100, currentY);
        currentY += 8;
      }

      // Função
      if (dados.funcionario.funcao) {
        doc.text('Função:', 20, currentY);
        doc.text(dados.funcionario.funcao.nome, 60, currentY);
        currentY += 8;
      }

      currentY += 10;

      // Linha separadora
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 15;

      // Dados do registro
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('DADOS DO REGISTRO', 20, currentY);
      currentY += 10;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      // Data do registro
      doc.text('Data:', 20, currentY);
      doc.text(new Date(dados.registro.data_registro + 'T00:00:00').toLocaleDateString('pt-BR'), 60, currentY);
      currentY += 8;

      // Tipo de registro
      doc.text('Tipo:', 20, currentY);
      doc.text(`${dados.registro.tipo_registro} - ${TIPO_REGISTRO_LABELS[dados.registro.tipo_registro]}`, 60, currentY);
      currentY += 8;

      // Horário
      doc.text('Horário:', 20, currentY);
      doc.text(dados.registro.hora_registro.slice(0, 5), 60, currentY);
      currentY += 8;

      // Data/hora do registro
      doc.text('Registrado em:', 20, currentY);
      doc.text(new Date(dados.registro.timestamp_registro).toLocaleString('pt-BR'), 80, currentY);
      currentY += 8;

      // IP (se disponível)
      if (dados.registro.ip_address) {
        doc.text('IP:', 20, currentY);
        doc.text(dados.registro.ip_address, 60, currentY);
        currentY += 8;
      }

      currentY += 15;

      // Linha separadora
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 15;

      // Hash de verificação
      const hash = gerarHashVerificacao(dados);
      doc.setFontSize(8);
      doc.text('Hash de Verificação:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'bold');
      doc.text(hash, 20, currentY, { maxWidth: pageWidth - 40 });

      currentY += 15;

      // Rodapé
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text('Este comprovante é válido e pode ser verificado através do hash acima.', pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, currentY, { align: 'center' });

      // Converter para base64 e retornar
      const pdfBase64 = doc.output('datauristring');
      resolve(pdfBase64);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      reject(error);
    }
  });
};

const gerarHashVerificacao = (dados: DadosComprovante): string => {
  // Gerar hash simples baseado nos dados do comprovante
  const dataString = `${dados.funcionario.id}${dados.registro.id}${dados.registro.timestamp_registro}${dados.registro.tipo_registro}`;

  // Função hash simples (em produção, usar algo mais robusto como crypto)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
};

export const baixarComprovantePDF = (dados: DadosComprovante): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDataUri = await gerarComprovantePDF(dados);

      // Criar link para download
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `comprovante_ponto_${dados.funcionario.nome.replace(/\s+/g, '_')}_${dados.registro.data_registro}_${dados.registro.tipo_registro}.pdf`;

      // Simular click para download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const visualizarComprovantePDF = (dados: DadosComprovante): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDataUri = await gerarComprovantePDF(dados);

      // Abrir em nova janela
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Comprovante de Ponto - ${dados.funcionario.nome}</title>
            </head>
            <body style="margin: 0; padding: 0;">
              <iframe src="${pdfDataUri}" style="width: 100%; height: 100vh; border: none;"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};