import { toPng } from 'html-to-image';

/**
 * Ekspor elemen HTML menjadi gambar PNG utuh berkualitas tinggi (Retina 2x).
 * Menangani elemen dengan scroll horizontal (bracket lebar, tabel klasemen & H2H)
 * sehingga SELURUH konten dari kiri sampai kanan tertangkap penuh tanpa terpotong!
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

  // 1. Buat off-screen clone container tanpa batasan layar HP
  const container = document.createElement('div');
  container.className = isDark ? 'dark' : 'light';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = 'max-content';
  container.style.maxWidth = 'none';
  container.style.zIndex = '-99999';
  container.style.backgroundColor = bgColor;
  container.style.color = textColor;
  container.style.padding = '24px';
  container.style.borderRadius = '20px';
  container.style.fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";

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
  container.appendChild(headerBrand);

  // 2. Clone elemen yang ingin diekspor
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
  container.appendChild(clone);

  document.body.appendChild(container);

  try {
    // Hitung dimensi sebenarnya dari konten yang sudah dibuka penuh
    const fullWidth = Math.max(container.scrollWidth, container.offsetWidth, 560);
    const fullHeight = Math.max(container.scrollHeight, container.offsetHeight);

    const dataUrl = await toPng(container, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: bgColor,
      width: fullWidth,
      height: fullHeight,
      cacheBust: true,
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
    document.body.removeChild(container);
  }
}
