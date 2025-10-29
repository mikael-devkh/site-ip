import { PDFDocument } from "pdf-lib";
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

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR");
}

function setTextField(form: any, fieldName: string, value?: string | null) {
  try {
    const field = form.getTextField(fieldName);
    field.setText(value ?? "");
  } catch (error) {
    console.warn(`Campo de texto não encontrado: ${fieldName}`, error);
  }
}

function setCheckBox(form: any, fieldName: string, checked: boolean) {
  try {
    const field = form.getCheckBox(fieldName);
    if (checked) {
      field.check();
    } else {
      field.uncheck();
    }
  } catch (error) {
    console.warn(`Checkbox não encontrado: ${fieldName}`, error);
  }
}

function fillFormFields(form: any, data: RatFormData) {
  setTextField(form, "Cliente", data.clienteNome || "");
  setTextField(form, "Codigo Loja", data.codigoLoja || "");
  setTextField(form, "PDV", data.pdv || "");
  setTextField(form, "FSA", data.fsa || "");
  setTextField(form, "Endereco", data.endereco || "");
  setTextField(form, "Cidade", data.cidade || "");
  setTextField(form, "UF", data.uf || "");
  setTextField(form, "Nome do solicitante", data.nomeSolicitante || "");

  setTextField(form, "Equip com defeito", data.descricaoProblema || data.defeitoProblema || "");
  setTextField(form, "Marca", data.marca || "");
  setTextField(form, "Modelo", data.modelo || "");
  setTextField(form, "Patrimonio", data.patrimonio || "");
  setTextField(form, "Numero Série ATIVO", data.serial || "");
  setTextField(form, "Equip NovoRecond", data.origemEquipamento || "");

  setTextField(form, "Numero Série Troca", data.numeroSerieTroca || "");
  setTextField(form, "Marca_2", data.marcaTroca || "");
  setTextField(form, "Modelo_2", data.modeloTroca || "");
  setTextField(form, "Equip NovoRecond_2", data.equipNovoRecond || "");

  setTextField(form, "Laudo Técnico", data.diagnosticoTestes || "");
  setTextField(form, "Observações", data.observacoesPecas || "");
  setTextField(form, "Solução Aplicada", data.solucaoAplicada || data.solucao || "");

  setCheckBox(form, "Problema Resolvido - Sim", data.problemaResolvido === "sim");
  setCheckBox(form, "Problema Resolvido - Não", data.problemaResolvido === "nao");
  setTextField(form, "Motivo Não Resolvido", data.motivoNaoResolvido || "");

  setCheckBox(form, "Haverá Retorno - Sim", data.haveraRetorno === "sim");
  setCheckBox(form, "Haverá Retorno - Não", data.haveraRetorno === "nao");

  setTextField(form, "Hora Inicial", data.horaInicio || "");
  setTextField(form, "Hora Final", data.horaTermino || "");
  setTextField(form, "Data", formatDate(data.data));

  setTextField(form, "Nome Técnico", data.prestadorNome || "");
  setTextField(form, "Técnico Alocado", data.prestadorNome || "");

  setTextField(form, "Aceite Cliente", data.clienteNome || "");
  setTextField(form, "CPF", data.clienteRgMatricula || "");
  setTextField(form, "E-mail", "");
}

export async function generateRatPdf(data: RatFormData) {
  try {
    const existingPdfBytes = await fetch(templatePdf).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    fillFormFields(form, data);

    const pdfBytes = await pdfDoc.save();
    const fileName = `RAT-${data.fsa || data.codigoLoja || "preenchida"}.pdf`;
    downloadPdf(pdfBytes, fileName);
  } catch (error) {
    console.error("Erro ao gerar o PDF da RAT:", error);
    alert("Não foi possível gerar o PDF. Verifique o console para mais detalhes.");
  }
}
