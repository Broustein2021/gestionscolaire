export type ColonneCSV = { cle: string; libelle: string }

/**
 * Export compatible Excel (séparateur « ; », BOM UTF-8, cellules avec
 * `;`/`"`/saut de ligne échappées entre guillemets).
 */
export function exporterCSV(
  nomFichier: string,
  colonnes: ColonneCSV[],
  lignes: Record<string, unknown>[],
) {
  const echapper = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const entete = colonnes.map((c) => echapper(c.libelle)).join(';')
  const corps = lignes
    .map((l) => colonnes.map((c) => echapper(l[c.cle])).join(';'))
    .join('\n')
  const csv = `\uFEFF${entete}\n${corps}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}