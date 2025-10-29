import { PDFDocument } from "pdf-lib";
import { openPdf } from "@/utils/pdfViewer";
import { RatFormData } from "@/types/rat";
import ratFormUrl from "@/assets/RAT.pdf?url";

// helpers
function setTextSafe(form: any, name: string, value?: string) {
  try { if (value !== undefined && value !== null) form.getTextField(name).setText(String(value)); } catch {}
}
function setCheckSafe(form: any, name: string, checked: boolean) {
  try { const c = form.getCheckBox(name); checked ? c.check() : c.uncheck(); } catch {}
}

export const generateRatPDF = async (formData: RatFormData) => {
  const existingPdfBytes = await fetch(ratFormUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  // (debug) liste os nomes de campos no console
  try { console.log("Campos:", form.getFields().map((f: any) => f.getName())); } catch {}

  // Identificação
  setTextSafe(form, "CódigodaLoja", formData.codigoLoja);
  setTextSafe(form, "PDV", formData.pdv);
  setTextSafe(form, "FSA", formData.fsa);
  setTextSafe(form, "Endereço", formData.endereco);
  setTextSafe(form, "Cidade", formData.cidade);
  setTextSafe(form, "UF", formData.uf);
  setTextSafe(form, "Nomedosolicitante", formData.nomeSolicitante);

  // Equipamento
  setTextSafe(form, "Serial", formData.patrimonioNumeroSerie);
  setTextSafe(form, "Equipcomdefeito", formData.equipComDefeito);
  setTextSafe(form, "Marca", formData.marca);
  setTextSafe(form, "Modelo", formData.modelo);
  setTextSafe(form, "Origem", formData.origemEquipamento);

  // Troca
  if (formData.numeroSerieTroca) {
    setTextSafe(form, "SerialNovo", formData.numeroSerieTroca);
    setTextSafe(form, "EquipNovoRecond", formData.equipNovoRecond || "");
    setTextSafe(form, "MarcaNovo", formData.marcaTroca);
    setTextSafe(form, "ModeloNovo", formData.modeloTroca);
  }

  const split = (s?: string, n = 4) =>
    (s ?? "").split(/\r?\n/).map(t => t.trim()).filter(Boolean).slice(0, n);

  const def = split(formData.defeitoProblema, 2);
  setTextSafe(form, "DefeitoProblemaRow1", def[0]);
  setTextSafe(form, "DefeitoProblemaRow2", def[1]);

  const diag = split(formData.diagnosticoTestes, 4);
  setTextSafe(form, "DiagnósticoTestesrealizadosRow1", diag[0]);
  setTextSafe(form, "DiagnósticoTestesrealizadosRow2", diag[1]);
  setTextSafe(form, "DiagnósticoTestesrealizadosRow3", diag[2]);
  setTextSafe(form, "DiagnósticoTestesrealizadosRow4", diag[3]);

  const sol = split(formData.solucao, 2);
  setTextSafe(form, "SoluçãoRow1", sol[0]);
  setTextSafe(form, "SoluçãoRow2", sol[1]);

  // status
  setCheckSafe(form, "mauUso_sim", formData.mauUso === "sim");
  setCheckSafe(form, "mauUso_nao", formData.mauUso === "nao");

  setCheckSafe(form, "SimProblemaresolvido", formData.problemaResolvido === "sim");
  setCheckSafe(form, "NãoProblemaresolvido", formData.problemaResolvido === "nao");
  if (formData.problemaResolvido === "nao") {
    setTextSafe(form, "motivoNaoResolvido", formData.motivoNaoResolvido);
  }

  setCheckSafe(form, "SimHaveráretorno", formData.haveraRetorno === "sim");
  setCheckSafe(form, "NãoHaveráretorno", formData.haveraRetorno === "nao");

  // horários/data
  setTextSafe(form, "Horainício", formData.horaInicio);
  setTextSafe(form, "Horatérmino", formData.horaTermino);
  const dataBR = formData.data ? new Date(formData.data).toLocaleDateString("pt-BR") : "";
  setTextSafe(form, "DATA", dataBR);

  // cliente
  setTextSafe(form, "NOMELEGÍVEL", formData.clienteNome);
  setTextSafe(form, "RGOUMATRÍCULA", formData.clienteRgMatricula);
  setTextSafe(form, "TELEFONE", formData.clienteTelefone);

  // prestador
  setTextSafe(form, "NOMELEGÍVEL_2", formData.prestadorNome);
  setTextSafe(form, "MATRÍCULA", formData.prestadorRgMatricula);
  setTextSafe(form, "TELEFONE_2", formData.prestadorTelefone);

  try { form.flatten(); } catch {}

  const bytes = await pdfDoc.save();
  await openPdf(new Uint8Array(bytes), "RAT.pdf");
};
