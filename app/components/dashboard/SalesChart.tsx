import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
    { name: 'Jan', ventes: 15, locations: 12 },
    { name: 'Feb', ventes: 22, locations: 16 },
    { name: 'Mar', ventes: 18, locations: 14 },
    { name: 'Apr', ventes: 32, locations: 24 },
    { name: 'May', ventes: 24, locations: 19 },
    { name: 'Jun', ventes: 32, locations: 21 },
    { name: 'Jul', ventes: 25, locations: 17 },
    { name: 'Aug', ventes: 38, locations: 22 },
    { name: 'Sep', ventes: 45, locations: 28 },
];

export function SalesChart() {
    return (
        <div className="h-[400px] w-full rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">Graphiques ventes / locations</h3>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="ventes"
                            name="Ventes"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="locations"
                            name="Locations"
                            stroke="#93C5FD"
                            strokeWidth={3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
