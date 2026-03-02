import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { PricePoint } from '../lib/api'

export default function PriceChart({ data }: { data: PricePoint[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-ink-3 text-sm">
        Недостаточно данных
      </div>
    )
  }

  const chartData = data.map((p) => ({
    time: format(new Date(p.timestamp), 'd MMM', { locale: ru }),
    yes:  +(p.price_yes * 100).toFixed(1),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 shadow-modal text-xs">
        <p className="text-ink-3 mb-1">{label}</p>
        <p className="text-yes font-bold">YES {payload[0]?.value}%</p>
        <p className="text-no font-bold">NO {(100 - payload[0]?.value).toFixed(1)}%</p>
      </div>
    )
  }

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="grad-yes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#00C076" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#00C076" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: '#555570', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#555570', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="#00C076"
            strokeWidth={2}
            fill="url(#grad-yes)"
            dot={false}
            activeDot={{ r: 4, fill: '#00C076', stroke: '#09090E', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
