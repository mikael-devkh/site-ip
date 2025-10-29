// src/utils/ratPdfGenerator.ts

import { PDFDocument, PDFForm } from 'pdf-lib';
import { RatFormData } from '../types/rat'; // Verifique se o caminho está correto
import templatePdf from '../assets/rat-template.pdf?url';

/**
 * Dispara o download de um arquivo PDF no navegador.
 */
function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// --- FUNÇÕES HELPER COM LOG DE DIAGNÓSTICO ---

/**
 * Tenta preencher um campo de texto de forma segura, logando o valor.
 */
function safeSetText(form: PDFForm, fieldName: string, value: unknown) {
  const stringValue = String(value ?? '');

  // --- LOG DE DIAGNÓSTICO ---
  console.log(`Preenchendo [${fieldName}] com o valor: "${stringValue}"`);
  // -------------------------

  try {
    const field = form.getTextField(fieldName);
    field.setText(stringValue);
  } catch (error) {
    console.error(`(safeSetText) Campo [${fieldName}] NÃO ENCONTRADO no PDF.`);
  }
}

/**
 * Tenta marcar um checkbox de forma segura.
 */
function safeCheck(form: PDFForm, fieldName: string) {
  try {
    const field = form.getCheckBox(fieldName);
    field.check();
  } catch (error) {
    console.error(`(safeCheck) Campo [${fieldName}] NÃO ENCONTRADO no PDF.`);
  }
}

/**
 * Preenche o formulário PDF com os dados, usando nomes EXATOS.
 */
function fillFormFields(form: PDFForm, data: RatFormData) {
  console.log('--- Iniciando Preenchimento dos Campos ---');

  // --- IDENTIFICAÇÃO (Página 1) ---
  safeSetText(form, 'Cliente', data.cliente);
  safeSetText(form, 'CódigodaLoja', data.codigoLoja);
  safeSetText(form, 'PDV', data.pdv);
  safeSetText(form, 'FSA', data.fsa);
  safeSetText(form, 'Endereço', data.endereco);
  safeSetText(form, 'Cidade', data.cidade);
  safeSetText(form, 'UF', data.uf);
  safeSetText(form, 'Nom do solicitante', data.nomeSolicitante);

  // --- EQUIPAMENTOS ENVOLVIDOS (Página 1) ---
  if (data.equipamentos && Array.isArray(data.equipamentos)) {
    data.equipamentos.forEach((equipName) => {
      safeCheck(form, equipName);
    });
  }

  // --- DADOS DO EQUIPAMENTO COM DEFEITO (Página 1) ---
  if (data.equipamentoDefeito) {
    safeSetText(form, 'Equip com defeito', data.equipamentoDefeito.descricao);
    safeSetText(form, 'Marca', data.equipamentoDefeito.marca);
    safeSetText(form, 'Modelo', data.equipamentoDefeito.modelo);
    safeSetText(form, 'Patrimônio', data.equipamentoDefeito.patrimonio);
    safeSetText(form, 'Número Série ATIVO', data.equipamentoDefeito.numeroSerie);
    safeSetText(form, 'Equip NovoRecond', data.equipamentoDefeito.tipo);
  }

  // --- DADOS DO EQUIPAMENTO DE TROCA (Página 1) ---
  if (data.equipamentoTroca) {
    safeSetText(form, 'Número Série Troca', data.equipamentoTroca.numeroSerie);
    safeSetText(form, 'Marca_2', data.equipamentoTroca.marca);
    safeSetText(form, 'Modelo_2', data.equipamentoTroca.modelo);
    safeSetText(form, 'Equip NovoRecond_2', data.equipamentoTroca.tipo);
  }

  // --- PEÇAS/CABOS (Página 1 e 2) ---
  if (data.pecasCabos && Array.isArray(data.pecasCabos)) {
    data.pecasCabos.forEach((pecaName) => {
      safeCheck(form, pecaName);
    });
  }

  // --- LAUDO TÉCNICO (Página 2) ---
  safeSetText(form, 'Laudo Técnico', data.laudoTecnico);
  safeSetText(form, 'Observações', data.observacoes);

  // --- DADOS DO ATENDIMENTO (Página 2) ---
  safeSetText(form, 'Nome Técnico', data.nomeTecnico);
  safeSetText(form, 'Data', data.dataAtendimento);
  safeSetText(form, 'Hora Inicial', data.horaInicial);
  safeSetText(form, 'Hora Final', data.horaFinal);
  safeSetText(form, 'Técnico Alocado', data.tecnicoAlocado);

  // --- ACEITE CLIENTE (Página 2) ---
  safeSetText(form, 'Aceite Cliente', data.aceiteCliente);
  safeSetText(form, 'CPF', data.cpfCliente);
  safeSetText(form, 'E-mail', data.emailCliente);

  // --- CUSTOS EXTRAS (Página 2) ---
  if (data.custos) {
    safeSetText(form, 'T-EXTRA', data.custos.tExtra);
    safeSetText(form, 'KM-EXTRA', data.custos.kmExtra);
    safeSetText(form, 'PEDÁGIO', data.custos.pedagio);
    safeSetText(form, 'REFEIÇÃO', data.custos.refeicao);
    safeSetText(form, 'ESTACIONAMENTO', data.custos.estacionamento);
    safeSetText(form, 'OUTROS', data.custos.outros);
  }

  console.log('--- Preenchimento Finalizado ---');
}

/**
 * Função principal para gerar o PDF da RAT.
 */
export async function generateRatPdf(data: RatFormData) {
  console.log('Dados recebidos pela função generateRatPdf:', JSON.stringify(data, null, 2));

  try {
    const existingPdfBytes = await fetch(templatePdf).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    fillFormFields(form, data);

    const pdfBytes = await pdfDoc.save();

    const fileName = `RAT-${data.fsa || data.codigoLoja || 'preenchida'}.pdf`;
    downloadPdf(pdfBytes, fileName);
    console.log('Download do PDF iniciado.');
  } catch (error) {
    console.error('Erro CRÍTICO ao gerar o PDF da RAT:', error);
    alert('Não foi possível gerar o PDF. Verifique o console (F12) e confirme os nomes dos campos.');
  }
}
