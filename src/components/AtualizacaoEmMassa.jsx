import React, { useState, useMemo } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, UserPlus, Edit, ArrowLeft, RefreshCw } from 'lucide-react';

const AtualizacaoEmMassa = ({ alunos, onBulkUpdate, onClose }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [step, setStep] = useState('upload'); // 'upload' ou 'review'
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Guarda as decisões do utilizador para cada aluno não encontrado
    const [reconciliationDecisions, setReconciliationDecisions] = useState({});

    const handleFileChange = (event) => {
        setCsvFile(event.target.files[0]);
        setResults(null);
    };

    const parseBrazilianDate = (dateString) => {
        if (!dateString) return null;
        const digitsOnly = dateString.replace(/\D/g, '');
        let day, month, year;
        if (digitsOnly.length === 8) { day = digitsOnly.substring(0, 2); month = digitsOnly.substring(2, 4); year = digitsOnly.substring(4, 8); } 
        else if (digitsOnly.length === 6) { day = digitsOnly.substring(0, 2); month = digitsOnly.substring(2, 4); let shortYear = parseInt(digitsOnly.substring(4, 6), 10); year = shortYear > 50 ? `19${shortYear}` : `20${shortYear}`; } 
        else { return null; }
        const date = new Date(`${year}-${month}-${day}`);
        return isNaN(date.getTime()) ? null : `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const processFile = () => {
        if (!csvFile) { alert("Por favor, selecione um ficheiro CSV primeiro."); return; }
        setIsLoading(true);
        window.Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            complete: (parsedResults) => {
                const toUpdate = [];
                const unmatched = [];
                const aAlunos = alunos.map(a => ({ ...a, lowerName: a.nome.trim().toLowerCase() }));

                parsedResults.data.forEach((row, index) => {
                    const searchName = row['Nome Completo']?.trim().toLowerCase();
                    if (!searchName) return;
                    const alunoExistente = aAlunos.find(a => a.lowerName === searchName);
                    
                    const rowData = {
                        nome: row['Nome Completo'],
                        contatos: [{ id: 1, parentesco: row['Parentesco'] || '', nome: row['Nome Contato'] || '', valor: row['Telefone Contato'] || '' }],
                        dataNascimento: parseBrazilianDate(row['Data de Nascimento']),
                        rg: row['RG'] || '', cpf: row['CPF'] || '',
                        diaVencimento: Number(row['Dia de Vencimento']) || null,
                        valorMensalidade: Number(row['Valor Mensalidade']) || null,
                        endereco: row['Endereço'] || '', problemasMedicos: row['Observações Médicas'] || '',
                    };

                    if (alunoExistente) {
                        toUpdate.push({ id: alunoExistente.id, nome: alunoExistente.nome, updates: rowData });
                    } else {
                        unmatched.push({ tempId: `unmatched_${index}`, data: rowData });
                    }
                });

                setResults({ toUpdate, unmatched });
                // Define a decisão padrão para todos os não encontrados como 'criar'
                const initialDecisions = unmatched.reduce((acc, item) => {
                    acc[item.tempId] = { action: 'create' };
                    return acc;
                }, {});
                setReconciliationDecisions(initialDecisions);

                setIsLoading(false);
                setStep('review');
            }
        });
    };
    
    const handleReconciliationChange = (tempId, action, targetId = null) => {
        setReconciliationDecisions(prev => ({
            ...prev,
            [tempId]: { action, targetId }
        }));
    };

    const handleCommitChanges = () => {
        const creations = [];
        const replacements = [];

        results.unmatched.forEach(item => {
            const decision = reconciliationDecisions[item.tempId];
            if (decision.action === 'create') {
                creations.push(item.data);
            } else if (decision.action === 'replace' && decision.targetId) {
                replacements.push({ targetId: decision.targetId, updates: item.data });
            }
        });
        
        onBulkUpdate(results.toUpdate, creations, replacements);
        onClose();
    };
    
    const downloadTemplate = () => { const headers = "Nome Completo,Parentesco,Nome Contato,Telefone Contato,Data de Nascimento,RG,CPF,Dia de Vencimento,Valor Mensalidade,Endereço,Observações Médicas"; const csvContent = "data:text/csv;charset=utf-8," + headers; const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "template_atualizacao_alunos.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); };

    if (step === 'upload') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                     <div className="flex justify-between items-center mb-4"> <h3 className="text-2xl font-bold text-gray-800">Atualização Cadastral em Massa</h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border"> <h4 className="font-semibold text-gray-700">1. Prepare a sua planilha</h4> <p className="text-sm text-gray-600 mt-1">Use o nosso modelo CSV. A coluna "Nome Completo" é usada para encontrar os alunos existentes.</p> <button onClick={downloadTemplate} className="mt-2 text-sm text-blue-600 font-semibold hover:underline flex items-center gap-2"> <FileText size={16}/> Baixar Modelo CSV </button> </div>
                        <div className="bg-gray-50 p-4 rounded-lg border"> <h4 className="font-semibold text-gray-700">2. Carregue o ficheiro</h4> <div className="mt-2 flex items-center gap-4"> <label htmlFor="csv-upload" className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"> <Upload size={16}/> <span>Selecionar Ficheiro</span> </label> <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" /> {csvFile && <span className="font-medium text-gray-800">{csvFile.name}</span>} </div> </div>
                        <div className="flex justify-end"> <button onClick={processFile} disabled={!csvFile || isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300"> {isLoading ? 'A analisar...' : 'Analisar Ficheiro'} </button> </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'review') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4"> <h3 className="text-2xl font-bold text-gray-800">Rever Alterações</h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div>
                    <div className="overflow-y-auto flex-grow space-y-4 pr-2">
                        {results.toUpdate.length > 0 && <div>
                            <h4 className="font-bold text-lg text-blue-700 flex items-center gap-2"><Edit size={18}/> {results.toUpdate.length} Aluno(s) para Atualizar</h4>
                            <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
                                {results.toUpdate.map(upd => <li key={upd.id}><span className="font-semibold">{upd.nome}</span> será atualizado.</li>)}
                            </ul>
                        </div>}
                        
                        {results.unmatched.length > 0 && <div className="pt-4 border-t">
                            <h4 className="font-bold text-lg text-orange-700 flex items-center gap-2"><AlertCircle size={18}/> {results.unmatched.length} Aluno(s) Não Encontrados</h4>
                            <p className="text-xs text-gray-500">Para cada aluno abaixo, decida se quer criar um novo registo ou substituir um existente (em caso de erro de digitação).</p>
                            <div className="mt-2 space-y-3">
                                {results.unmatched.map(item => (
                                    <div key={item.tempId} className="bg-gray-50 p-3 rounded-lg">
                                        <p className="font-semibold">{item.data.nome}</p>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center">
                                                <input type="radio" name={`action-${item.tempId}`} checked={reconciliationDecisions[item.tempId]?.action === 'create'} onChange={() => handleReconciliationChange(item.tempId, 'create')} className="h-4 w-4 text-blue-600"/>
                                                <span className="ml-2 text-sm">Criar Novo Aluno</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input type="radio" name={`action-${item.tempId}`} checked={reconciliationDecisions[item.tempId]?.action === 'replace'} onChange={() => handleReconciliationChange(item.tempId, 'replace')} className="h-4 w-4 text-blue-600"/>
                                                <span className="ml-2 text-sm">Substituir Existente:</span>
                                            </label>
                                        </div>
                                        {reconciliationDecisions[item.tempId]?.action === 'replace' && (
                                            <select 
                                                className="mt-2 w-full p-2 border rounded-md" 
                                                onChange={(e) => handleReconciliationChange(item.tempId, 'replace', e.target.value)}
                                                value={reconciliationDecisions[item.tempId]?.targetId || ''}
                                            >
                                                <option value="" disabled>Selecione o aluno a ser substituído...</option>
                                                {alunos.sort((a,b) => a.nome.localeCompare(b.nome)).map(aluno => (
                                                    <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>}
                    </div>
                    <div className="flex justify-between items-center pt-6 mt-4 border-t">
                        <button onClick={() => setStep('upload')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2"><ArrowLeft size={16}/> Voltar</button>
                        <button onClick={handleCommitChanges} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700">Confirmar e Salvar Alterações</button>
                    </div>
                </div>
            </div>
        );
    }
};

export default AtualizacaoEmMassa;
    
    