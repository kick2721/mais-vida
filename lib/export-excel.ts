// lib/export-excel.ts
// Helper para exportar dados para Excel — usa SheetJS via CDN (sem npm install)

export async function exportToExcel(
  rows: Record<string, string | number | null | undefined>[],
  filename: string
) {
  // Carrega SheetJS do CDN apenas quando o utilizador clica — sem custo no bundle
  const XLSX: any = await new Promise((resolve, reject) => {
    if ((window as any).XLSX) { resolve((window as any).XLSX); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    script.onload = () => resolve((window as any).XLSX)
    script.onerror = reject
    document.head.appendChild(script)
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')

  // Auto-width colunas
  if (rows.length > 0) {
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] ?? '').length)) + 2,
    }))
    ws['!cols'] = colWidths
  }

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-AO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
