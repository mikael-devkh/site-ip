// src/utils/ratPdfGenerator.ts

import { PDFDocument, PDFForm } from "pdf-lib";
import { RatFormData } from "../types/rat";
import templatePdf from "../assets/rat-template.pdf?url";

function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function safeSetText(form: PDFForm, fieldName: string, value: unknown) {
  try {
    const textValue = String(value ?? "");
    if (textValue.trim() === "") {
      console.warn(`Campo [${fieldName}] está vazio ou nulo.`);
      return;
    }

    const field = form.getTextField(fieldName);
    field.setText(textValue);
    console.log(`Campo [${fieldName}] preenchido com: "${textValue}"`);
  } catch (error) {
    console.error(`Falha ao preencher o campo [${fieldName}]. Ele existe no PDF?`, error);
  }
}

function safeCheck(form: PDFForm, fieldName: string) {
  try {
    const field = form.getCheckBox(fieldName);
    field.check();
    console.log(`Checkbox [${fieldName}] marcado.`);
  } catch (error) {
    console.error(`Falha ao marcar o checkbox [${fieldName}]. Ele existe no PDF?`, error);
  }
}

function fillFormFields(form: PDFForm, data: RatFormData) {
  console.log("Iniciando preenchimento com a estrutura de dados CORRETA (FLAT)...");

  safeSetText(form, "Codigo Loja", data.codigoLoja);
  safeSetText(form, "PDV", data.pdv);
  safeSetText(form, "FSA", data.fsa);
  safeSetText(form, "Endereco", data.endereco);
  safeSetText(form, "Cidade", data.cidade);
  safeSetText(form, "UF", data.uf);
  safeSetText(form, "Nome do solicitante", data.nomeSolicitante);

  safeSetText(form, "Equip com defeito", data.defeitoProblema);
  safeSetText(form, "Marca", data.marca);
  safeSetText(form, "Modelo", data.modelo);
  safeSetText(form, "Patrimonio", data.patrimonio);
  safeSetText(form, "Numero Série ATIVO", data.serial);
  safeSetText(form, "Equip NovoRecond", data.origemEquipamento);

  if (data.houveTroca && data.houveTroca.toLowerCase().includes("sim")) {
    console.log("Houve troca, preenchendo campos de equipamento de troca...");
    safeSetText(form, "Numero Série Troca", data.numeroSerieTroca);
    safeSetText(form, "Marca_2", data.marcaTroca);
    safeSetText(form, "Modelo_2", data.modeloTroca);
    safeSetText(form, "Equip NovoRecond_2", data.equipNovoRecond);
  } else {
    console.log("Não houve troca, campos de troca permanecerão em branco.");
  }

  const laudoTecnico = `
DIAGNÓSTICO E TESTES:
${data.diagnosticoTestes || "Não informado."}

SOLUÇÃO APLICADA:
${data.solucao || "Não informado."}
  `;
  safeSetText(form, "Laudo Técnico", laudoTecnico.trim());
  safeSetText(form, "Observações", data.observacoesPecas);

  safeSetText(form, "Nome Técnico", data.prestadorNome);
  safeSetText(form, "Técnico Alocado", data.prestadorNome);
  safeSetText(form, "Data", data.data);
  safeSetText(form, "Hora Inicial", data.horaInicio);
  safeSetText(form, "Hora Final", data.horaTermino);

  safeSetText(form, "Aceite Cliente", data.clienteNome);
  safeSetText(form, "CPF", data.clienteRgMatricula);
  safeSetText(form, "E-mail", "");

  console.log("Preenchimento dos campos finalizado.");
}

export async function generateRatPdf(data: RatFormData) {
  console.log("---------------------------------------");
  console.log("Dados recebidos para gerar PDF:", JSON.stringify(data, null, 2));
  console.log("---------------------------------------");

  try {
    const existingPdfBytes = await fetch(templatePdf).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    fillFormFields(form, data);

    const pdfBytes = await pdfDoc.save({ flatten: true });
    const fileName = `RAT-${data.fsa || data.codigoLoja || "preenchida"}.pdf`;
    downloadPdf(pdfBytes, fileName);
  } catch (error) {
    console.error("Erro ao gerar o PDF da RAT:", error);
    alert("Não foi possível gerar o PDF. Verifique o console (F12) para mais detalhes.");
  }
}
