'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { EncaissementMensuel } from '@/lib/queries/dashboard'

const financeConfig = {
  attendu: { label: 'Attendu', color: 'var(--chart-4)' },
  encaisse: { label: 'Encaissé', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function FinanceChart({ data }: { data: EncaissementMensuel[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Aucune donnée financière pour cette période.
      </div>
    )
  }

  return (
    <ChartContainer config={financeConfig} className="h-[260px] w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mois" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => `${v}k`}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(v) => `${v} 000 FCFA`} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="attendu" fill="var(--color-attendu)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="encaisse" fill="var(--color-encaisse)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

export function CycleChart({ data }: { data: { cycle: string; eleves: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Aucun élève inscrit pour le moment.
      </div>
    )
  }

  const config = Object.fromEntries(
    data.map((d, i) => [d.cycle, { label: d.cycle, color: palette[i % palette.length] }]),
  ) satisfies ChartConfig

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square h-[260px]"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="cycle" />} />
        <Pie
          data={data}
          dataKey="eleves"
          nameKey="cycle"
          innerRadius={58}
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.cycle} fill={config[entry.cycle]?.color ?? palette[i % palette.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="cycle" />} />
      </PieChart>
    </ChartContainer>
  )
}