import { toPng } from 'html-to-image';

/**
 * Ekspor elemen HTML menjadi gambar PNG berkualitas tinggi
 * Otomatis menggunakan Web Share API jika didukung di HP (langsung share ke WA/Galeri)
 * atau fallback ke unduh file langsung.
 */
export async function exportElementAsImage(
  element: HTMLElement,
  filename: string,
  title: string
): Promise<boolean> {
  try {
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#121c17' : '#ffffff';

    // Tambahkan padding dan styling sementara untuk header branding di gambar
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: bgColor,
      cacheBust: true,
      filter: node => {
        // Jangan sertakan tombol aksi yang memiliki class 'no-export'
        if (node instanceof HTMLElement && node.classList.contains('no-export')) {
          return false;
        }
        return true;
      },
    });

    // Coba Web Share API jika didukung (HP Android & iOS)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${filename}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            files: [file],
          });
          return true;
        }
      } catch (shareErr) {
        // Jika user membatalkan share dialog, jangan anggap error fatal
        if (shareErr instanceof Error && shareErr.name === 'AbortError') {
          return true;
        }
      }
    }

    // Fallback: Unduh file PNG langsung ke perangkat
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Gagal mengekspor gambar:', err);
    return false;
  }
}
