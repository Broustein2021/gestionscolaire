'use client'

import { Button } from '@/components/ui/button'
import { exporterCSV, type ColonneCSV } from '@/lib/csv'

export function CsvExportButton({
  nomFichier,
  colonnes,
  lignes,
  children,
}: {
  nomFichier: string
  colonnes: ColonneCSV[]
  lignes: Record<string, unknown>[]
  children: React.ReactNode
}) {
  return (
    <Button variant="outline" onClick={() => exporterCSV(nomFichier, colonnes, lignes)}>
      {children}
    </Button>
  )
}