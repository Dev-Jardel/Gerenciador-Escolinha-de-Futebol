import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentsChart = ({ alunos }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Encontra todos os anos únicos em que os alunos foram adicionados para popular o filtro
    const availableYears = useMemo(() => {
        const years = (alunos || []).map(aluno => {
            if (!aluno.dataAdicao) return null;
            return new Date(aluno.dataAdicao + 'T00:00:00').getFullYear();
        });
        // Adiciona o ano atual, caso não haja registos para ele
        if (!years.includes(new Date().getFullYear())) {
            years.push(new Date().getFullYear());
        }
        return [...new Set(years.filter(Boolean))].sort((a, b) => b - a);
    }, [alunos]);

    // Prepara os dados para o gráfico
    const chartData = useMemo(() => {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(2000, i).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
            Alunos: 0,
        }));

        // Filtra os alunos que entraram até o ano selecionado
        const relevantAlunos = (alunos || []).filter(aluno => {
            if (!aluno.dataAdicao) return false;
            return new Date(aluno.dataAdicao + 'T00:00:00').getFullYear() <= selectedYear;
        });

        // Calcula o número total de alunos no final de cada mês
        monthlyData.forEach((month, index) => {
            const endOfMonth = new Date(selectedYear, index + 1, 0);
            month.Alunos = relevantAlunos.filter(aluno => {
                const dataAdicao = new Date(aluno.dataAdicao + 'T00:00:00');
                return dataAdicao <= endOfMonth;
            }).length;
        });

        return monthlyData;

    }, [alunos, selectedYear]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700">Evolução do Número de Alunos</h3>
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="p-2 border rounded-lg shadow-sm bg-gray-50"
                >
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} alunos`, 'Total']} />
                        <Legend />
                        <Line type="monotone" dataKey="Alunos" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StudentsChart;

