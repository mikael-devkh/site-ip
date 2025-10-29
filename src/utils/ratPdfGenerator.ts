import { PDFDocument, PDFPage, PDFFont, PDFTextField, StandardFonts } from "pdf-lib";
import ratTemplateUrl from "../assets/rat-template.pdf?url";
import { RatFormData } from "../types/rat";
import { origemEquipamentoOptions } from "../data/ratOptions";

const log = (...args: any[]) => console.debug("[RAT]", ...args);

// Helper para setar texto em campos do formulário
function setTextSafe(form: any, fieldName: string, value?: string | null) {
  const textValue = value === undefined || value === null ? "" : String(value);
  try {
    form.getTextField(fieldName).setText(textValue);
  } catch {
    if (!textValue) return;
    try {
      form.getDropdown(fieldName).select(textValue);
    } catch {}
  }
}

// Helper para dividir texto em linhas
const splitLines = (text?: string, maxLines = 4) =>
  (text ?? "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, maxLines);

const getOrigemCodigo = (value?: string) => {
  if (!value) return "";
  const [codigo] = value.split("-");
  return codigo?.trim() ?? "";
};

const formatDateBr = (value?: string) => {
  if (!value) return "";
  const [datePart] = value.split("T");
  const match = datePart?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("pt-BR");
};

const normalizeHour = (hour?: string) => (hour ? hour.replace(/\s+/g, "") : hour);

interface DrawWrappedTextOptions {
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  size?: number;
}

const drawWrappedText = (
  page: PDFPage,
  font: PDFFont,
  text: string | undefined,
  { x, y, maxWidth, lineHeight, size = 10 }: DrawWrappedTextOptions,
) => {
  const safeText = text?.trim();
  if (!safeText) {
    return;
  }

  page.drawText(safeText.replace(/\r\n/g, "\n"), {
    x,
    y,
    size,
    font,
    maxWidth,
    lineHeight,
  });
};

const descricaoProblemaArea = {
  x: 29.28,
  top: 387.924,
  bottom: 347.04,
  width: 551.88,
};

const solucaoAplicadaArea = {
  x: 29.28,
  top: 215.76,
  bottom: 195,
  width: 551.88,
};

export const generateRatPDF = async (formData: RatFormData) => {
  try {
    log("Carregando template RAT...");
    const pdfBytes = await fetch(ratTemplateUrl).then((res) => res.arrayBuffer());

    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Limpa qualquer valor pré-existente no template antes de preencher
    try {
      form.getFields().forEach((field) => {
        if (field instanceof PDFTextField) {
          field.setText("");
        }
      });
    } catch (e) {
      log("Não foi possível limpar os campos do formulário:", e);
    }

    // IDENTIFICAÇÃO
    setTextSafe(form, "CódigodaLoja", formData.codigoLoja);
    setTextSafe(form, "PDV", formData.pdv);
    setTextSafe(form, "FSA", formData.fsa);
    setTextSafe(form, "Endereço", formData.endereco);
    setTextSafe(form, "Cidade", formData.cidade);
    setTextSafe(form, "UF", formData.uf);
    setTextSafe(form, "Nomedosolicitante", formData.nomeSolicitante);

    // EQUIPAMENTOS ENVOLVIDOS - Removido

    // DADOS DO EQUIPAMENTO
    setTextSafe(form, "Serial", formData.serial);
    setTextSafe(form, "Patrimonio", formData.patrimonio);
    setTextSafe(form, "Marca", formData.marca);
    setTextSafe(form, "Modelo", formData.modelo);

    const possuiTroca =
      formData.houveTroca === "sim" || (!formData.houveTroca && !!formData.origemEquipamento);

    if (possuiTroca) {
      if (formData.origemEquipamento) {
        const origemOption = origemEquipamentoOptions.find(
          (option) => option.value === formData.origemEquipamento,
        );
        if (origemOption) {
          setTextSafe(form, "Origem", getOrigemCodigo(origemOption.value));
        } else if (formData.equipNovoRecond) {
          setTextSafe(form, "Origem", formData.equipNovoRecond);
        }
      } else if (formData.equipNovoRecond) {
        setTextSafe(form, "Origem", formData.equipNovoRecond);
      }

      if (formData.numeroSerieTroca) {
        setTextSafe(form, "SerialNovo", formData.numeroSerieTroca);
      }
      setTextSafe(form, "MarcaNovo", formData.marcaTroca);
      setTextSafe(form, "ModeloNovo", formData.modeloTroca);
    }

    // PEÇAS/CABOS - Removido
    
    // PEÇAS IMPRESSORA - Removido

    // OBSERVAÇÕES PEÇAS
    const observacoesLines = splitLines(formData.observacoesPecas, 3);
    setTextSafe(form, "Row1", observacoesLines[0] ?? "");
    setTextSafe(form, "Row2", observacoesLines[1] ?? "");
    setTextSafe(form, "Row3", observacoesLines[2] ?? "");

    // DEFEITO/PROBLEMA
    const descricaoProblema = formData.descricaoProblema ?? formData.defeitoProblema;
    drawWrappedText(page, font, descricaoProblema, {
      x: descricaoProblemaArea.x,
      y: descricaoProblemaArea.top - 10,
      maxWidth: descricaoProblemaArea.width,
      lineHeight: 12,
    });

    // Limpa os campos antigos caso existam no template
    setTextSafe(form, "DefeitoProblemaRow1", "");
    setTextSafe(form, "DefeitoProblemaRow2", "");

    // DIAGNÓSTICO/TESTES
    const diagnosticoLines = splitLines(formData.diagnosticoTestes, 4);
    setTextSafe(form, "DiagnósticoTestesrealizadosRow1", diagnosticoLines[0] ?? "");
    setTextSafe(form, "DiagnósticoTestesrealizadosRow2", diagnosticoLines[1] ?? "");
    setTextSafe(form, "DiagnósticoTestesrealizadosRow3", diagnosticoLines[2] ?? "");
    setTextSafe(form, "DiagnósticoTestesrealizadosRow4", diagnosticoLines[3] ?? "");

    // SOLUÇÃO
    const solucaoAplicada = formData.solucaoAplicada ?? formData.solucao;
    drawWrappedText(page, font, solucaoAplicada, {
      x: solucaoAplicadaArea.x,
      y: solucaoAplicadaArea.top - 10,
      maxWidth: solucaoAplicadaArea.width,
      lineHeight: 12,
    });
    setTextSafe(form, "SoluçãoRow1", "");

    // PROBLEMA RESOLVIDO
    if (formData.problemaResolvido === "sim") {
      setTextSafe(form, "SimProblemaresolvido", "X");
    } else if (formData.problemaResolvido === "nao") {
      setTextSafe(form, "NãoProblemaresolvido", "X");
      setTextSafe(form, "Motivo", formData.motivoNaoResolvido);
    }

    // HAVERÁ RETORNO
    if (formData.haveraRetorno === "sim") {
      setTextSafe(form, "SimHaveráretorno", "X");
    } else if (formData.haveraRetorno === "nao") {
      setTextSafe(form, "NãoHaveráretorno", "X");
    }

    // HORÁRIOS E DATA
    setTextSafe(form, "Horainício", normalizeHour(formData.horaInicio));
    setTextSafe(form, "Horatérmino", normalizeHour(formData.horaTermino));
    
    setTextSafe(form, "DATA", formatDateBr(formData.data));

    // CLIENTE
    setTextSafe(form, "NOMELEGÍVEL", formData.clienteNome);
    setTextSafe(form, "RGOUMATRÍCULA", formData.clienteRgMatricula);
    setTextSafe(form, "TELEFONE", formData.clienteTelefone);

    // PRESTADOR
    setTextSafe(form, "NOMELEGÍVEL_2", formData.prestadorNome);
    setTextSafe(form, "MATRÍCULA", formData.prestadorRgMatricula);
    setTextSafe(form, "TELEFONE_2", formData.prestadorTelefone);

    // Achatar o formulário para tornar os campos não-editáveis
    try {
      form.flatten();
    } catch (e) {
      log("Não foi possível achatar o formulário:", e);
    }

    // Salvar e abrir PDF
    const bytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(Array.from(bytes)).buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    
    log("PDF gerado com sucesso!");
    return { url };
  } catch (error) {
    console.error("[RAT] Erro ao gerar PDF:", error);
    throw error;
  }
};
