import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Browser } from "@capacitor/browser";

const isAndroid = () =>
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

export async function openPdf(bytes: Uint8Array, filename = "RAT.pdf") {
  const b64 = btoa(String.fromCharCode(...bytes));

  if (isAndroid()) {
    const path = `rat/${Date.now()}-${filename}`;
    await Filesystem.writeFile({
      path,
      data: b64,
      directory: Directory.Cache,
      recursive: true
    });

    try {
      const { uri } = await Filesystem.getUri({
        path,
        directory: Directory.Cache
      });
      await Share.share({
        title: "RAT",
        text: "RAT gerada",
        url: uri,
        dialogTitle: "Abrir/Compartilhar PDF"
      });
      return;
    } catch {
      const { uri } = await Filesystem.getUri({
        path,
        directory: Directory.Cache
      });
      await Browser.open({ url: uri });
      return;
    }
  }

  // Web/desktop fallback
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
