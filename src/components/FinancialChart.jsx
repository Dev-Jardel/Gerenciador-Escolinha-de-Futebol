import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialChart = ({ transacoes, alunos }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const availableYears = useMemo(() => {
        const allDates = [
            ...(transacoes || []).map(t => new Date(t.data + 'T00:00:00').getFullYear()),
            ...(alunos || []).flatMap(a => (a.pagamentos || []).map(p => p.dataPagamento ? new Date(p.dataPagamento + 'T00:00:00').getFullYear() : null))
        ];
        const years = [...new Set(allDates.filter(Boolean))];
        if (!years.includes(selectedYear)) {
            years.push(selectedYear);
        }
        return years.sort((a, b) => b - a);
    }, [transacoes, alunos, selectedYear]);

    const chartData = useMemo(() => {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
            receita: 0,
            despesa: 0,
        }));

        const hoje = new Date();

        // Processa pagamentos de alunos
        (alunos || []).forEach(aluno => {
            (aluno.pagamentos || []).forEach(p => {
                if (p.status === 'Pago' && p.dataPagamento) {
                    const dataPag = new Date(p.dataPagamento + 'T00:00:00');
                    if (dataPag.getFullYear() === selectedYear && dataPag <= hoje) {
                        monthlyData[dataPag.getMonth()].receita += p.valor;
                    }
                }
            });
        });

        // Processa transações gerais
        (transacoes || []).forEach(t => {
            const dataTransacao = new Date(t.data + 'T00:00:00');
            if (dataTransacao.getFullYear() === selectedYear && dataTransacao <= hoje) {
                if (t.tipo === 'Receita') {
                    monthlyData[dataTransacao.getMonth()].receita += t.valor;
                } else {
                    monthlyData[dataTransacao.getMonth()].despesa += t.valor;
                }
            }
        });

        return monthlyData;
    }, [transacoes, alunos, selectedYear]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700">Evolução Financeira Anual</h3>
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="p-2 border rounded-lg shadow-sm"
                >
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `R$${value}`} />
                        <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="receita" fill="#22c55e" name="Receita" />
                        <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FinancialChart;

