'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui';

const CHART_COLORS = ['#34D399', '#5B9BFF', '#F2A93B', '#F0555B', '#8B7FE8', '#2BB686'];

const tooltipStyle = {
  contentStyle: { background: '#152232', border: '1px solid #243449', borderRadius: 10, fontSize: 13 },
  labelStyle: { color: '#E9EEF3' },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="animate-fade-up hover:shadow-raised">
      <CardHeader>
        <p className="field-label">{title}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface DistRow {
  name: string;
  count: number;
}

/**
 * The recharts-heavy analytics grid. Split out from Dashboard.tsx and
 * loaded via next/dynamic (ssr: false) so the KPI header - the fast,
 * lightweight part of the page - never waits on the charting library.
 */
function DashboardCharts({
  trend,
  diagnosisDist,
  procedureDist,
  airwayDist,
  roleDist,
  cpb,
  total,
}: {
  trend: { month: string; count: number }[];
  diagnosisDist: DistRow[];
  procedureDist: DistRow[];
  airwayDist: DistRow[];
  roleDist: DistRow[];
  cpb: number;
  total: number;
}) {
  const cpbPie = [
    { name: 'CPB', value: cpb },
    { name: 'No CPB', value: total - cpb },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Case Volume Over Time">
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid stroke="#243449" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#8CA0B3" fontSize={11} tickLine={false} />
              <YAxis stroke="#8CA0B3" fontSize={11} allowDecimals={false} tickLine={false} width={24} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#34D399" strokeWidth={2.5} dot={{ r: 3, fill: '#34D399' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="CPB Usage">
        <div className="h-56 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={cpbPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {cpbPie.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#5B9BFF' : '#243449'} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-5 text-sm -mt-2">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-info" /> CPB · {cpb}
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-line2" /> No CPB · {total - cpb}
          </span>
        </div>
      </ChartCard>

      <ChartCard title="Diagnosis Distribution">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diagnosisDist} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#243449" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#8CA0B3" fontSize={11} allowDecimals={false} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#8CA0B3" fontSize={11} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {diagnosisDist.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Procedure Distribution">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={procedureDist} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#243449" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#8CA0B3" fontSize={11} allowDecimals={false} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#8CA0B3" fontSize={11} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {procedureDist.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Airway Difficulty">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={airwayDist}>
              <CartesianGrid stroke="#243449" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#8CA0B3" fontSize={11} tickLine={false} />
              <YAxis stroke="#8CA0B3" fontSize={11} allowDecimals={false} tickLine={false} width={24} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#F2A93B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Role Distribution">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleDist}>
              <CartesianGrid stroke="#243449" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#8CA0B3" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="#8CA0B3" fontSize={11} allowDecimals={false} tickLine={false} width={24} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#8B7FE8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

export default memo(DashboardCharts);
