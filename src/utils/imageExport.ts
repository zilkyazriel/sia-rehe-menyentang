import { toPng } from 'html-to-image';

/**
 * Ekspor elemen HTML menjadi gambar PNG utuh berkualitas tinggi.
 * Menangani elemen dengan scroll horizontal (bracket panjang, tabel klasemen & H2H)
 * dan membatasi ukuran canvas agar tidak melebihi limit memori browser HP (mencegah gambar putih/blank).
 */
export async function exportElementAsImage(
  element: HTMLElement,
  filename: string,
  title: string
): Promise<boolean> {
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#121c17' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

  // 1. Wrapper tersembunyi di pojok DOM tanpa merusak koordinat canvas
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '0';
  wrapper.style.width = '0';
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '-99999';
  wrapper.style.pointerEvents = 'none';

  // 2. Kartu ekspor yang akan difoto (memakai position relative, bukan fixed)
  const exportCard = document.createElement('div');
  exportCard.className = isDark ? 'dark' : 'light';
  exportCard.style.position = 'relative';
  exportCard.style.left = '0';
  exportCard.style.top = '0';
  exportCard.style.width = 'max-content';
  exportCard.style.maxWidth = 'none';
  exportCard.style.backgroundColor = bgColor;
  exportCard.style.color = textColor;
  exportCard.style.padding = '24px';
  exportCard.style.borderRadius = '20px';
  exportCard.style.fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";

  // Header branding pada gambar hasil ekspor
  const headerBrand = document.createElement('div');
  headerBrand.style.marginBottom = '20px';
  headerBrand.style.paddingBottom = '14px';
  headerBrand.style.borderBottom = `1px solid ${borderColor}`;
  headerBrand.style.display = 'flex';
  headerBrand.style.alignItems = 'center';
  headerBrand.style.justifyContent = 'space-between';
  headerBrand.style.gap = '24px';
  headerBrand.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:36px;height:36px;border-radius:10px;background-color:#059669;color:#ffffff;display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-weight:bold;font-size:18px;box-shadow:0 2px 6px rgba(5,150,105,0.3);">8</div>
      <div>
        <div style="font-family:Oswald,sans-serif;font-weight:bold;font-size:20px;letter-spacing:0.04em;line-height:1;color:${textColor};text-transform:uppercase;">SIA REHE MENYENTANG</div>
        <div style="font-size:12px;color:${subtextColor};font-weight:600;margin-top:3px;">${title}</div>
      </div>
    </div>
    <div style="font-size:12px;color:${subtextColor};font-weight:600;font-family:Oswald,sans-serif;letter-spacing:0.03em;">
      ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
    </div>
  `;
  exportCard.appendChild(headerBrand);

  // 3. Clone elemen target
  const clone = element.cloneNode(true) as HTMLElement;

  // Hapus semua tombol atau kontrol aksi dengan class 'no-export'
  const noExportEls = clone.querySelectorAll('.no-export');
  noExportEls.forEach(el => el.remove());

  // Buka semua batasan lebar dan overflow pada elemen anak agar seluruh kolom tampil utuh
  const allChildren = clone.querySelectorAll<HTMLElement>('*');
  allChildren.forEach(el => {
    el.style.maxWidth = 'none';

    if (
      el.classList.contains('overflow-x-auto') ||
      el.classList.contains('overflow-auto') ||
      el.classList.contains('overflow-scroll')
    ) {
      el.style.overflow = 'visible';
      el.style.overflowX = 'visible';
      el.style.width = 'max-content';
    }
  });

  clone.style.overflow = 'visible';
  clone.style.maxWidth = 'none';
  clone.style.width = 'max-content';
  exportCard.appendChild(clone);

  wrapper.appendChild(exportCard);
  document.body.appendChild(wrapper);

  try {
    // Hitung dimensi sebenarnya dari konten yang sudah dibuka penuh
    const targetWidth = Math.max(exportCard.scrollWidth, exportCard.offsetWidth, 560);
    const targetHeight = Math.max(exportCard.scrollHeight, exportCard.offsetHeight);

    // Keamanan memori canvas di HP: batasi resolusi maksimal 3000px agar browser HP tidak kehabisan memori canvas
    const maxDimension = Math.max(targetWidth, targetHeight);
    let pixelRatio = 2;
    if (maxDimension * pixelRatio > 3000) {
      pixelRatio = Math.max(1, Math.min(2, 3000 / maxDimension));
    }

    const dataUrl = await toPng(exportCard, {
      quality: 0.95,
      pixelRatio,
      backgroundColor: bgColor,
      width: targetWidth,
      height: targetHeight,
      cacheBust: false,
    });

    // Coba Web Share API jika didukung di HP (langsung share ke WhatsApp/Galeri)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${filename}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `SIA REHE MENYENTANG - ${title}`,
            files: [file],
          });
          return true;
        }
      } catch (shareErr) {
        if (shareErr instanceof Error && shareErr.name === 'AbortError') {
          return true;
        }
      }
    }

    // Fallback unduh langsung ke memori/galeri perangkat
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
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}
