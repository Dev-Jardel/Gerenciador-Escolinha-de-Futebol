import React, { useState, useEffect, useRef, useMemo  } from 'react';
import { APP_VERSION, UPDATE_NOTES } from './version.js';
import UpdateNotesModal from './components/UpdateNotesModal.jsx';
import FinancialChart from './components/FinancialChart.jsx';
import { PERMISSIONS, ROLES } from './permissions.js';
import AtualizacaoEmMassa from './components/AtualizacaoEmMassa.jsx';
import StudentsChart from './components/StudentsChart.jsx';


// Importações do Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";



// Importações de ícones
import { User, Shield, DollarSign, Users, BarChart2, Bell, Settings, LogOut, Plus, Search, X, Mail, Trash2, Edit, ArrowLeft, 
  Upload, FileText, Image as ImageIcon, Clock, Sparkles, Loader, ChevronLeft, ChevronRight, Printer, Cake, MoreVertical, 
  Share2, Download, Check, Copy, PlusCircle, ClipboardList, CalendarDays, Ruler, Weight, UserPlus, Phone, AlertTriangle, 
  RotateCcw, UserX, Target, Tag, MapPin, ChevronDown, ChevronUp, Eye, EyeOff, ClipboardCheck, MessageCircle,Send } from 'lucide-react';


// --- Configuração do Firebase ---
// Sua configuração pessoal do Firebase que você colou
const firebaseConfig = {
  apiKey: "AIzaSyDcY1-29jWmbnpBDePgAmJfWhr79Nsl7Ug",
  authDomain: "gestor-futebol-app.firebaseapp.com",
  projectId: "gestor-futebol-app",
  storageBucket: "gestor-futebol-app.firebasestorage.app",
  messagingSenderId: "643691351263",
  appId: "1:643691351263:web:6ad71343afed3a0305ad6a",
  measurementId: "G-BZQ57SN00Q"
};

// ADICIONE A SUA CHAVE PIX AQUI
const SUA_CHAVE_PIX = "ADICIONAR CHAVE PIX"; 
const NOME_DA_ESCOLA =  " Administração";

// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);


// --- Gemini API Call Function ---
const callGemini = async (prompt) => {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-0514:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            return "Não foi possível gerar uma resposta. Tente novamente.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Erro ao contatar a IA. Verifique sua conexão ou tente mais tarde.";
    }
};

// --- MOCK DATA FOR INITIAL SEEDING ---
const initialAlunos = [
  { nome: 'João Silva', status: 'Ativo', turmaIds: ['turma_sub9'], dataNascimento: '2014-08-10', rg: '12.345.678-9', cpf: '123.456.789-00', dataAdicao: '2025-07-15', responsaveis: [{id: 1, nome: 'Carlos Silva'}, {id: 2, nome: 'Maria Silva'}], contatos: [{id:1, tipo: 'Celular Pai', valor: '(35) 99999-1234'}], endereco: 'Rua das Flores, 123, Centro, Varginha - MG', problemasMedicos: 'Nenhuma observação', foto: null, peso: '42.5 kg', altura: '1.45 m', dataAcordoPagamento: 'Todo dia 10', dataFimPlano: '2025-12-31', documentos: [{id: 1, name: 'Atestado Médico.pdf', type: 'pdf', url: '#'}], pagamentos: [{ id: 1, descricao: 'Mensalidade Agosto/25', valor: 150.00, status: 'Pago', dataPagamento: '2025-08-09', formaPagamento: 'Pix' }, { id: 2, descricao: 'Mensalidade Julho/25', valor: 150.00, status: 'Pago', dataPagamento: '2025-07-10', formaPagamento: 'Débito' }], avaliacoes: [{ id: 1, data: '2025-07-15', peso: '42.0 kg', altura: '1.44 m', velocidade: '4.2s', salto: '25cm', observacoes: 'Boa evolução no passe.' }, { id: 2, data: '2025-02-10', peso: '40.5 kg', altura: '1.41 m', velocidade: '4.4s', salto: '22cm', observacoes: 'Iniciando trabalhos de coordenação.' }], eventosParticipados: 0 },
  { nome: 'Pedro Santos', status: 'Ativo', turmaIds: ['turma_sub9'], dataNascimento: '2014-08-22', rg: '', cpf: '', dataAdicao: '2025-08-01', responsaveis: [{id: 1, nome: 'Mariana Santos'}], contatos: [{id: 1, tipo: 'Celular Mãe', valor: '(35) 98888-5678'}], endereco: 'Av. Principal, 456, Bairro Sul, Varginha - MG', problemasMedicos: 'Alergia a amendoim', foto: null, peso: '43.0 kg', altura: '1.46 m', dataAcordoPagamento: 'Todo dia 15', dataFimPlano: '2026-03-15', documentos: [], pagamentos: [{ id: 3, descricao: 'Mensalidade Agosto/25', valor: 150.00, status: 'Pendente', dataPagamento: null, formaPagamento: null }, { id: 4, descricao: 'Taxa Campeonato', valor: 75.00, status: 'Pendente', dataPagamento: null, formaPagamento: null }, { id: 5, descricao: 'Mensalidade Julho/25', valor: 150.00, status: 'Pago', dataPagamento: '2025-07-14', formaPagamento: 'Dinheiro' }], avaliacoes: [{ id: 6, data: '2025-07-16', peso: '42.8 kg', altura: '1.45 m', velocidade: '4.1s', salto: '26cm', observacoes: 'Excelente velocidade.' }], eventosParticipados: 0 },
];
const initialTurmas = [
  { id: 'turma_sub9', nome: 'Sub-9', professores: [{id: 1, nome: 'Prof. André'}], horario: 'Ter/Qui - 09:00 às 10:30', diasDaSemana: [2, 4], planejamento: {'2025-08-05': 'Treino de passe', '2025-08-07': 'Treino tático'}, presenca: {}},
  { id: 'turma_sub11', nome: 'Sub-11', professores: [{id: 1, nome: 'Prof. Bruno'}], horario: 'Seg/Qua - 15:00 às 16:30', diasDaSemana: [1, 3], planejamento: {}, presenca: {}},
  { id: 'turma_sub13', nome: 'Sub-13', professores: [{id: 1, nome: 'Prof. André'}], horario: 'Ter/Qui - 16:00 às 17:30', diasDaSemana: [2, 4], planejamento: {}, presenca: {}},
];
const initialFinanceiro = [ { tipo: 'Despesa', descricao: 'Aluguel da Quadra', valor: 500.00, data: '2025-08-05' }, { tipo: 'Despesa', descricao: 'Compra de Bolas', valor: 250.00, data: '2025-08-06' } ];
const initialMetas = [ { text: 'Finalizar relatório financeiro de Julho', completed: true, tipo: 'mes', details: 'Verificar todos os recebimentos e despesas do mês.' }, { text: 'Planejar treinos da próxima semana', completed: false, tipo: 'mes', details: '' }, { text: 'Ligar para o fornecedor de uniformes', completed: false, tipo: 'dia', details: 'Orçamento para 20 novos kits.' }, { text: 'Confirmar presença dos alunos no campeonato', completed: true, tipo: 'dia', details: '' }, ];
const initialCategorias = [ { nome: 'Campeonato' }, { nome: 'Amistoso' }, { nome: 'Confraternização' }, { nome: 'Treino Especial' }, ];
const initialEventos = [
    { title: 'Campeonato Regional Sub-11', date: '2025-08-16', horaInicio: '09:00', horaTermino: '12:00', local: 'Estádio Municipal', description: 'Jogos no estádio municipal. Levar lanche.', categoriaId: 'Campeonato', escalacao: [], taxaInscricao: 250.00, avaliacoesPosEvento: [], realizado: false },
    { title: 'Festa de Confraternização', date: '2025-08-30', horaInicio: '18:00', horaTermino: '22:00', local: 'Chácara do Zé', description: 'Churrasco de fim de mês para pais e alunos.', categoriaId: 'Confraternização', escalacao: [], taxaInscricao: 0, avaliacoesPosEvento: [], realizado: false },
];

// --- MASK Functions ---
const maskCPF = (value) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const maskRG = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

// MASCARA DE NÚMERO
const maskPhone = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
    value = value.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen antes dos últimos 4 dígitos
    return value;
};

// --- Reusable & Editable Components ---
const Card = ({ icon: Icon, title, value, color }) => { const colorClasses = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', teal: 'bg-teal-100 text-teal-600', red: 'bg-red-100 text-red-600', orange: 'bg-orange-100 text-orange-600', }; return ( <div className="bg-white p-6 rounded-lg shadow-md flex items-center h-full"> <div className={`p-4 rounded-full ${colorClasses[color]}`}> <Icon className="h-8 w-8" /> </div> <div className="ml-4"> <p className="text-gray-500 font-medium">{title}</p> <p className="text-2xl font-bold text-gray-800">{value}</p> </div> </div> ); };

const EditableInfoItem = ({
    icon: Icon,
    label,
    value,
    onSave,
    type = 'text',
    options = [],
    displayTransform = (v) => v,
    hasCopy = false,
    className = '',
    textClassName = '',
    inputClassName = '',
    mask,
    maxLength,
}) => {
    // --- STATE ---
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value ?? '');
    const [copied, setCopied] = useState(false);

    // --- HANDLERS ---
    const handleSave = () => {
        onSave(currentValue);
        setIsEditing(false);
    };

    const handleChange = (e) => {
        let val = e.target.value;
        if (mask) {
            val = mask(val); // Aplica a máscara se ela for fornecida
        }
        setCurrentValue(val);
    };

    const handleCopy = () => {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Mostra feedback por 2 segundos
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    };

    // --- RENDER FUNCTIONS ---
    const renderDisplay = () => (
        <div className="flex items-center justify-between group">
            <p
                onClick={() => setIsEditing(true)}
                className={`cursor-pointer hover:bg-gray-100 p-1 rounded-md flex-grow ${textClassName}`}
            >
                {/* Usa a função de transformação para exibir ou mostra um placeholder */}
                {displayTransform(value) || (label ? 'Não informado' : '')}
            </p>
            {hasCopy && (
                <button onClick={handleCopy} className="ml-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            )}
        </div>
    );

    const renderInput = () => {
        const commonClasses = `mt-1 block w-full border-gray-300 rounded-md shadow-sm ${inputClassName}`;

        switch (type) {
            case 'date':
                return <input type="date" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleSave} className={commonClasses} autoFocus />;
            case 'select':
                return (
                    <select value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleSave} className={commonClasses} autoFocus>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                );
            case 'textarea':
                return <textarea value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleSave} rows="3" className={commonClasses} autoFocus />;
            default: // 'text' and other types
                return <input type="text" value={currentValue} onChange={handleChange} onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className={commonClasses} maxLength={maxLength} autoFocus />;
        }
    };

    // --- MAIN RENDER ---
    return (
        <div className={className}>
            {label && (
                <p className="text-sm font-medium text-gray-500 flex items-center">
                    {Icon && <Icon size={14} className="mr-2" />}
                    {label}
                </p>
            )}
            {/* Alterna entre o modo de edição e o modo de exibição */}
            {isEditing ? renderInput() : renderDisplay()}
        </div>
    );
};

const EditableMultiInfoItem = ({ icon: Icon, label, items, onUpdate, fields }) => {
    const initialNewItem = fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});
    const [isAdding, setIsAdding] = React.useState(false);
    const [newItem, setNewItem] = React.useState(initialNewItem);

    const handleUpdate = (index, fieldName, value) => {
        const fieldConfig = fields.find(f => f.name === fieldName);
        const maskedValue = fieldConfig?.mask ? fieldConfig.mask(value) : value;
        const updatedItems = [...(items || [])];
        updatedItems[index][fieldName] = maskedValue;
        onUpdate(updatedItems);
    };
    
    const handleNewItemChange = (fieldName, value) => {
        const fieldConfig = fields.find(f => f.name === fieldName);
        const maskedValue = fieldConfig?.mask ? fieldConfig.mask(value) : value;
        setNewItem(prev => ({ ...prev, [fieldName]: maskedValue }));
    };

    const handleRemove = (id) => { onUpdate((items || []).filter(item => item.id !== id)); };
    const handleAdd = () => {
        if (Object.values(newItem).every(val => val.trim() === '')) return;
        const currentItems = items || [];
        const newId = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.id)) + 1 : 1;
        onUpdate([...currentItems, { ...newItem, id: newId }]);
        setNewItem(initialNewItem);
        setIsAdding(false);
    };

    return (
        <div className="sm:col-span-2">
            <p className="text-sm font-medium text-gray-500 flex items-center mb-2"> <Icon size={14} className="mr-2"/> {label} </p>
            <div className="space-y-2">
                {(items || []).map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                        {fields.map(field => (
                             <input
                                key={field.name}
                                type={field.type || 'text'}
                                value={item[field.name] || ''}
                                onChange={(e) => handleUpdate(index, field.name, e.target.value)}
                                className={`block w-full border-gray-300 rounded-md shadow-sm text-sm ${field.className}`}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                            />
                        ))}
                        <button onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700 flex-shrink-0"><Trash2 size={16} /></button>
                    </div>
                ))}
                {isAdding ? (
                    <div className="flex items-center gap-2">
                        {fields.map(field => (
                            <input
                                key={field.name}
                                type={field.type || 'text'}
                                value={newItem[field.name]}
                                onChange={(e) => handleNewItemChange(field.name, e.target.value)}
                                className={`block w-full border-gray-300 rounded-md shadow-sm text-sm ${field.className}`}
                                placeholder={field.placeholder}
                                autoFocus={field.autoFocus || false}
                                maxLength={field.maxLength}
                            />
                        ))}
                        <button onClick={handleAdd} className="text-green-500 hover:text-green-700 flex-shrink-0"><Check size={20} /></button>
                        <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700 flex-shrink-0"><X size={20} /></button>
                    </div>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="text-sm text-blue-600 hover:underline">+ Adicionar</button>
                )}
            </div>
        </div>
    );
};

const EditableTurmasList = ({ label, aluno, turmas, onUpdateAluno }) => { const [isModalOpen, setIsModalOpen] = React.useState(false); const alunoTurmas = React.useMemo(() => (aluno.turmaIds || []).map(id => turmas.find(t => t.id === id)).filter(Boolean), [aluno.turmaIds, turmas]);
const handleRemoveTurma = (turmaId) => { const novasTurmas = (aluno.turmaIds || []).filter(id => id !== turmaId); onUpdateAluno({ ...aluno, turmaIds: novasTurmas }); }; const handleAddTurma = (turmaId) => { if (!(aluno.turmaIds || []).includes(turmaId)) { const novasTurmas = [...(aluno.turmaIds || []), turmaId]; onUpdateAluno({ ...aluno, turmaIds: novasTurmas }); } setIsModalOpen(false); };
return ( <div className="sm:col-span-2"> <p className="text-sm font-medium text-gray-500 flex items-center mb-2">{label}</p> <div className="flex flex-wrap gap-2 items-center"> {alunoTurmas.length > 0 ? alunoTurmas.map(turma => ( <span key={turma.id} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center gap-2"> {turma.nome} <button onClick={() => handleRemoveTurma(turma.id)} className="text-blue-600 hover:text-blue-800"><X size={14} /></button> </span> )) : <span className="text-gray-500">Nenhuma turma</span>} <button onClick={() => setIsModalOpen(true)} className="bg-gray-200 text-gray-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-300">+</button> </div> {isModalOpen && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4">Adicionar à Turma</h3> <ul className="space-y-2"> {turmas.filter(t => !(aluno.turmaIds || []).includes(t.id)).map(turma => ( <li key={turma.id}> <button onClick={() => handleAddTurma(turma.id)} className="w-full text-left p-2 rounded-md hover:bg-gray-100">{turma.nome}</button> </li> ))} </ul> <button onClick={() => setIsModalOpen(false)} className="mt-4 bg-gray-200 px-4 py-2 rounded-md">Fechar</button> </div> </div> )} </div> ); };

const InfoItemCopiavel = ({ label, value, displayTransform = (v) => v, copyValue }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (e) => {
        e.preventDefault();    // impede comportamento padrão (ex: submit)
        e.stopPropagation();   // evita que feche o dropdown

        const valueToCopy = copyValue !== undefined ? copyValue : value;
        if (!valueToCopy) return;

        navigator.clipboard.writeText(valueToCopy)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => console.error("Erro ao copiar:", err));
    };

    return (
        <div className="flex items-center justify-between group text-xs w-full">
            <span className="font-semibold text-gray-600 mr-2">{label}:</span>
            <span className="text-gray-800 truncate flex-grow text-left">
                {displayTransform(value) || "N/A"}
            </span>
            <button
                type="button" // evita submit automático
                onClick={handleCopy}
                className="ml-2 text-gray-400 hover:text-blue-600 flex-shrink-0"
            >
                {copied 
                    ? <Check size={14} className="text-green-500" /> 
                    : <Copy size={14} />}
            </button>
        </div>
    );
};

// --- Modals ---
const AlunoModal = ({ aluno, onClose, onSave, turmas }) => {
    const [formData, setFormData] = React.useState({ nome: aluno?.nome || '', dataNascimento: aluno?.dataNascimento || '', responsavel: aluno?.responsaveis?.[0]?.nome || '', contato: aluno?.contatos?.[0]?.valor || '', turmaId: aluno?.turmaIds?.[0] || '', status: aluno?.status || 'Ativo', endereco: aluno?.endereco || '', problemasMedicos: aluno?.problemasMedicos || '', });
    const [isLoading, setIsLoading] = React.useState(false); // Novo estado de carregamento

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Ativa o "a carregar"
        try {
            await onSave(formData);
            // onClose() será chamado pela função pai se o save for bem sucedido
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
            // Poderíamos mostrar uma mensagem de erro aqui
        } finally {
            setIsLoading(false); // Desativa o "a carregar"
        }
    };
    
     return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-full overflow-y-auto">
                {/* Cabeçalho do Modal */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                        {aluno ? 'Editar Aluno' : 'Adicionar Aluno'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                            <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Responsável Principal</label>
                            <input type="text" name="responsavel" value={formData.responsavel} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contato Principal</label>
                            <input type="tel" name="contato" value={formData.contato} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Turma Principal</label>
                            <select name="turmaId" value={formData.turmaId} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">Selecione uma turma</option>
                                {(turmas || []).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Endereço</label>
                        <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Problemas Médicos / Observações</label>
                        <textarea name="problemasMedicos" value={formData.problemasMedicos} onChange={handleChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                            {isLoading && <Loader size={16} className="animate-spin mr-2" />}
                            {isLoading ? 'A Salvar...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const AvaliacaoModal = ({ avaliacao, onClose, onSave }) => { const [formData, setFormData] = React.useState({ data: new Date().toISOString().split('T')[0], peso: '', altura: '', velocidade: '', salto: '', observacoes: '' }); React.useEffect(() => { if (avaliacao) { setFormData({ ...avaliacao }); } }, [avaliacao]); const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); }; const handleSubmit = (e) => { e.preventDefault(); onSave(formData); }; return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"> <div className="flex justify-between items-center mb-6"> <h3 className="text-2xl font-bold text-gray-800">{avaliacao ? 'Editar Avaliação' : 'Nova Avaliação Física'}</h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div> <form onSubmit={handleSubmit} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium text-gray-700">Data</label> <input type="date" name="data" value={formData.data} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /> </div> <div> <label className="block text-sm font-medium text-gray-700">Peso (ex: 45.5 kg)</label> <input type="text" name="peso" value={formData.peso} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /> </div> <div> <label className="block text-sm font-medium text-gray-700">Altura (ex: 1.50 m)</label> <input type="text" name="altura" value={formData.altura} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /> </div> <div> <label className="block text-sm font-medium text-gray-700">Velocidade (ex: 4.0s)</label> <input type="text" name="velocidade" value={formData.velocidade} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> </div> <div> <label className="block text-sm font-medium text-gray-700">Salto (ex: 30 cm)</label> <input type="text" name="salto" value={formData.salto} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> </div> </div> <div> <label className="block text-sm font-medium text-gray-700">Observações do Treinador</label> <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea> </div> <div className="flex justify-end pt-4"> <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button> <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Avaliação</button> </div> </form> </div> </div> ); };

const PagamentoModal = ({ pagamento, onClose, onSave }) => {
    // Sugere a descrição da mensalidade do mês atual
    const hoje = new Date();
    const nomeMes = hoje.toLocaleString('pt-BR', { month: 'long' });
    const anoCurto = String(hoje.getFullYear()).slice(2);
    const descricaoSugerida = `Mensalidade ${nomeMes}/${anoCurto}`;

    const [formData, setFormData] = React.useState({
        descricao: pagamento?.descricao || descricaoSugerida,
        valor: pagamento?.valor || '',
        dataPagamento: pagamento?.dataPagamento || new Date().toISOString().split('T')[0],
        formaPagamento: pagamento?.formaPagamento || 'Pix'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // O status é sempre 'Pago' ao salvar
        onSave({ ...formData, status: 'Pago' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">{pagamento ? 'Editar Pagamento' : 'Novo Pagamento'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                            <input type="number" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="150.00" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
                            <input type="date" name="dataPagamento" value={formData.dataPagamento} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option>Pix</option>
                            <option>Dinheiro</option>
                            <option>Crédito</option>
                            <option>Débito</option>
                            <option value="">N/A</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TurmaModal = ({ turma, onClose, onSave }) => { const [formData, setFormData] = React.useState({ nome: turma?.nome || '', professor: turma?.professores?.[0]?.nome || '', horario: turma?.horario || '', }); const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }; const handleSubmit = (e) => { e.preventDefault(); onSave(formData); }; return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"> <div className="flex justify-between items-center mb-6"> <h3 className="text-2xl font-bold text-gray-800">{turma ? 'Editar Turma' : 'Adicionar Turma'}</h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div> <form onSubmit={handleSubmit} className="space-y-4"> <div> <label className="block text-sm font-medium text-gray-700">Nome da Turma</label> <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /> </div> <div> <label className="block text-sm font-medium text-gray-700">Professor Principal</label> <input type="text" name="professor" value={formData.professor} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /> </div> <div> <label className="block text-sm font-medium text-gray-700">Horário</label> <input type="text" name="horario" value={formData.horario} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Ex: Ter/Qui - 09:00" required /> </div> <div className="flex justify-end pt-4"> <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button> <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar</button> </div> </form> </div> </div> ); };
const AddAlunoTurmaModal = ({ todosAlunos, turmaAtual, onClose, onAddAluno }) => { const [searchTerm, setSearchTerm] = React.useState(''); const alunosDisponiveis = todosAlunos.filter(a => !(a.turmaIds || []).includes(turmaAtual.id) && a.nome.toLowerCase().includes(searchTerm.toLowerCase())); return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"> <div className="flex justify-between items-center mb-4"> <h3 className="text-2xl font-bold text-gray-800">Adicionar Aluno à Turma</h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div> <div className="mb-4 relative"> <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> <input type="text" placeholder="Buscar aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> <div className="overflow-y-auto"> <ul className="divide-y divide-gray-200"> {alunosDisponiveis.map(aluno => ( <li key={aluno.id} className="py-3 flex items-center justify-between"> <span>{aluno.nome}</span> <button onClick={() => onAddAluno(aluno.id)} className="bg-green-500 text-white px-3 py-1 text-sm rounded-md hover:bg-green-600">Adicionar</button> </li> ))} {alunosDisponiveis.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum aluno encontrado.</p>} </ul> </div> </div> </div> ); };

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        // Aumentámos o z-index para garantir que ele fique por cima do modal de configurações
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Ação</h3>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancelar</button>
                    <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CropImageModal = ({ imageUrl, onClose }) => ( <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center"> <h3 className="text-2xl font-bold text-gray-800 mb-4">Recortar Imagem</h3> <div className="w-full h-64 bg-gray-200 flex items-center justify-center my-4"> {imageUrl ? <img src={imageUrl} alt="Recortar" className="max-w-full max-h-full" /> : <p className="text-gray-500">Sem imagem para recortar.</p>} </div> <p className="text-sm text-gray-600 mb-6">Esta é uma simulação. Em uma aplicação real, aqui estaria uma ferramenta de recorte.</p> <div className="flex justify-end gap-4"> <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button> <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar Recorte</button> </div> </div> </div> );
const GeminiSummaryModal = ({ isLoading, content, onClose }) => ( <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"> <div className="flex justify-between items-center mb-4"> <h3 className="text-2xl font-bold text-gray-800 flex items-center"> <Sparkles size={24} className="mr-2 text-purple-600" /> Resumo de Desempenho </h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div> <div className="my-4 p-4 bg-gray-50 rounded-lg min-h-[200px] whitespace-pre-wrap"> {isLoading ? ( <div className="flex justify-center items-center h-full"> <Loader className="animate-spin text-purple-600" size={40} /> </div> ) : ( <p className="text-gray-700">{content}</p> )} </div> <div className="flex justify-end"> <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Fechar</button> </div> </div> </div> );
const ListaAlunosModal = ({ alunos, onClose, onSelectAluno }) => { const sortedAlunos = [...alunos].sort((a, b) => new Date(a.dataNascimento) - new Date(b.dataNascimento)); const handleDownloadJPEG = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const lineHeight = 30; const padding = 20; const titleHeight = 50; canvas.width = 500; canvas.height = (sortedAlunos.length * lineHeight) + titleHeight + (padding * 2); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'black'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillText('Lista de Todos os Alunos', canvas.width / 2, padding + 20); ctx.font = '16px Arial'; ctx.textAlign = 'left'; sortedAlunos.forEach((aluno, index) => { const y = titleHeight + padding + (index * lineHeight); const birthDate = new Date(aluno.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}); ctx.fillText(`${index + 1}. ${aluno.nome} - (Nasc: ${birthDate})`, padding, y); }); const dataUrl = canvas.toDataURL('image/jpeg'); const a = document.createElement('a'); a.href = dataUrl; a.download = 'lista_total_alunos.jpeg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }; return ( <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col"> <div className="flex justify-between items-center mb-4"> <h3 className="text-2xl font-bold text-gray-800">Todos os Alunos</h3> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div> <div id="lista-alunos-para-download" className="overflow-y-auto flex-grow pr-2"> <ul className="divide-y divide-gray-200"> {sortedAlunos.map((aluno, index) => ( <li key={aluno.id} className="py-3 flex justify-between items-center"> <div className="flex items-center"> <span className="w-8 text-right mr-4 font-bold text-gray-500">{index + 1}.</span> <button onClick={() => {onSelectAluno(aluno); onClose();}} className="font-medium text-blue-600 hover:underline text-left"> {aluno.nome} </button> </div> <span className="text-sm text-gray-500"> {new Date(aluno.dataNascimento).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })} </span> </li> ))} </ul> </div> <div className="mt-6 flex justify-end gap-4"> <button onClick={handleDownloadJPEG} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition"> <Download size={18} className="mr-2" /> Download (JPEG) </button> <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button> </div> </div> </div> ); };

const DetalhesFinanceirosModal = ({ title, data, onClose, onRemove, confirmAction }) => {
    const handlePrint = () => {
        const printableArea = document.getElementById('printable-area-details');
        if (printableArea) {
            const originalContents = document.body.innerHTML;
            const printContents = printableArea.innerHTML;
            document.body.innerHTML = `<div class="p-8">${printContents}</div>`;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    const handleRemoveClick = (item) => {
        if (!item.isDeletable) {
            alert("Pagamentos de mensalidades só podem ser removidos na ficha do aluno.");
            return;
        }
        confirmAction(`Tem a certeza de que quer remover "${item.descricao}"?`, () => onRemove(item.id));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            {/* CORREÇÃO AQUI: A estrutura flex foi movida para o div interno para garantir a rolagem */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div id="printable-area-details" className="p-6 flex flex-col flex-grow overflow-hidden">
                    <div className="flex justify-between items-center mb-4 print:hidden">
                        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                    </div>
                    <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-lg print:hidden">
                        {/* O filtro de pagamento pode ser adicionado aqui no futuro, se necessário */}
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3">Meio de Pag.</th>
                                    <th className="px-6 py-3 text-right">Valor</th>
                                    <th className="px-6 py-3 text-center print:hidden">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data || []).map(item => (
                                    <tr key={item.key} className="bg-white border-b">
                                        <td className="px-6 py-4">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.descricao}</td>
                                        <td className="px-6 py-4">{item.formaPagamento || 'N/A'}</td>
                                        <td className="px-6 py-4 text-right font-semibold">R$ {item.valor.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center print:hidden">
                                            {item.isDeletable && (
                                                <button onClick={() => handleRemoveClick(item)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {(data || []).length === 0 && <p className="text-center text-gray-500 py-8">Nenhum lançamento para este mês.</p>}
                    </div>
                </div>
                <div className="flex justify-end p-6 pt-4 mt-auto border-t print:hidden">
                    <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded-lg mr-2 font-semibold hover:bg-gray-700">Imprimir</button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const DespesaModal = ({ onClose, onSave }) => {

    // Estado inicial do formulário, com a data de hoje pré-definida.
    const [formData, setFormData] = React.useState({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        formaPagamento: 'Pix'
    });

    // Função genérica para lidar com mudanças nos campos do formulário.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Função chamada ao submeter o formulário.
    const handleSubmit = (e) => {
        e.preventDefault(); // Previne o recarregamento da página.
        // Envia os dados para o componente pai, adicionando o tipo 'Despesa'.
        onSave({
            ...formData,
            valor: parseFloat(formData.valor) || 0,
            tipo: 'Despesa'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Adicionar Despesa</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                            <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data da Despesa</label>
                            <input type="date" name="data" value={formData.data} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option>Pix</option>
                            <option>Dinheiro</option>
                            <option>Débito</option>
                            <option>Crédito</option>
                        </select>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Despesa</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReceitaModal = ({ onClose, onSave }) => {
    
    // Estado inicial do formulário. A data já vem preenchida com o dia de hoje.
    const [formData, setFormData] = React.useState({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0], // Pega a data atual no formato YYYY-MM-DD
        formaPagamento: 'Pix' // Valor padrão
    });

    // Função genérica para atualizar o estado do formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Função chamada ao submeter o formulário
    const handleSubmit = (e) => {
        e.preventDefault(); // Impede o recarregamento da página
        // Prepara e envia os dados para o componente pai
        onSave({
            ...formData,
            valor: parseFloat(formData.valor) || 0, // Converte o valor para número
            tipo: 'Receita' // Adiciona o tipo fixo
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                {/* Cabeçalho do Modal */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Adicionar Receita</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                            <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data da Receita</label>
                            <input type="date" name="data" value={formData.data} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option>Pix</option>
                            <option>Dinheiro</option>
                            <option>Débito</option>
                            <option>Crédito</option>
                        </select>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Receita</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GestaoFinanceira = ({ transacoes, alunos, onAddDespesa, onAddReceita, onRemoveTransacao, onSelectAluno, confirmAction, userPermissions }) => {
    const [mesSelecionado, setMesSelecionado] = React.useState(new Date().toISOString().slice(0, 7));
    const [modalState, setModalState] = React.useState({ isOpen: false, type: '', data: {} });

    const availableMonths = React.useMemo(() => { const allTransacaoDates = (transacoes || []).map(t => t.data.slice(0, 7)); const allPagamentoDates = (alunos || []).flatMap(a => (a.pagamentos || []).map(p => p.dataPagamento ? p.dataPagamento.slice(0, 7) : null)); const uniqueMonths = [...new Set([...allTransacaoDates, ...allPagamentoDates].filter(Boolean))]; const currentMonthStr = new Date().toISOString().slice(0, 7); if (!uniqueMonths.includes(currentMonthStr)) { uniqueMonths.push(currentMonthStr); } return uniqueMonths.sort().reverse(); }, [transacoes, alunos]);
    
    const financialData = React.useMemo(() => {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const [ano, mes] = mesSelecionado.split('-').map(Number);
        const mesIndex = mes - 1;

        let receitaRealizada = 0, despesaRealizada = 0;
        const extratoCompleto = [];
        const listaMensalidadesPrevistas = [];
        const listaOutrasReceitasPrevistas = [];
        const listaDespesasFuturas = [];

        (alunos || []).filter(a => a.status === 'Ativo').forEach(aluno => {
            const situacao = getSituacaoMensalidade(aluno, mesSelecionado);
            if (situacao.status !== 'Pago') {
                listaMensalidadesPrevistas.push(aluno);
            }
            (aluno.pagamentos || []).forEach(p => {
                if (p.dataPagamento) {
                    const dataPag = new Date(p.dataPagamento + 'T00:00:00');
                    if (dataPag.getFullYear() === ano && dataPag.getMonth() === mesIndex && p.status === 'Pago') {
                        const item = { key: `pag-${aluno.id}-${p.id}`, id: p.id, data: p.dataPagamento, descricao: `${p.descricao} - ${aluno.nome}`, valor: p.valor, tipo: 'Receita', isDeletable: false, formaPagamento: p.formaPagamento };
                        extratoCompleto.push(item);
                        if (dataPag <= hoje) receitaRealizada += p.valor;
                    }
                }
            });
        });

        (transacoes || []).forEach(t => {
            if (t.data.startsWith(mesSelecionado)) {
                const dataTransacao = new Date(t.data + 'T00:00:00');
                const item = { key: `trans-${t.id}`, id: t.id, data: t.data, descricao: t.descricao, valor: t.valor, tipo: t.tipo, isDeletable: true, formaPagamento: t.formaPagamento };
                extratoCompleto.push(item);
                if (dataTransacao <= hoje) {
                    if (t.tipo === 'Receita') receitaRealizada += t.valor;
                    else despesaRealizada += t.valor;
                } else {
                    if (t.tipo === 'Receita') listaOutrasReceitasPrevistas.push(item);
                    else listaDespesasFuturas.push(item);
                }
            }
        });
        
        const totalMensalidadesPrevistas = listaMensalidadesPrevistas.reduce((acc, aluno) => acc + (aluno.valorMensalidade || 0), 0);

        return {
            receitaRealizada, despesaRealizada,
            mensalidadesAReceber: {
                total: totalMensalidadesPrevistas,
                lista: listaMensalidadesPrevistas
            },
            outrasReceitasFuturas: {
                total: listaOutrasReceitasPrevistas.reduce((acc, t) => acc + t.valor, 0),
                lista: listaOutrasReceitasPrevistas
            },
            aPagarFuturo: {
                total: listaDespesasFuturas.reduce((acc, t) => acc + t.valor, 0),
                lista: listaDespesasFuturas
            },
            extratoCompleto
        };
    }, [alunos, transacoes, mesSelecionado]);
    
    const saldoDoMes = financialData.receitaRealizada - financialData.despesaRealizada;
    
    const handleOpenModal = (type) => { 
        let data, title; 
        const monthStr = new Date(mesSelecionado + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' }); 
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        
        switch (type) { 
            case 'ReceitaRealizada': 
                data = financialData.extratoCompleto.filter(t => t.tipo === 'Receita' && new Date(t.data + 'T00:00:00') <= hoje); 
                title = `Receitas Realizadas - ${monthStr}`; 
                break; 
            case 'DespesaRealizada': 
                data = financialData.extratoCompleto.filter(t => t.tipo === 'Despesa' && new Date(t.data + 'T00:00:00') <= hoje); 
                title = `Despesas Realizadas - ${monthStr}`; 
                break; 
            case 'ExtratoMensal': 
                data = financialData.extratoCompleto; 
                title = `Extrato de ${monthStr}`; 
                break; 
            // NOVOS TIPOS DE MODAL AQUI
            case 'OutrasReceitasFuturas':
                data = financialData.outrasReceitasFuturas.lista;
                title = `Outras Receitas Futuras - ${monthStr}`;
                break;
            case 'FuturasDespesas': 
                data = financialData.aPagarFuturo.lista;
                title = `Despesas Futuras - ${monthStr}`; 
                break; 
            default: 
                data = []; title = 'Detalhes'; 
        } 
        setModalState({ isOpen: true, type, title, data }); 
    };

    const handleSaveDespesa = (despesaData) => { onAddDespesa(despesaData); setModalState({ isOpen: false }); };
    const handleSaveReceita = (receitaData) => { onAddReceita(receitaData); setModalState({ isOpen: false }); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Gestão Financeira</h2>
                <div className="flex items-center gap-4">
                    <select id="month-select" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="p-2 border rounded-lg shadow-sm">
                        {availableMonths.map(month => ( <option key={month} value={month}> {new Date(month + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })} </option> ))}
                    </select>
                    {userPermissions.canEdit && (<>
                        <button onClick={() => setModalState({ isOpen: true, type: 'AddReceita' })} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-green-600 transition"> <Plus className="h-5 w-5 mr-2" /> Adicionar Receita </button>
                        <button onClick={() => setModalState({ isOpen: true, type: 'AddDespesa' })} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-red-600 transition"> <Plus className="h-5 w-5 mr-2" /> Adicionar Despesa </button>
                    </>)}
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div onClick={() => handleOpenModal('ReceitaRealizada')} className="cursor-pointer"> <Card icon={DollarSign} title="Receita Realizada" value={`R$ ${financialData.receitaRealizada.toFixed(2)}`} color="green" /> </div>
                <div onClick={() => handleOpenModal('DespesaRealizada')} className="cursor-pointer"> <Card icon={DollarSign} title="Despesa Realizada" value={`R$ ${financialData.despesaRealizada.toFixed(2)}`} color="red" /> </div>
                <div onClick={() => handleOpenModal('ExtratoMensal')} className="cursor-pointer"> <Card icon={BarChart2} title="Saldo do Mês" value={`R$ ${saldoDoMes.toFixed(2)}`} color="blue" /> </div>
                {/* CARDS DE PREVISÃO REESTRUTURADOS */}
                <div className="cursor-pointer"> <Card icon={ClipboardList} title="Mensalidades a Receber" value={`R$ ${financialData.mensalidadesAReceber.total.toFixed(2)}`} color="orange" /> </div>
                <div onClick={() => handleOpenModal('OutrasReceitasFuturas')} className="cursor-pointer"> <Card icon={ClipboardList} title="Outras Receitas Futuras" value={`R$ ${financialData.outrasReceitasFuturas.total.toFixed(2)}`} color="orange" /> </div>
                <div onClick={() => handleOpenModal('FuturasDespesas')} className="cursor-pointer"> <Card icon={ClipboardList} title="A Pagar Futuro" value={`R$ ${financialData.aPagarFuturo.total.toFixed(2)}`} color="orange" /> </div>
            </div>
            
            <FinancialChart transacoes={transacoes} alunos={alunos} />
            
            {/* CONDIÇÃO DE RENDERIZAÇÃO ATUALIZADA */}
            {(modalState.isOpen && (modalState.type === 'ReceitaRealizada' || modalState.type === 'DespesaRealizada' || modalState.type === 'FuturasDespesas' || modalState.type === 'OutrasReceitasFuturas')) && 
                <DetalhesFinanceirosModal title={modalState.title} data={modalState.data} onClose={() => setModalState({ isOpen: false })} onRemove={onRemoveTransacao} confirmAction={confirmAction}/> 
            }
            {modalState.isOpen && modalState.type === 'ExtratoMensal' && <ExtratoMensalModal title={modalState.title} extrato={modalState.data} onClose={() => setModalState({ isOpen: false })} />}
            {modalState.isOpen && modalState.type === 'AddDespesa' && <DespesaModal onClose={() => setModalState({ isOpen: false })} onSave={handleSaveDespesa} />}
            {modalState.isOpen && modalState.type === 'AddReceita' && <ReceitaModal onClose={() => setModalState({ isOpen: false })} onSave={handleSaveReceita} />}
        </div>
    );
};


const GerenciarCategoriasModal = ({ categorias, onClose, onAdd, onDelete }) => {
    
    // Estado para controlar o valor do input de nova categoria
    const [newCategoriaNome, setNewCategoriaNome] = React.useState('');

    // Função para adicionar uma nova categoria
    const handleAdd = () => {
        // Verifica se o nome não está vazio ou só com espaços em branco
        if (newCategoriaNome.trim()) {
            onAdd(newCategoriaNome);
            setNewCategoriaNome(''); // Limpa o input após adicionar
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Gerenciar Categorias</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                {/* Lista de Categorias Existentes */}
                <div className="mb-4">
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {(categorias || []).map(cat => (
                            <li key={cat.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                <span>{cat.nome}</span>
                                <button onClick={() => onDelete(cat.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Formulário para Adicionar Nova Categoria */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategoriaNome}
                        onChange={(e) => setNewCategoriaNome(e.target.value)}
                        placeholder="Nova categoria..."
                        className="w-full p-2 border rounded-lg"
                    />
                    <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                        Adicionar
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExtratoMensalModal = ({ title, extrato, onClose }) => {
    const extratoOrdenado = (extrato || []).sort((a, b) => new Date(b.data) - new Date(a.data));
    const handlePrint = () => {
        const printableArea = document.getElementById('printable-area-extrato');
        if (printableArea) {
            const originalContents = document.body.innerHTML;
            const printContents = printableArea.innerHTML;
            document.body.innerHTML = `<div class="p-8">${printContents}</div>`;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div id="printable-area-extrato" className="p-6 flex flex-col flex-grow overflow-hidden">
                    <div className="flex justify-between items-center mb-4 print:hidden">
                        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3">Meio de Pag.</th>
                                    <th className="px-6 py-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extratoOrdenado.map(item => (
                                    <tr key={item.key} className="bg-white border-b">
                                        <td className="px-6 py-4">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.descricao}</td>
                                        <td className="px-6 py-4">{item.formaPagamento || 'N/A'}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${item.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.tipo === 'Receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {extratoOrdenado.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma movimentação para este mês.</p>}
                    </div>
                </div>
                <div className="flex justify-end p-6 pt-4 mt-auto border-t print:hidden">
                    <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded-lg mr-2 font-semibold hover:bg-gray-700">Imprimir</button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const AlunosPendentesModal = ({ alunosPendentes, onClose, onSelectAluno }) => {
    // Ordena a lista por nome para uma melhor visualização
    const alunosOrdenados = [...(alunosPendentes || [])].sort((a, b) => a.nome.localeCompare(b.nome));

    const handleSelect = (aluno) => {
        onSelectAluno(aluno);
        onClose(); // Fecha este modal para navegar para o perfil do aluno
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Alunos com Mensalidades Vencidas</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto flex-grow">
                    {alunosOrdenados.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {alunosOrdenados.map(aluno => (
                                <li key={aluno.id} onClick={() => handleSelect(aluno)} className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                                    <div>
                                        <p className="font-medium text-blue-600 hover:underline">{aluno.nome}</p>
                                        <p className="text-sm text-gray-500">Vencimento dia {aluno.diaVencimento}</p>
                                    </div>
                                    <span className="font-bold text-red-600">R$ {(aluno.valorMensalidade || 0).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Nenhum aluno com mensalidades vencidas no momento.</p>
                    )}
                </div>
                 <div className="flex justify-end pt-4 mt-4 border-t">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const PrevisaoReceitasModal = ({ onClose, previsaoData }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{previsaoData.title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <div className="text-center bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-600">Valor Total Previsto para o Mês</p>
                    <p className="text-3xl font-bold text-green-600">R$ {previsaoData.totalPrevisto.toFixed(2)}</p>
                </div>

                <div className="overflow-y-auto flex-grow space-y-4 pr-2">
                    {/* Bloco de Mensalidades (Resumido) */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-700">MENSALIDADES A RECEBER</h4>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-600">{previsaoData.listaMensalidades.length} aluno(s) com mensalidade a vencer este mês.</span>
                            <span className="font-bold text-lg">R$ {previsaoData.totalMensalidades.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Bloco de Outras Receitas (Detalhado) */}
                    {previsaoData.listaOutrasReceitas.length > 0 && (
                        <div className="pt-4">
                            <h4 className="font-bold text-gray-700">OUTRAS RECEITAS PREVISTAS</h4>
                            <ul className="divide-y divide-gray-200 mt-2">
                                {previsaoData.listaOutrasReceitas.map(item => (
                                    <li key={item.key} className="py-2 flex justify-between items-center">
                                        <div>
                                            <p>{item.descricao}</p>
                                            <p className="text-sm text-gray-500">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <span className="font-semibold">R$ {item.valor.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const PendentesModal = ({ alunosPendentes, onClose, onSelectAluno }) => {
    // Ordena os alunos por nome para a exibição no modal
    const alunosOrdenados = [...(alunosPendentes || [])].sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Alunos com Pagamentos Pendentes</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto flex-grow">
                    <ul className="divide-y divide-gray-200">
                        {alunosOrdenados.map(aluno => (
                            <li key={aluno.id} onClick={() => onSelectAluno(aluno)} className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                                <div>
                                    <p className="font-medium text-gray-900">{aluno.nome}</p>
                                    <p className="text-sm text-gray-500">Vencimento dia {aluno.diaVencimento}</p>
                                </div>
                                <span className="font-bold text-red-600">R$ {(aluno.valorMensalidade || 0).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    {alunosOrdenados.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum pagamento pendente no momento.</p>}
                </div>
                 <div className="flex justify-end pt-4 mt-4 border-t">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const EventoModal = ({ evento, onClose, onSave, categorias, onAddCategoria, onDeleteCategoria, todosAlunos, onUpdateEscalacao, onUpdateAluno, confirmAction, triggerUndo }) => {
    const [formData, setFormData] = React.useState({
        title: evento?.title || '',
        local: evento?.local || '',
        description: evento?.description || '',
        categoriaId: evento?.categoriaId || '',
        escalacao: evento?.escalacao || [],
        taxaInscricao: evento?.taxaInscricao ?? '',
        avaliacoesPosEvento: evento?.avaliacoesPosEvento || [],
        partidas: evento?.partidas || [],
    });
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = React.useState(false);
    const [viewingAluno, setViewingAluno] = React.useState(null);

    const valorPorAlunoCalculado = React.useMemo(() => {
        const taxa = parseFloat(formData.taxaInscricao) || 0;
        const numAlunos = (formData.escalacao || []).length;
        if (numAlunos === 0) return '0.00';
        return (taxa / numAlunos).toFixed(2);
    }, [formData.taxaInscricao, formData.escalacao]);

    const alunosEscalados = React.useMemo(() => {
        return (formData.escalacao || [])
            .map(alunoId => todosAlunos.find(a => a.id === alunoId))
            .filter(Boolean);
    }, [formData.escalacao, todosAlunos]);

    // NOVA FUNÇÃO "PONTE"
    const handleSaveResultadoPartida = (partidaData) => {
        const novasPartidas = (formData.partidas || []).map(p => p.id === partidaData.id ? partidaData : p);
        const novoFormData = { ...formData, partidas: novasPartidas };
        setFormData(novoFormData);
        onSave(novoFormData); // Salva o evento inteiro no Firebase
    };

    const handleChange = (e) => { const { name, value } = e.target; const newValue = (name === 'taxaInscricao') ? (value === '' ? '' : Number(value)) : value; setFormData(prev => ({ ...prev, [name]: newValue })); };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    const handleUpdateEscalacao = (novaEscalacao) => { const updatedFormData = { ...formData, escalacao: novaEscalacao }; setFormData(updatedFormData); if (evento) { onUpdateEscalacao(evento.id, novaEscalacao); } };
    const handleUpdateAvaliacoesPosEvento = (novasAvaliacoes) => { const updatedFormData = { ...formData, avaliacoesPosEvento: novasAvaliacoes }; setFormData(updatedFormData); };
    const handleRemoveAlunoDaEscalacao = (alunoId) => { const aluno = todosAlunos.find(a => a.id === alunoId); if (!aluno) return; const executeDelete = () => { const novaEscalacao = (formData.escalacao || []).filter(id => id !== alunoId); handleUpdateEscalacao(novaEscalacao); if (triggerUndo) { triggerUndo({ type: 'escalacao', item: { alunoId, eventoId: evento.id } }); } }; confirmAction(`Remover ${aluno.nome} da escalação?`, executeDelete); };
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">{evento ? 'Editar Evento' : 'Novo Evento'}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ... (resto do formulário do EventoModal) ... */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div> <label className="block text-sm font-medium text-gray-700">Título do Evento</label> <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /> </div>
                            <div> <label className="block text-sm font-medium text-gray-700">Local Principal</label> <input type="text" name="local" value={formData.local} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoria</label>
                            <div className="flex items-center gap-2">
                                <select name="categoriaId" value={formData.categoriaId} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="">Selecione uma categoria</option>
                                    {(categorias || []).map(cat => ( <option key={cat.id} value={cat.id}>{cat.nome}</option> ))}
                                </select>
                                <button type="button" onClick={() => setIsCategoriaModalOpen(true)} className="mt-1 p-2 bg-gray-200 rounded-md hover:bg-gray-300"><Settings size={20} /></button>
                            </div>
                        </div>
                        
                        <GerenciarPartidas 
                            partidas={formData.partidas} 
                            onUpdatePartidas={(novasPartidas) => setFormData(prev => ({ ...prev, partidas: novasPartidas }))}
                            alunosEscalados={alunosEscalados}
                            onSaveResultado={handleSaveResultadoPartida} // Passando a nova função
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Taxa de Inscrição Total (R$)</label>
                                <input type="number" name="taxaInscricao" value={formData.taxaInscricao} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Ex: 250.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Valor por Aluno (Calculado)</label>
                                <div className="mt-1 p-2 bg-gray-100 rounded-md">R$ {valorPorAlunoCalculado}</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Descrição/Observações Gerais</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        {evento && <EscalacaoEvento evento={formData} todosAlunos={todosAlunos} onUpdateEscalacao={handleUpdateEscalacao} onViewAluno={setViewingAluno} onDeleteAluno={handleRemoveAlunoDaEscalacao} />}
                        {evento && <AvaliacaoPosEvento evento={formData} todosAlunos={todosAlunos} onUpdateAvaliacoes={handleUpdateAvaliacoesPosEvento} />}
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Evento</button>
                        </div>
                    </form>
                </div>
            </div>
            {isCategoriaModalOpen && ( <GerenciarCategoriasModal categorias={categorias} onClose={() => setIsCategoriaModalOpen(false)} onAdd={onAddCategoria} onDelete={onDeleteCategoria} /> )}
            {viewingAluno && (
                <DetalheAluno
                    isModal={true}
                    aluno={viewingAluno}
                    onClose={() => setViewingAluno(null)}
                    onUpdateAluno={onUpdateAluno}
                    turmas={todosAlunos}
                    confirmAction={confirmAction}
                />
            )}
        </>
    );
};

const SelecionarAlunosModal = ({ todosAlunos, escalacaoAtual, onClose, onSave }) => {
    const [selectedIds, setSelectedIds] = React.useState(escalacaoAtual || []);
    const [searchTerm, setSearchTerm] = React.useState('');

    const handleToggleAluno = (alunoId) => {
        setSelectedIds(prev =>
            prev.includes(alunoId)
                ? prev.filter(id => id !== alunoId)
                : [...prev, alunoId]
        );
    };

    const handleSave = () => {
        onSave(selectedIds);
        onClose();
    };

    const alunosFiltrados = (todosAlunos || [])
        .filter(aluno => aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a,b) => a.nome.localeCompare(b.nome));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Convocar Alunos</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                    />
                </div>
                <div className="overflow-y-auto flex-grow border-t border-b py-2">
                    <ul className="space-y-2">
                        {alunosFiltrados.map(aluno => (
                            <li key={aluno.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                                <label htmlFor={`aluno-${aluno.id}`} className="flex items-center cursor-pointer flex-grow">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                                        {aluno.foto ? <img src={aluno.foto} alt={aluno.nome} className="w-full h-full rounded-full object-cover" /> : <User size={18} className="text-gray-500" />}
                                    </div>
                                    <span className="font-medium text-gray-800">{aluno.nome}</span>
                                </label>
                                <input
                                    type="checkbox"
                                    id={`aluno-${aluno.id}`}
                                    checked={selectedIds.includes(aluno.id)}
                                    onChange={() => handleToggleAluno(aluno.id)}
                                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Convocação ({selectedIds.length})</button>
                </div>
            </div>
        </div>
    );
};

const AlunoDetalhesDropdown = ({ aluno }) => {
    const formattedDate = new Date(aluno.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return (
        // Adicionamos a barreira de clique aqui para evitar que o modal feche
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 pl-12 mr-1" onClick={(e) => e.stopPropagation()}>
            <InfoItemCopiavel label="RG" value={aluno.rg} />
            <InfoItemCopiavel label="CPF" value={aluno.cpf} />
            <InfoItemCopiavel label="Nasc" value={aluno.dataNascimento} displayTransform={() => formattedDate} copyValue={formattedDate} />
        </div>
    );
};

const EscalacaoEvento = ({ evento, todosAlunos, onUpdateEscalacao, onViewAluno, onDeleteAluno }) => {
    const [isSelecaoModalOpen, setSelecaoModalOpen] = React.useState(false);
    const [expandedAlunos, setExpandedAlunos] = React.useState([]);

    const toggleAlunoDetalhes = (alunoId) => {
        setExpandedAlunos(prev =>
            prev.includes(alunoId)
                ? prev.filter(id => id !== alunoId)
                : [...prev, alunoId]
        );
    };

    const alunosEscalados = React.useMemo(() => {
        return (evento.escalacao || [])
            .map(alunoId => todosAlunos.find(a => a.id === alunoId))
            .filter(Boolean)
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [evento.escalacao, todosAlunos]);

    return (
        <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold text-gray-700">Escalação ({alunosEscalados.length})</h4>
                <button type="button" onClick={() => setSelecaoModalOpen(true)} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200">Gerenciar Convocados</button>
            </div>
            <div className="p-2 bg-gray-50 rounded-md min-h-[50px]">
                {alunosEscalados.length > 0 ? (
                    <ul className="space-y-2">
                        {alunosEscalados.map((aluno, index) => (
                            <li key={aluno.id} className="flex flex-col text-sm bg-white p-2 rounded shadow-sm group">
                                <div className="flex items-center justify-between w-full">
                                    <button type="button" onClick={() => onViewAluno(aluno)} className="flex items-center gap-3 text-left hover:text-blue-600 flex-grow">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            {aluno.foto ? <img src={aluno.foto} alt={aluno.nome} className="w-full h-full rounded-full object-cover" /> : <User size={18} className="text-gray-500" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{index + 1}. {aluno.nome}</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center">
                                        <button type="button" onClick={() => toggleAlunoDetalhes(aluno.id)} className="p-1 text-gray-500 hover:text-blue-600">
                                            {expandedAlunos.includes(aluno.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                        <button type="button" onClick={() => onDeleteAluno(aluno.id)} className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                {expandedAlunos.includes(aluno.id) && <AlunoDetalhesDropdown aluno={aluno} />}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 text-sm py-2">Nenhum aluno convocado.</p>
                )}
            </div>
            {isSelecaoModalOpen && (
                <SelecionarAlunosModal todosAlunos={todosAlunos} escalacaoAtual={evento.escalacao || []} onClose={() => setSelecaoModalOpen(false)} onSave={onUpdateEscalacao} />
            )}
        </div>
    );
};
const AvaliacaoPosEvento = ({ evento, todosAlunos, onUpdateAvaliacoes }) => {
    const alunosEscalados = React.useMemo(() => {
        return (evento.escalacao || [])
            .map(alunoId => todosAlunos.find(a => a.id === alunoId))
            .filter(Boolean)
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [evento.escalacao, todosAlunos]);

    const handleSaveAvaliacao = (alunoId, field, value) => {
        const avaliacaoExistente = (evento.avaliacoesPosEvento || []).find(a => a.alunoId === alunoId) || { alunoId };
        const outrasAvaliacoes = (evento.avaliacoesPosEvento || []).filter(a => a.alunoId !== alunoId);
        const novasAvaliacoes = [...outrasAvaliacoes, { ...avaliacaoExistente, [field]: value }];
        onUpdateAvaliacoes(novasAvaliacoes);
    };

    const RatingSelector = ({ value, onSave }) => {
        const ratings = ['Precisa Melhorar', 'Mediano', 'Bom', 'Muito Bom', 'Excelente'];
        return (
            <div className="flex flex-wrap items-center gap-2 mt-2">
                {ratings.map(rating => (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => onSave(rating)}
                        className={`px-2.5 py-1 text-xs rounded-full font-semibold transition-colors ${
                            value === rating
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="pt-4 border-t mt-4">
            <h4 className="text-lg font-bold text-gray-700 mb-2">Pós-evento: Avaliação de Desempenho</h4>
            <div className="space-y-3">
                {alunosEscalados.map(aluno => {
                    const avaliacaoExistente = (evento.avaliacoesPosEvento || []).find(a => a.alunoId === aluno.id);
                    return (
                        <div key={aluno.id} className="bg-gray-50 p-3 rounded-md">
                            <p className="font-semibold text-gray-800">{aluno.nome}</p>
                            <RatingSelector
                                value={avaliacaoExistente?.desempenho || ''}
                                onSave={(v) => handleSaveAvaliacao(aluno.id, 'desempenho', v)}
                            />
                            <div className="mt-2">
                                <EditableInfoItem
                                    type="textarea"
                                    value={avaliacaoExistente?.observacoes || ''}
                                    onSave={(v) => handleSaveAvaliacao(aluno.id, 'observacoes', v)}
                                    textClassName="text-sm text-gray-600 italic"
                                    displayTransform={(v) => v || 'Adicionar observações...'}
                                />
                            </div>
                        </div>
                    );
                })}
                {alunosEscalados.length === 0 && <p className="text-center text-gray-500 text-sm py-2">Convoque alunos para poder avaliá-los.</p>}
            </div>
        </div>
    );
};

// --- Telas de Autenticação ---

const LoginScreen = ({ setAuthScreen }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // CORREÇÃO DE SEGURANÇA APLICADA AQUI:
            // Diz ao Firebase para manter a sessão apenas enquanto o navegador estiver aberto.
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('E-mail ou senha inválidos. Tente novamente.');
            console.error("Erro de login:", err);
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-center">
                    <Shield className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900">
                    Acessar ao Gestor FC
                </h2>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            E-mail
                        </label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                            {loading ? <Loader className="animate-spin" /> : 'Entrar'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-600">
                    Não tem uma conta?{' '}
                    <button onClick={() => setAuthScreen('register')} className="font-medium text-blue-600 hover:underline">
                        Crie uma aqui
                    </button>
                </p>
            </div>
        </div>
    );
};

const RegisterScreen = ({ setAuthScreen }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('professor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, name: name, email: email, role: role, status: 'pending'
            });
            setSuccess(true);
        } catch (err) {
            // LÓGICA DE ERRO APRIMORADA AQUI
            if (err.code === 'auth/weak-password') {
                setError('A senha deve ter no mínimo 6 caracteres.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está em uso.');
            } else { 
                setError('Ocorreu um erro ao criar a conta.'); 
            }
            console.error("Erro de registro:", err);
        }
        setLoading(false);
    };

    if (success) { 
        return ( <div className="flex items-center justify-center min-h-screen bg-gray-100"> <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md text-center"> <Check size={48} className="mx-auto text-green-500" /> <h2 className="text-2xl font-bold text-gray-900">Cadastro Enviado!</h2> <p className="text-gray-600"> Sua solicitação de perfil foi enviada ao Administrador. Seu acesso será liberado após a aprovação. </p> <button onClick={() => setAuthScreen('login')} className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700" > Voltar para o Login </button> </div> </div> ) }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">Criar Conta</h2>
                <form className="space-y-4" onSubmit={handleRegister}>
                    <div> <label htmlFor="name">Nome Completo</label> <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" /> </div>
                    <div> <label htmlFor="email-register">E-mail</label> <input id="email-register" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" /> </div>
                    <div> <label htmlFor="password-register">Senha</label> <input id="password-register" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" /> </div>
                    <div>
                        <label htmlFor="role">Cargo</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md">
                            {ROLES.filter(r => r !== 'admin').map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setAuthScreen('login')} className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium bg-gray-200 hover:bg-gray-300"> Cancelar </button>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"> {loading ? <Loader className="animate-spin" /> : 'Criar Conta'} </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PendingScreen = ({ handleLogout }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md text-center">
                <Clock size={48} className="mx-auto text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Aguardando Aprovação</h2>
                <p className="text-gray-600">
                    Sua conta foi criada, mas ainda precisa ser aprovada por um administrador. Por favor, aguarde.
                </p>
                <button
                    onClick={handleLogout}
                    className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    Sair
                </button>
            </div>
        </div>
    );
};

// --- Seção de Solicitações de Acesso Pendentes ---

const GestaoUsuarios = ({ allUsers, onUpdateUserStatus, onUpdateUserRole, confirmAction, currentUser }) => {
    const usuariosPendentes = (allUsers || []).filter(u => u.status === 'pending');
    const usuariosAprovados = (allUsers || []).filter(u => u.status === 'approved');

    const handleRoleChange = (userId, newRole) => {
        onUpdateUserRole(userId, newRole);
    };
    
    const handleDeleteUser = (user) => {
        confirmAction(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${user.name}? Esta ação não pode ser desfeita.`, () => {
            onUpdateUserStatus(user.id, 'rejected');
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestão de Acessos</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Solicitações Pendentes ({usuariosPendentes.length})</h3>
                {usuariosPendentes.length > 0 ? ( <ul className="divide-y divide-gray-200"> {usuariosPendentes.map(user => ( <li key={user.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between"> <div> <p className="font-medium text-gray-900">{user.name}</p> <p className="text-sm text-gray-500">{user.email} - (Cargo solicitado: {user.role})</p> </div> <div className="flex gap-2 mt-2 sm:mt-0"> <button onClick={() => onUpdateUserStatus(user.id, 'approved')} className="bg-green-500 text-white px-3 py-1 text-sm rounded-md hover:bg-green-600">Aprovar</button> <button onClick={() => onUpdateUserStatus(user.id, 'rejected')} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600">Rejeitar</button> </div> </li> ))} </ul> ) : ( <p className="text-gray-500">Nenhuma solicitação pendente no momento.</p> )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Usuários Aprovados ({usuariosAprovados.length})</h3>
                <ul className="divide-y divide-gray-200">
                    {usuariosAprovados.map(user => (
                        <li key={user.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <label htmlFor={`role-${user.id}`} className="text-sm font-medium text-gray-600">Nível:</label>
                                {/* LÓGICA DE TRAVA CORRIGIDA AQUI */}
                                <select id={`role-${user.id}`} value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="p-1 border rounded-md shadow-sm text-sm" disabled={user.id === currentUser.uid}>
                                    {ROLES.map(role => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}
                                </select>
                                <button onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-700" title="Excluir usuário" disabled={user.id === currentUser.uid}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


// --- BARRA DE NAVEGAÇÃO ---

const Sidebar = ({ activeView, setActiveView, resetSelection, onOpenSettings, userPermissions }) => {
    
    const allNavItems = [
        { id: 'visaoGeral', label: 'Visão Geral', icon: BarChart2 },
        { id: 'alunos', label: 'Alunos', icon: User },
        { id: 'turmas', label: 'Turmas', icon: Users },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
        { id: 'eventos', label: 'Eventos', icon: CalendarDays },
        { id: 'aluguelQuadra', label: 'Aluguel de Quadra', icon: ClipboardCheck, href: 'https://app-agendamento-society.vercel.app/#gestor' },
        { id: 'metas', label: 'Metas', icon: Target },
        { id: 'comunicacao', label: 'Comunicação', icon: Bell },
    ];

    const navItems = allNavItems.filter(item => (userPermissions.view || []).includes(item.id));
    const handleNavClick = (viewId) => { resetSelection(); setActiveView(viewId); };

    return (
        <nav className="bg-white w-20 lg:w-64 p-4 flex flex-col justify-between shadow-lg">
            <div>
                <div className="flex flex-col items-center justify-center mb-10">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gray-200 mb-2 overflow-hidden">
    
                        <img 
                            src="https://firebasestorage.googleapis.com/v0/b/gestor-futebol-app.firebasestorage.app/o/logo%2FLogo%20Ousacs.png?alt=media&token=6476accd-1c49-4fe2-ab8a-ddf836bde910" 
                            alt="Logo da Escolinha" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="hidden lg:block text-xl font-bold text-gray-800">{NOME_DA_ESCOLA}</h1>
                </div>

                <ul>
                    {navItems.map(item => {
                        const inactiveClasses = 'text-gray-600 hover:bg-gray-200';
                        if (item.href) {
                            return (
                                <li key={item.id} className="mb-4">
                                    <a href={item.href} target="_blank" rel="noopener noreferrer" className={`flex items-center w-full p-3 rounded-lg transition-colors ${inactiveClasses}`}>
                                        <item.icon className="h-6 w-6" />
                                        <span className="hidden lg:block ml-4 font-medium">{item.label}</span>
                                    </a>
                                </li>
                            );
                        }
                        const activeClasses = 'bg-blue-600 text-white shadow-md';
                        const finalClasses = `flex items-center w-full p-3 rounded-lg transition-colors ${activeView === item.id ? activeClasses : inactiveClasses}`;
                        return (
                            <li key={item.id} className="mb-4">
                                <button onClick={() => handleNavClick(item.id)} className={finalClasses}>
                                    <item.icon className="h-6 w-6" />
                                    <span className="hidden lg:block ml-4 font-medium">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="relative">
                <button onClick={onOpenSettings} className="flex items-center w-full p-3 rounded-lg text-gray-600 hover:bg-gray-200">
                    <Settings className="h-6 w-6" />
                    <span className="hidden lg:block ml-4 font-medium">Configurações</span>
                </button>
                {/* ASSINATURA DO DESENVOLVEDOR - Adicionar no final */}
            <div className="mt-auto p-4 text-center">
                <a 
                    href="https://www.linkedin.com/in/jardel-feitosa96/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-300"
                >
                    Create by Jardel Feitosa
                </a>
            </div>
            </div>
        </nav>
    );
};

// --- TODOS OS COMPONENTES DA PÁGINA AGORA ESTÃO DEFINIDOS AQUI ---

const VisaoGeral = ({ alunos, eventos, onSelectAluno, onSelectEvento, categorias, turmas, userPermissions }) => {
    const [showFinancials, setShowFinancials] = React.useState(false);
    const [isPendentesModalOpen, setIsPendentesModalOpen] = React.useState(false);

    const StatCard = ({ icon: Icon, title, value, color, isSensitive = false }) => {
        const colorClasses = { blue: 'text-blue-500 bg-blue-100', green: 'text-green-500 bg-green-100', red: 'text-red-500 bg-red-100' };
        const canShowValue = !isSensitive || (userPermissions.canViewFinancials && showFinancials);
        return ( <div className="bg-white p-4 rounded-lg shadow-md flex items-center"> <div className={`p-3 rounded-full ${colorClasses[color]}`}> <Icon className="h-6 w-6" /> </div> <div className="ml-4"> <p className="text-gray-500 text-sm font-medium">{title}</p> <p className="text-2xl font-bold text-gray-800">{canShowValue ? value : 'R$ ****'}</p> </div> </div> );
    };

    const totalAlunos = (alunos || []).length;
    const alunosAtivos = (alunos || []).filter(a => a.status === 'Ativo').length;

    const { receitaMes, valorPagamentosPendentes, alunosPendentes } = React.useMemo(() => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth();
        let receita = 0;
        let valorPendente = 0;
        const listaPendentes = [];

        (alunos || []).filter(a => a.status === 'Ativo').forEach(aluno => {
            const situacao = getSituacaoMensalidade(aluno);
            if (situacao.status === 'Vencido') {
                // Usa o valor de mensalidade individual do aluno, ou 0 se não estiver definido
                valorPendente += (aluno.valorMensalidade || 0);
                listaPendentes.push(aluno);
            }
            (aluno.pagamentos || []).forEach(p => {
                if (p.status === 'Pago' && p.dataPagamento) {
                    const dataPag = new Date(p.dataPagamento + 'T00:00:00');
                    if (dataPag.getMonth() === mes && dataPag.getFullYear() === ano) {
                        receita += p.valor;
                    }
                }
            });
        });
        return { receitaMes: receita, valorPagamentosPendentes: valorPendente, alunosPendentes: listaPendentes };
    }, [alunos]);
    
    const eventosDoMes = React.useMemo(() => { const hoje = new Date(); const mesAtual = hoje.getMonth(); const anoAtual = hoje.getFullYear(); hoje.setHours(0, 0, 0, 0); const jogosNoMes = []; (eventos || []).forEach(evento => { if (!evento.realizado) { (evento.partidas || []).forEach(partida => { const dataPartida = new Date(partida.data + 'T00:00:00'); if (dataPartida.getMonth() === mesAtual && dataPartida.getFullYear() === anoAtual && dataPartida >= hoje) { jogosNoMes.push({ ...partida, dataObj: dataPartida, evento }); } }); } }); return jogosNoMes.sort((a, b) => a.dataObj - b.dataObj); }, [eventos]);
    const aniversariantesDoMes = React.useMemo(() => { const mesAtual = new Date().getMonth() + 1; return (alunos || []).filter(aluno => { if (!aluno.dataNascimento) return false; const mesAniversario = parseInt(aluno.dataNascimento.split('-')[1], 10); return mesAniversario === mesAtual; }).sort((a, b) => parseInt(a.dataNascimento.split('-')[2], 10) - parseInt(b.dataNascimento.split('-')[2], 10)); }, [alunos]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Visão Geral</h2>
                {userPermissions.canViewFinancials && ( <button onClick={() => setShowFinancials(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500" title={showFinancials ? "Ocultar valores" : "Mostrar valores"}> {showFinancials ? <EyeOff size={24} /> : <Eye size={24} />} </button> )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={Users} title="Total de Alunos" value={totalAlunos} color="blue" />
                <StatCard icon={User} title="Alunos Ativos" value={alunosAtivos} color="green" />
                <StatCard icon={DollarSign} title="Receita do Mês" value={`R$ ${receitaMes.toFixed(2)}`} color="blue" isSensitive={true} />
                <div onClick={() => setIsPendentesModalOpen(true)} className="cursor-pointer">
                    <StatCard icon={DollarSign} title="Pagamentos Pendentes" value={`R$ ${valorPagamentosPendentes.toFixed(2)}`} color="red" isSensitive={true} />
                </div>
            </div>
             
            <StudentsChart alunos={alunos} />

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-flow-col-dense gap-8 mt-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 flex-shrink-0">Jogos do Mês</h3>
                    <div className="overflow-y-auto flex-grow">
                        {eventosDoMes.length > 0 ? ( <ul className="divide-y divide-gray-200"> {eventosDoMes.map(partida => ( <li key={`${partida.evento.id}-${partida.id}`} onClick={() => onSelectEvento(partida.evento)} className="py-3 cursor-pointer group"> <p className="font-semibold text-gray-900 group-hover:text-blue-600">{partida.evento.title}</p> <p className="text-sm text-gray-500"> {partida.dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })} vs {partida.adversario} </p> </li> ))} </ul> ) : ( <p className="text-gray-500">Nenhum jogo agendado para este mês.</p> )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 flex-shrink-0">Aniversariantes do Mês</h3>
                    <div className="overflow-y-auto flex-grow">
                        {aniversariantesDoMes.length > 0 ? ( <ul className="divide-y divide-gray-200"> {aniversariantesDoMes.map(aluno => ( <li key={aluno.id} onClick={() => onSelectAluno(aluno)} className="py-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-md px-2"> <div className="flex items-center"> <Cake size={16} className="mr-3 text-orange-400" /> <span className="font-medium text-gray-800">{aluno.nome}</span> </div> <span className="text-sm text-gray-500"> Dia {parseInt(aluno.dataNascimento.split('-')[2], 10)} </span> </li> ))} </ul> ) : ( <p className="text-gray-500">Nenhum aniversariante este mês.</p> )}
                    </div>
                </div>
            </div>
             {isPendentesModalOpen && <PendentesModal alunosPendentes={alunosPendentes} onClose={() => setIsPendentesModalOpen(false)} onSelectAluno={onSelectAluno} />}
        </div>
    );
};

// Função que calcula a situação da mensalidade do mês atual para um aluno
const getSituacaoMensalidade = (aluno) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    if (!aluno.diaVencimento) {
        return { status: 'Não definido', dias: null };
    }

    // LÓGICA DE BUSCA APRIMORADA
    const nomeMes = hoje.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();
    
    const pagamentoDoMes = (aluno.pagamentos || []).find(p => {
        if (p.status !== 'Pago' || !p.dataPagamento) return false;

        const dataPag = new Date(p.dataPagamento + 'T00:00:00');
        
        // A verificação agora é pela data do pagamento, não pela descrição.
        // Isso é 100% confiável.
        return dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
    });

    if (pagamentoDoMes) {
        return { status: 'Pago', dias: null };
    }

    // Se não foi pago, calcula o status com base na data de vencimento
    const diaVencimento = new Date(anoAtual, mesAtual, aluno.diaVencimento);
    const diffTime = diaVencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'Vencido', dias: Math.abs(diffDays) };
    } else {
        return { status: 'A vencer', dias: diffDays };
    }
};

// Componente visual para exibir a tag de status
const StatusPagamentoTag = ({ situacao }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
    let text = situacao.status;

    switch (situacao.status) {
        case 'Pago':
            colorClasses = 'bg-green-100 text-green-800';
            break;
        case 'A vencer':
            if (situacao.dias <= 5) {
                // Faltando 5 dias ou menos, fica amarelo (alerta)
                colorClasses = 'bg-yellow-100 text-yellow-800';
            } else {
                // Faltando mais de 5 dias, fica azul (informativo)
                colorClasses = 'bg-blue-100 text-blue-800';
            }
            
            text = `A vencer em ${situacao.dias} dias`;
            if (situacao.dias === 0) text = 'Vence hoje';
            if (situacao.dias === 1) text = 'Vence amanhã';
            break;
        case 'Vencido':
            colorClasses = 'bg-red-100 text-red-800';
            text = `Vencido há ${situacao.dias} dias`;
            if (situacao.dias === 1) text = `Vencido há 1 dia`;
            break;
    }

    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {text}
        </span>
    );
};

// --- Função de Automação de Cobrança ---
const handleSendWhatsAppReminder = (e, aluno) => {
    e.stopPropagation(); // Impede que o clique no botão abra o perfil do aluno

    const contatoPrincipal = (aluno.contatos || [])[0];
    if (!contatoPrincipal?.valor) {
        alert(`O aluno ${aluno.nome} não tem um número de contato principal registado.`);
        return;
    }

    const situacao = getSituacaoMensalidade(aluno);
    let mensagem = '';
    const nomeContato = contatoPrincipal.nome || "Responsável";

    if (situacao.status === 'Vencido') {
        const diasTexto = situacao.dias === 1 ? '1 dia' : `${situacao.dias} dias`;
        mensagem = `Olá, ${nomeContato}!\n\nAqui é da ${NOME_DA_ESCOLA}.\n\nA mensalidade do(a) aluno(a) ${aluno.nome} *está vencida há ${diasTexto}*.\n\nPara regularizar a situação, a nossa chave PIX é:\n${SUA_CHAVE_PIX}\n\nObrigado!`;
    } else if (situacao.status === 'A vencer') {
        const diasTexto = situacao.dias === 0 ? 'hoje' : (situacao.dias === 1 ? 'amanhã' : `em ${situacao.dias} dias`);
        mensagem = `Olá, ${nomeContato}!\n\nAqui é da ${NOME_DA_ESCOLA}.\n\nA mensalidade do(a) aluno(a) ${aluno.nome} *vence ${diasTexto}*.\n\nPara efetuar o pagamento, a nossa chave PIX é:\n${SUA_CHAVE_PIX}\n\nObrigado!`;
    } else {
        return; // Não faz nada se o pagamento estiver em dia
    }

    // Limpa o número de telefone e cria o link
    const telefoneLimpo = contatoPrincipal.valor.replace(/\D/g, '');
    const linkWhatsApp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(linkWhatsApp, '_blank');
};

const GestaoAlunos = ({ alunos, turmas, onSelectAluno, onAddOrUpdateAluno, onDeleteAlunos, userPermissions, onOpenBulkUpdate }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('Ativo');
    const [pagamentoFilter, setPagamentoFilter] = React.useState('Todos');
    const [selectedAlunos, setSelectedAlunos] = React.useState([]);
    const [anoNascimentoFiltro, setAnoNascimentoFiltro] = React.useState(''); // NOVO: Estado para o filtro de ano

    // --- CÁLCULOS MEMOIZADOS ---
    const statusCounts = React.useMemo(() => { const counts = { Todos: (alunos || []).length, Ativo: 0, Inativo: 0 }; (alunos || []).forEach(aluno => { if (aluno.status === 'Ativo') counts.Ativo++; else if (aluno.status === 'Inativo') counts.Inativo++; }); return counts; }, [alunos]);
    const pagamentoStatusCounts = React.useMemo(() => { const counts = { Todos: 0, Pago: 0, 'A vencer': 0, Vencido: 0, 'Não definido': 0 }; (alunos || []).filter(a => a.status === 'Ativo').forEach(aluno => { const situacao = getSituacaoMensalidade(aluno); counts.Todos++; if (counts[situacao.status] !== undefined) { counts[situacao.status]++; } }); return counts; }, [alunos]);
    
    // NOVO: Gera a lista de anos de nascimento disponíveis para o dropdown
    const anosDisponiveis = React.useMemo(() => {
        if (!alunos || alunos.length === 0) return [];
        const anos = alunos.map(aluno => aluno.dataNascimento ? new Date(aluno.dataNascimento).getFullYear() : null);
        return [...new Set(anos.filter(ano => ano))].sort((a, b) => b - a); // Ordena do mais recente para o mais antigo
    }, [alunos]);

    // MODIFICADO: Lógica de filtragem atualizada para incluir o ano de nascimento
    const filteredAndSortedAlunos = React.useMemo(() => {
        return (alunos || [])
            .filter(aluno => {
                if (statusFilter !== 'Todos' && aluno.status !== statusFilter) return false;
                if (pagamentoFilter !== 'Todos') {
                    const situacao = getSituacaoMensalidade(aluno);
                    if (situacao.status !== pagamentoFilter) return false;
                }
                // Adiciona a verificação do ano de nascimento
                if (anoNascimentoFiltro && (!aluno.dataNascimento || new Date(aluno.dataNascimento).getFullYear() != anoNascimentoFiltro)) {
                    return false;
                }
                if (searchTerm && !aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                
                return true;
            })
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [alunos, searchTerm, statusFilter, pagamentoFilter, anoNascimentoFiltro]); // Adiciona o novo filtro à lista de dependências

    
    // --- FUNÇÕES DE MANIPULAÇÃO ---
    const handleSave = async (alunoData) => { await onAddOrUpdateAluno(alunoData); setIsModalOpen(false); };
    const handleSelectOne = (e, id) => { e.stopPropagation(); if (selectedAlunos.includes(id)) { setSelectedAlunos(prev => prev.filter(alunoId => alunoId !== id)); } else { setSelectedAlunos(prev => [...prev, id]); } };
    const handleSelectAll = (e) => { if (e.target.checked) { setSelectedAlunos(filteredAndSortedAlunos.map(a => a.id)); } else { setSelectedAlunos([]); } };
    const handleDeleteSelected = () => { onDeleteAlunos(selectedAlunos); setSelectedAlunos([]); };

    const statusOptions = ['Todos', 'Ativo', 'Inativo'];
    const pagamentoStatusOptions = ['Todos', 'Pago', 'A vencer', 'Vencido'];

    return (
        <div>
            {/* CABEÇALHO E BARRA DE BUSCA/AÇÕES */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Alunos</h2>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-64"> <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /> <input type="text" placeholder="Buscar aluno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border rounded-lg shadow-sm" /> </div>
                    <div className="flex items-center gap-2"> {userPermissions.canEdit && ( <button onClick={onOpenBulkUpdate} className="bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300" title="Atualização em Massa"> <Upload size={20} /> </button> )} {userPermissions.canEdit && ( <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:bg-blue-700 transition"> <Plus className="h-5 w-5 mr-2" /> Adicionar Aluno </button> )} </div>
                </div>
            </div>

            {/* ÁREA DE FILTROS */}
            <div className="space-y-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap"> <span className="text-sm font-medium text-gray-600">Filtrar por status:</span> {statusOptions.map(status => ( <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors flex items-center gap-2 ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}> <span>{status}</span> <span className={`px-2 rounded-full text-xs ${statusFilter === status ? 'bg-blue-400' : 'bg-gray-300'}`}> {statusCounts[status]} </span> </button> ))} </div>
                <div className="flex items-center gap-2 flex-wrap"> <span className="text-sm font-medium text-gray-600">Filtrar por mensalidade:</span> {pagamentoStatusOptions.map(status => ( <button key={status} onClick={() => setPagamentoFilter(status)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors flex items-center gap-2 ${pagamentoFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}> <span>{status}</span> <span className={`px-2 rounded-full text-xs ${pagamentoFilter === status ? 'bg-blue-400' : 'bg-gray-300'}`}> {pagamentoStatusCounts[status]} </span> </button> ))} </div>
                
                {/* NOVO: Filtro por ano de nascimento */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-600">Filtrar por ano:</span>
                    <select
                        value={anoNascimentoFiltro}
                        onChange={(e) => setAnoNascimentoFiltro(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition"
                    >
                        <option value="">Todos os anos</option>
                        {anosDisponiveis.map(ano => (
                            <option key={ano} value={ano}>{ano}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Barra de Ações de Seleção */}
            {selectedAlunos.length > 0 && userPermissions.canDelete && ( <div className="bg-blue-100 border border-blue-200 rounded-lg p-2 mb-4 flex justify-between items-center"> <span className="font-semibold text-blue-800">{selectedAlunos.length} aluno(s) selecionado(s)</span> <button onClick={handleDeleteSelected} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600 flex items-center gap-2"> <Trash2 size={16} /> Excluir Selecionados </button> </div> )}
            
            {/* TABELA DE ALUNOS */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            {/* ... seu thead ... */}
                             <tr>
                                {userPermissions.canDelete && ( <th className="p-4 w-12 text-center"> <input type="checkbox" className="h-4 w-4 rounded text-blue-600" onChange={handleSelectAll} checked={filteredAndSortedAlunos.length > 0 && selectedAlunos.length === filteredAndSortedAlunos.length} /> </th> )}
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Nome</th>
                                <th className="p-4 text-center text-sm font-semibold text-gray-600">Status</th>
                                <th className="p-4 text-center text-sm font-semibold text-gray-600">Mensalidade</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">Turmas</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Contato Principal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {/* ... seu tbody com o map ... */}
                           {filteredAndSortedAlunos.map(aluno => { 
                                const contatoPrincipal = (aluno.contatos || [])[0]; 
                                const situacaoMensalidade = getSituacaoMensalidade(aluno); 
                                return ( 
                                    <tr key={aluno.id} onClick={() => onSelectAluno(aluno)} className="hover:bg-gray-50 cursor-pointer"> 
                                        {userPermissions.canDelete && ( <td className="p-4 text-center"> <input type="checkbox" className="h-4 w-4 rounded text-blue-600" checked={selectedAlunos.includes(aluno.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => handleSelectOne(e, aluno.id)} /> </td> )} 
                                        <td className="p-4 whitespace-nowrap"> <div className="flex items-center"> <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4 flex-shrink-0"> {aluno.foto ? <img src={aluno.foto} alt={aluno.nome} className="w-full h-full rounded-full object-cover" /> : <User className="text-gray-500" />} </div> <span className="font-medium text-gray-900">{aluno.nome}</span> </div> </td> 
                                        <td className="p-4 whitespace-nowrap text-center"> <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${aluno.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}> {aluno.status} </span> </td> 
                                        <td className="p-4 whitespace-nowrap text-center"> <StatusPagamentoTag situacao={situacaoMensalidade} /> </td> 
                                        <td className="p-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell"> {(aluno.turmaIds || []).map(id => (turmas || []).find(t => t.id === id)?.nome).filter(Boolean).join(', ')} </td> 
                                        <td className="p-4 whitespace-nowrap text-sm hidden md:table-cell"> 
                                            <div className="flex items-center justify-between">
                                                {contatoPrincipal ? ( 
                                                    <div> 
                                                        <p className="font-medium text-gray-900">{contatoPrincipal.nome} {contatoPrincipal.parentesco && <span className="text-gray-500 font-normal">({contatoPrincipal.parentesco})</span>}</p>
                                                        <p className="text-gray-500">{contatoPrincipal.valor}</p>
                                                    </div> 
                                                ) : ( 'N/A' )} 
                                                {(situacaoMensalidade.status === 'A vencer' || situacaoMensalidade.status === 'Vencido') && (
                                                    <button onClick={(e) => handleSendWhatsAppReminder(e, aluno)} className="p-2 rounded-full text-green-600 hover:bg-green-100">
              _``` 
<Send  size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </td> 
                                    </tr> 
                                ) 
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <AlunoModal aluno={null} onClose={() => setIsModalOpen(false)} onSave={handleSave} turmas={turmas} />}
        </div>
    );
};


const GestaoTurmas = ({ turmas, alunos, onSelectTurma, onAddOrUpdateTurma, onDeleteTurma, userPermissions }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingTurma, setEditingTurma] = React.useState(null);

    const openModal = (turma = null) => {
        setEditingTurma(turma);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingTurma(null);
        setIsModalOpen(false);
    };

    const handleSave = (turmaData) => {
        onAddOrUpdateTurma(turmaData, editingTurma ? editingTurma.id : null);
        closeModal();
    };

    const turmasOrdenadas = (turmas || []).sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Gestão de Turmas</h2>
                {userPermissions.canEdit && (
                    <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition">
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Turma
                    </button>
                )}
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Nome da Turma</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">Professor(es)</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Horário</th>
                                <th className="p-4 text-center text-sm font-semibold text-gray-600 hidden sm:table-cell">Alunos</th>
                                {/* Mostra a coluna Ações apenas se o usuário puder editar ou deletar */}
                                {(userPermissions.canEdit || userPermissions.canDelete) && (
                                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Ações</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {turmasOrdenadas.map(turma => {
                                const numAlunos = (alunos || []).filter(a => (a.turmaIds || []).includes(turma.id)).length;
                                return (
                                    <tr key={turma.id} className="hover:bg-gray-50">
                                        <td onClick={() => onSelectTurma(turma)} className="p-4 whitespace-nowrap cursor-pointer font-medium text-gray-900">{turma.nome}</td>
                                        <td onClick={() => onSelectTurma(turma)} className="p-4 whitespace-nowrap hidden sm:table-cell cursor-pointer text-gray-700">{(turma.professores || []).map(p => p.nome).join(', ')}</td>
                                        <td onClick={() => onSelectTurma(turma)} className="p-4 whitespace-nowrap hidden md:table-cell cursor-pointer text-gray-700">{turma.horario}</td>
                                        <td onClick={() => onSelectTurma(turma)} className="p-4 whitespace-nowrap hidden sm:table-cell cursor-pointer text-gray-700 text-center">{numAlunos}</td>
                                        {/* Mostra os botões de ação apenas se o usuário tiver a permissão correspondente */}
                                        {(userPermissions.canEdit || userPermissions.canDelete) && (
                                            <td className="p-4 whitespace-nowrap">
                                                {userPermissions.canEdit && (
                                                    <button onClick={(e) => { e.stopPropagation(); openModal(turma); }} className="text-blue-600 hover:text-blue-900 mr-3"><Edit size={20}/></button>
                                                )}
                                                {userPermissions.canDelete && (
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteTurma(turma.id); }} className="text-red-600 hover:text-red-900"><Trash2 size={20}/></button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <TurmaModal turma={editingTurma} onClose={closeModal} onSave={handleSave} />}
        </div>
    );
};

const EditableProfessorList = ({ professores, onUpdate }) => {
    const [isAdding, setIsAdding] = React.useState(false);
    const [newProfName, setNewProfName] = React.useState('');

    const handleUpdate = (index, newName) => {
        const updatedProfs = [...(professores || [])];
        updatedProfs[index].nome = newName;
        onUpdate(updatedProfs);
    };

    const handleRemove = (id) => {
        onUpdate((professores || []).filter(p => p.id !== id));
    };

    const handleAdd = () => {
        if (newProfName.trim() === '') return;
        const currentProfessores = professores || [];
        const newId = currentProfessores.length > 0 ? Math.max(...currentProfessores.map(p => p.id)) + 1 : 1;
        onUpdate([...currentProfessores, { id: newId, nome: newProfName }]);
        setNewProfName('');
        setIsAdding(false);
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-700 mb-3">Professores</h3>
            <div className="space-y-2">
                {(professores || []).map((prof, index) => (
                    <div key={prof.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md group">
                        <EditableInfoItem value={prof.nome} onSave={(v) => handleUpdate(index, v)} />
                        <button onClick={() => handleRemove(prof.id)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
            {isAdding ? (
                <div className="flex items-center gap-2 mt-2">
                    <input
                        type="text"
                        value={newProfName}
                        onChange={(e) => setNewProfName(e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                        placeholder="Nome do professor"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="text-green-500 hover:text-green-700"><Check size={20} /></button>
                    <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="text-sm text-blue-600 hover:underline mt-2">+ Adicionar Professor</button>
            )}
        </div>
    );
};

const DiasDeTreinoSelector = ({ diasDaSemana, onUpdate }) => {
    const dias = [
        { label: 'D', valor: 0 }, { label: 'S', valor: 1 }, { label: 'T', valor: 2 },
        { label: 'Q', valor: 3 }, { label: 'Q', valor: 4 }, { label: 'S', valor: 5 },
        { label: 'S', valor: 6 }
    ];

    const handleToggleDia = (diaValor) => {
        const currentDias = diasDaSemana || [];
        const novosDias = currentDias.includes(diaValor)
            ? currentDias.filter(d => d !== diaValor)
            : [...currentDias, diaValor];
        onUpdate(novosDias.sort());
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-700 mb-3">Dias de Treino</h3>
            <div className="flex gap-2">
                {dias.map(dia => (
                    <button
                        key={dia.valor}
                        onClick={() => handleToggleDia(dia.valor)}
                        className={`w-10 h-10 rounded-full font-bold transition-colors ${
                            (diasDaSemana || []).includes(dia.valor)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {dia.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const PlanejamentoTreinoDiario = ({ turma, onUpdateTurma }) => {

    const [dataSelecionada, setDataSelecionada] = React.useState(new Date());

    const diasDeTreino = React.useMemo(() => {
        const dias = [];
        const diasNoMes = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0).getDate();
        const diasDaSemanaDaTurma = turma.diasDaSemana || [];

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataAtual = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dia);
            if (diasDaSemanaDaTurma.includes(dataAtual.getDay())) {
                dias.push(dataAtual);
            }
        }
        return dias;
    }, [dataSelecionada, turma.diasDaSemana]);

    const handleUpdatePlanejamento = (dataChave, novoTexto) => {
        const novoPlanejamento = {
            ...(turma.planejamento || {}),
            [dataChave]: novoTexto,
        };
        onUpdateTurma({ ...turma, planejamento: novoPlanejamento });
    };

    const mudarMes = (inc) => {
        setDataSelecionada(prev => new Date(prev.getFullYear(), prev.getMonth() + inc, 1));
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Planejamento de Treino</h3>
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
                <button onClick={() => mudarMes(-1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeft/></button>
                <span className="font-bold text-lg">{dataSelecionada.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                <button onClick={() => mudarMes(1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronRight/></button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {diasDeTreino.map(dia => {
                    const dataChave = dia.toISOString().split('T')[0];
                    const diaFormatado = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const diaSemana = dia.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const planoDeTreino = turma.planejamento?.[dataChave] || '';

                    return (
                        <div key={dataChave}>
                             <label className="block text-sm font-medium text-gray-700">{diaFormatado} - {diaSemana}</label>
                             <EditableInfoItem
                                type="textarea"
                                value={planoDeTreino}
                                onSave={(v) => handleUpdatePlanejamento(dataChave, v)}
                                displayTransform={(v) => v || "Clique para adicionar o plano de treino..."}
                                textClassName={!planoDeTreino ? 'text-gray-400 italic' : ''}
                            />
                        </div>
                    );
                })}
                 {diasDeTreino.length === 0 && <p className="text-center text-gray-500 py-4">Selecione os dias de treino para este mês.</p>}
            </div>
        </div>
    );
};

const ControlePresenca = ({ turma, onUpdateTurma, alunosNaTurma }) => {

    const [dataSelecionada, setDataSelecionada] = React.useState(new Date());
    
    const alunosOrdenados = React.useMemo(() => 
        [...(alunosNaTurma || [])].sort((a, b) => a.nome.localeCompare(b.nome)),
        [alunosNaTurma]
    );

    const mesAnoChave = `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}`;

    const diasDeTreino = React.useMemo(() => {
        const dias = [];
        const diasNoMes = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0).getDate();
        const diasDaSemanaDaTurma = turma.diasDaSemana || [];

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataAtual = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dia);
            if (diasDaSemanaDaTurma.includes(dataAtual.getDay())) {
                dias.push(dataAtual);
            }
        }
        return dias;
    }, [dataSelecionada, turma.diasDaSemana]);
    
    const handlePresencaClick = (alunoId, data) => {
        const dataChave = data.toISOString().split('T')[0];
        const novaPresenca = JSON.parse(JSON.stringify(turma.presenca || {}));
        if (!novaPresenca[mesAnoChave]) { novaPresenca[mesAnoChave] = { registros: {} }; }
        if (!novaPresenca[mesAnoChave].registros) { novaPresenca[mesAnoChave].registros = {}; }
        if (!novaPresenca[mesAnoChave].registros[dataChave]) { novaPresenca[mesAnoChave].registros[dataChave] = {}; }
        const presencaAtual = novaPresenca[mesAnoChave].registros[dataChave][alunoId];
        if (presencaAtual === 'presente') { novaPresenca[mesAnoChave].registros[dataChave][alunoId] = 'ausente'; } 
        else if (presencaAtual === 'ausente') { novaPresenca[mesAnoChave].registros[dataChave][alunoId] = 'NT'; } 
        else if (presencaAtual === 'NT') { delete novaPresenca[mesAnoChave].registros[dataChave][alunoId]; } 
        else { novaPresenca[mesAnoChave].registros[dataChave][alunoId] = 'presente'; }
        onUpdateTurma({ ...turma, presenca: novaPresenca });
    };

    const mudarMes = (inc) => {
        setDataSelecionada(prev => new Date(prev.getFullYear(), prev.getMonth() + inc, 1));
    };

    const handlePrint = () => { window.print(); };
    const handleDownloadJPEG = () => { alert("Funcionalidade de Download (JPEG) em desenvolvimento."); };

    return (
        <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Controle de Presença</h3>
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
                <button onClick={() => mudarMes(-1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeft/></button>
                <span className="font-bold text-lg">{dataSelecionada.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                <button onClick={() => mudarMes(1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronRight/></button>
            </div>
            <div className="overflow-x-auto">
                <table id="tabela-presenca" className="w-full border-collapse text-center">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border p-2 sticky left-0 bg-gray-50 z-10 text-xs font-light">ALUNO</th>
                            {diasDeTreino.map(dia => ( <th key={`weekday-${dia.toISOString()}`} className="border p-1 text-xs font-light"> {dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()} </th> ))}
                            <th className="border p-2 text-xs font-light">PRESENÇAS</th>
                        </tr>
                        <tr className="bg-gray-50">
                             <th className="border p-2 sticky left-0 bg-gray-50 z-10"></th>
                            {diasDeTreino.map(dia => ( <th key={`day-${dia.toISOString()}`} className="border p-2 text-sm font-medium"> {dia.getDate()} </th> ))}
                             <th className="border p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {alunosOrdenados.map((aluno, index) => {
                            const presencas = Object.values(turma.presenca?.[mesAnoChave]?.registros || {}).filter(registroDiario => registroDiario[aluno.id] === 'presente').length;
                            return (
                                <tr key={aluno.id}>
                                    <td className="border p-2 whitespace-nowrap sticky left-0 bg-white z-10 text-left"> <div className="flex items-center"> <span className="w-6 text-right mr-2 font-semibold text-gray-500">{index + 1}.</span> <span>{aluno.nome}</span> </div> </td>
                                    {diasDeTreino.map(dia => {
                                        const dataChave = dia.toISOString().split('T')[0];
                                        const status = turma.presenca?.[mesAnoChave]?.registros?.[dataChave]?.[aluno.id];
                                        let bgColor = 'bg-white';
                                        let content = null;
                                        if (status === 'presente') { bgColor = 'bg-green-200'; content = <Check size={16} className="mx-auto text-green-800" />; } 
                                        else if (status === 'ausente') { bgColor = 'bg-red-200'; content = <X size={16} className="mx-auto text-red-800" />; } 
                                        else if (status === 'NT') { bgColor = 'bg-gray-300'; content = <span className="text-xs font-bold text-gray-700">NT</span>; }
                                        return ( <td key={`${aluno.id}-${dataChave}`} className={`border p-2 cursor-pointer hover:bg-gray-200 ${bgColor}`} onClick={(e) => { e.stopPropagation(); handlePresencaClick(aluno.id, dia); }}> {content} </td> )
                                    })}
                                    <td className="border p-2 font-bold">{presencas}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {(alunosNaTurma || []).length === 0 && <p className="text-center text-gray-500 py-4">Adicione alunos à turma para registrar a presença.</p>}
            </div>
            <div className="mt-4 flex gap-4 justify-end">
                <button onClick={handleDownloadJPEG} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-gray-700 transition"> <Download size={18} className="mr-2" /> Baixar Tabela (JPEG) </button>
                <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-gray-700 transition"> <Printer size={18} className="mr-2" /> Imprimir </button>
            </div>
        </div>
    );
};

const DetalheTurma = ({ turma, onUpdateTurma, onBack, alunosNaTurma, todosAlunos, onUpdateAluno, onRemoveAlunoDaTurma, confirmAction }) => {
    const [isAddAlunoModalOpen, setAddAlunoModalOpen] = React.useState(false);
    const [horaInicio, setHoraInicio] = React.useState((turma.horario || '').split(' - ')[1]?.split(' às ')[0] || '09:00');
    const [horaTermino, setHoraTermino] = React.useState((turma.horario || '').split(' às ')[1] || '10:30');
    const [isAlunosListOpen, setIsAlunosListOpen] = React.useState(false);
    const [viewingAluno, setViewingAluno] = React.useState(null); // Estado para controlar o modal do aluno

    React.useEffect(() => {
        const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const diasSelecionados = (turma.diasDaSemana || []).map(d => diasDaSemana[d]).join('/');
        const novoHorario = `${diasSelecionados} - ${horaInicio} às ${horaTermino}`;
        if (turma.horario !== novoHorario) {
            onUpdateTurma({ ...turma, horario: novoHorario });
        }
    }, [turma.diasDaSemana, horaInicio, horaTermino, onUpdateTurma, turma]);

    const handleUpdateProfessores = (novosProfessores) => {
        onUpdateTurma({ ...turma, professores: novosProfessores });
    };

    const handleAddAlunoNaTurma = (alunoId) => {
        const aluno = todosAlunos.find(a => a.id === alunoId);
        const novasTurmas = [...(aluno.turmaIds || []), turma.id];
        onUpdateAluno({ ...aluno, turmaIds: novasTurmas });
        setAddAlunoModalOpen(false);
    };
    
    const alunosOrdenados = React.useMemo(() => 
        [...(alunosNaTurma || [])].sort((a, b) => a.nome.localeCompare(b.nome)),
        [alunosNaTurma]
    );

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-blue-600 font-semibold mb-6 hover:underline">
                <ArrowLeft size={20} className="mr-2" />
                Voltar para a lista de turmas
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <EditableInfoItem
                    value={turma.nome}
                    onSave={(v) => onUpdateTurma({ ...turma, nome: v })}
                    textClassName="text-3xl font-bold text-gray-800"
                    inputClassName="text-3xl font-bold"
                />
                <p className="text-lg text-gray-600 mb-6"><strong>Horário:</strong> {turma.horario}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <EditableProfessorList professores={turma.professores} onUpdate={handleUpdateProfessores} />
                    <div>
                        <DiasDeTreinoSelector diasDaSemana={turma.diasDaSemana || []} onUpdate={(novosDias) => onUpdateTurma({ ...turma, diasDaSemana: novosDias })} />
                        <div className="flex gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Início</label>
                                <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Término</label>
                                <input type="time" value={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <PlanejamentoTreinoDiario turma={turma} onUpdateTurma={onUpdateTurma} />
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-700">Alunos na Turma ({(alunosNaTurma || []).length})</h3>
                            <button onClick={() => setIsAlunosListOpen(prev => !prev)} className="text-blue-600 hover:text-blue-800">
                                {isAlunosListOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                        <button onClick={() => setAddAlunoModalOpen(true)} className="bg-blue-600 text-white px-3 py-2 text-sm rounded-lg flex items-center shadow-md hover:bg-blue-700 transition">
                            <UserPlus size={18} className="mr-2" />
                            Adicionar Aluno
                        </button>
                    </div>
                    {isAlunosListOpen && (
                        <>
                            {(alunosOrdenados || []).length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {alunosOrdenados.map(aluno => (
                                        <li key={aluno.id} className="py-3 flex items-center justify-between group">
                                            <div className="flex items-center cursor-pointer" onClick={() => setViewingAluno(aluno)}>
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4 flex-shrink-0">
                                                    {aluno.foto ? <img src={aluno.foto} alt={aluno.nome} className="w-full h-full rounded-full object-cover" /> : <User className="text-gray-500" />}
                                                </div>
                                                <span className="font-medium text-gray-800 group-hover:text-blue-600">{aluno.nome}</span>
                                            </div>
                                            <button onClick={() => onRemoveAlunoDaTurma(aluno.id)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={18} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Nenhum aluno cadastrado nesta turma.</p>
                            )}
                        </>
                    )}
                </div>

                <div id="printable-area">
                    <ControlePresenca turma={turma} onUpdateTurma={onUpdateTurma} alunosNaTurma={alunosNaTurma} />
                </div>

            </div>
            {isAddAlunoModalOpen && <AddAlunoTurmaModal todosAlunos={todosAlunos} turmaAtual={turma} onClose={() => setAddAlunoModalOpen(false)} onAddAluno={handleAddAlunoNaTurma} />}
            
            {viewingAluno && (
                <DetalheAluno
                    isModal={true}
                    aluno={viewingAluno}
                    onClose={() => setViewingAluno(null)}
                    onUpdateAluno={onUpdateAluno}
                    turmas={todosAlunos}
                    confirmAction={confirmAction}
                />
            )}
        </div>
    );
};


// Eventos Realizados no Mês Modal
const EventosRealizadosModal = ({ eventos, categorias, onClose, onViewDetails }) => {
    const [filtroCategoria, setFiltroCategoria] = React.useState('todos');

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // LÓGICA CORRIGIDA AQUI
    const eventosRealizadosNoMes = (eventos || []).filter(e =>
        e.realizado && (e.partidas || []).some(p => {
            const dataPartida = new Date(p.data + 'T00:00:00');
            return dataPartida.getMonth() === mesAtual && dataPartida.getFullYear() === anoAtual;
        })
    );

    const eventosFiltrados = filtroCategoria === 'todos'
        ? eventosRealizadosNoMes
        : eventosRealizadosNoMes.filter(e => e.categoriaId === filtroCategoria);
    
    const getCategoriaNome = (id) => (categorias || []).find(c => c.id === id)?.nome || 'Sem Categoria';

    const handleViewDetails = (evento) => {
        onViewDetails(evento);
        onClose(); // Fecha este modal para abrir o outro
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Eventos Realizados no Mês</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                    <button 
                        onClick={() => setFiltroCategoria('todos')}
                        className={`px-3 py-1 text-sm rounded-full font-semibold ${filtroCategoria === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Todos
                    </button>
                    {(categorias || []).map(cat => (
                         <button 
                            key={cat.id}
                            onClick={() => setFiltroCategoria(cat.id)}
                            className={`px-3 py-1 text-sm rounded-full font-semibold ${filtroCategoria === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {cat.nome}
                        </button>
                    ))}
                </div>
                <div className="overflow-y-auto flex-grow">
                    {eventosFiltrados.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {eventosFiltrados.map(evento => (
                                <li key={evento.id} onClick={() => handleViewDetails(evento)} className="py-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                                    <p className="font-bold text-gray-800">{evento.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {/* Mostra a data da primeira partida para referência */}
                                        {new Date((evento.partidas[0]?.data || '') + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {getCategoriaNome(evento.categoriaId)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum evento realizado neste mês para a categoria selecionada.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Eventos Realizados no Ano Modal
const EventosRealizadosAnoModal = ({ eventos, categorias, onClose, onViewDetails }) => {
    const [filtroCategoria, setFiltroCategoria] = React.useState('todos');

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    // LÓGICA CORRIGIDA AQUI
    const eventosRealizadosNoAno = (eventos || []).filter(e =>
        e.realizado && (e.partidas || []).some(p => {
            const dataPartida = new Date(p.data + 'T00:00:00');
            return dataPartida.getFullYear() === anoAtual;
        })
    );

    const eventosFiltrados = filtroCategoria === 'todos'
        ? eventosRealizadosNoAno
        : eventosRealizadosNoAno.filter(e => e.categoriaId === filtroCategoria);
    
    const getCategoriaNome = (id) => (categorias || []).find(c => c.id === id)?.nome || 'Sem Categoria';

    const handleViewDetails = (evento) => {
        onViewDetails(evento);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Eventos Realizados no Ano</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                    <button 
                        onClick={() => setFiltroCategoria('todos')}
                        className={`px-3 py-1 text-sm rounded-full font-semibold ${filtroCategoria === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Todos
                    </button>
                    {(categorias || []).map(cat => (
                         <button 
                            key={cat.id}
                            onClick={() => setFiltroCategoria(cat.id)}
                            className={`px-3 py-1 text-sm rounded-full font-semibold ${filtroCategoria === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {cat.nome}
                        </button>
                    ))}
                </div>
                <div className="overflow-y-auto flex-grow">
                    {eventosFiltrados.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {eventosFiltrados.map(evento => (
                                <li key={evento.id} onClick={() => handleViewDetails(evento)} className="py-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                                    <p className="font-bold text-gray-800">{evento.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {/* Mostra a data da primeira partida para referência */}
                                        {new Date((evento.partidas[0]?.data || '') + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {getCategoriaNome(evento.categoriaId)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum evento realizado neste ano para a categoria selecionada.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const PartidaModal = ({ partida, onClose, onSave }) => {
    const [formData, setFormData] = React.useState({
        data: partida?.data || '',
        adversario: partida?.adversario || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSave({ ...partida, ...formData });
        onClose();
    };
    
    // Função para permitir salvar com a tecla Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">{partida?.id ? 'Editar Partida' : 'Adicionar Partida'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                {/* A tag <form> foi trocada por uma <div> para evitar aninhamento */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data da Partida</label>
                        <input type="date" name="data" value={formData.data} onChange={handleChange} onKeyDown={handleKeyDown} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Adversário</label>
                        <input type="text" name="adversario" value={formData.adversario} onChange={handleChange} onKeyDown={handleKeyDown} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Ex: Time B" required />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                        {/* A lógica de submit foi movida para o onClick do botão */}
                        <button type="button" onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Partida</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultadoPartidaModal = ({ partida, alunosEscalados, onClose, onSave }) => {
    const [placarNosso, setPlacarNosso] = React.useState(partida.placarNosso ?? '');
    const [placarAdversario, setPlacarAdversario] = React.useState(partida.placarAdversario ?? '');
    const [gols, setGols] = React.useState(partida.gols || []); // [{ alunoId, quantidade }]
    const [error, setError] = React.useState('');

    const getGolsPorAluno = (alunoId) => {
        const golInfo = gols.find(g => g.alunoId === alunoId);
        return golInfo ? golInfo.quantidade : 0;
    };

    // A função agora recebe o evento 'e' para poder pará-lo
    const handleGolChange = (e, alunoId, delta) => {
        e.stopPropagation(); // Impede que o clique feche o modal
        
        const golsAtuais = getGolsPorAluno(alunoId);
        const novaQuantidade = Math.max(0, golsAtuais + delta);
        
        const outrosGols = gols.filter(g => g.alunoId !== alunoId);
        
        if (novaQuantidade > 0) {
            setGols([...outrosGols, { alunoId, quantidade: novaQuantidade }]);
        } else {
            setGols(outrosGols);
        }
        setError(''); // Limpa o erro ao ajustar os gols
    };

    const handleSubmit = () => {
        const totalGolsRegistrados = gols.reduce((acc, curr) => acc + curr.quantidade, 0);
        const placarNossoNum = Number(placarNosso);

        if (placarNossoNum > 0 && totalGolsRegistrados !== placarNossoNum) {
            setError(`O placar é de ${placarNossoNum} gols, mas você registrou ${totalGolsRegistrados}. Por favor, ajuste.`);
            return;
        }

        onSave({
            ...partida,
            placarNosso: placarNossoNum,
            placarAdversario: Number(placarAdversario),
            gols: gols
        });
        onClose();
    };

    const totalGolsRegistrados = gols.reduce((acc, curr) => acc + curr.quantidade, 0);
    const placarPreenchido = placarNosso !== '' && Number(placarNosso) >= 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col z-50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Registrar Resultado da Partida</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div>
                            <label className="block text-center text-sm font-medium text-gray-700">Gols Pró</label>
                            <input type="number" value={placarNosso} onChange={(e) => setPlacarNosso(e.target.value)} className="mt-1 text-center text-2xl font-bold w-24 border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <span className="text-3xl font-light text-gray-400 mt-6">x</span>
                        <div>
                            <label className="block text-center text-sm font-medium text-gray-700">Gols Contra</label>
                            <input type="number" value={placarAdversario} onChange={(e) => setPlacarAdversario(e.target.value)} className="mt-1 text-center text-2xl font-bold w-24 border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                    
                    {placarPreenchido && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold text-gray-800 mb-2">Quem marcou? ({totalGolsRegistrados}/{placarNosso})</h4>
                            <ul className="space-y-2">
                                {alunosEscalados.map(aluno => (
                                    <li key={aluno.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                                        <p className="font-medium">{aluno.nome}</p>
                                        <div className="flex items-center gap-3">
                                            {/* O onClick agora passa o evento 'e' para a função */}
                                            <button type="button" onClick={(e) => handleGolChange(e, aluno.id, -1)} className="w-7 h-7 bg-gray-200 rounded-full font-bold hover:bg-gray-300">-</button>
                                            <span className="w-6 text-center font-bold">{getGolsPorAluno(aluno.id)}</span>
                                            <button type="button" onClick={(e) => handleGolChange(e, aluno.id, 1)} className="w-7 h-7 bg-gray-200 rounded-full font-bold hover:bg-gray-300">+</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {error && <p className="text-sm text-red-600 text-center mt-2">{error}</p>}
                <div className="flex justify-end pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Resultado</button>
                </div>
            </div>
        </div>
    );
};

const GerenciarPartidas = ({ partidas, onUpdatePartidas, alunosEscalados, onSaveResultado }) => {
    const [isPartidaModalOpen, setIsPartidaModalOpen] = React.useState(false);
    const [editingPartida, setEditingPartida] = React.useState(null);
    const [isResultadoModalOpen, setIsResultadoModalOpen] = React.useState(false);

    const openPartidaModal = (partida = null) => {
        setEditingPartida(partida);
        setIsPartidaModalOpen(true);
    };

    const openResultadoModal = (partida) => {
        setEditingPartida(partida);
        setIsResultadoModalOpen(true);
    };

    // Esta função agora só atualiza o rascunho
    const handleSavePartida = (partidaData) => {
        let novasPartidas;
        if (editingPartida) {
            novasPartidas = (partidas || []).map(p => p.id === editingPartida.id ? { ...p, ...partidaData } : p);
        } else {
            const newId = (partidas || []).length > 0 ? Math.max(...(partidas || []).map(p => p.id)) + 1 : 1;
            novasPartidas = [...(partidas || []), { ...partidaData, id: newId }];
        }
        onUpdatePartidas(novasPartidas);
    };
    
    const handleDeletePartida = (partidaId) => {
        const novasPartidas = (partidas || []).filter(p => p.id !== partidaId);
        onUpdatePartidas(novasPartidas);
    };

    const partidasOrdenadas = (partidas || []).sort((a, b) => new Date(a.data) - new Date(b.data));

    return (
        <div className="pt-4 border-t mt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold text-gray-700">Partidas do Evento</h4>
                <button type="button" onClick={() => openPartidaModal()} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200">
                    <Plus size={16} className="inline mr-1" /> Adicionar Partida
                </button>
            </div>
            <div className="p-2 bg-gray-50 rounded-md min-h-[50px]">
                {partidasOrdenadas.length > 0 ? (
                    <ul className="space-y-2">
                        {partidasOrdenadas.map(partida => (
                            <li key={partida.id} className="flex items-center justify-between text-sm bg-white p-2 rounded shadow-sm">
                                <div>
                                    <p className="font-semibold">{new Date(partida.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-gray-600">
                                        vs {partida.adversario}
                                        {(partida.placarNosso !== undefined && partida.placarAdversario !== undefined) && 
                                            <span className="font-bold ml-2 text-blue-700">{partida.placarNosso} x {partida.placarAdversario}</span>
                                        }
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); openResultadoModal(partida); }} className="text-gray-600 hover:text-green-600" title="Adicionar/Editar Resultado">
                                        <Target size={16} />
                                    </button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); openPartidaModal(partida); }} className="text-blue-600 hover:text-blue-800" title="Editar Partida"><Edit size={16} /></button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePartida(partida.id); }} className="text-red-600 hover:text-red-800" title="Excluir Partida"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 text-sm py-2">Nenhuma partida adicionada.</p>
                )}
            </div>
            {isPartidaModalOpen && <PartidaModal partida={editingPartida} onClose={() => setIsPartidaModalOpen(false)} onSave={handleSavePartida} />}
            {/* Agora ele usa a nova função onSaveResultado */}
            {isResultadoModalOpen && <ResultadoPartidaModal partida={editingPartida} alunosEscalados={alunosEscalados} onClose={() => setIsResultadoModalOpen(false)} onSave={onSaveResultado} />}
        </div>
    );
};

const GestaoEventos = ({ eventos, categorias, onAddOrUpdateEvento, onDeleteEvento, onAddCategoria, onDeleteCategoria, todosAlunos, onUpdateAluno, onToggleRealizado, confirmAction, triggerUndo, eventoParaAbrir, clearEventoParaAbrir, userPermissions }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingEvento, setEditingEvento] = React.useState(null);
    const [isRealizadosMesModalOpen, setIsRealizadosMesModalOpen] = React.useState(false);
    const [isRealizadosAnoModalOpen, setIsRealizadosAnoModalOpen] = React.useState(false);

    useEffect(() => { if (eventoParaAbrir) { openModal(eventoParaAbrir); clearEventoParaAbrir(); } }, [eventoParaAbrir, clearEventoParaAbrir]);
    const openModal = (evento = null) => { setEditingEvento(evento); setIsModalOpen(true); };
    const closeModal = () => { setEditingEvento(null); setIsModalOpen(false); };
    const handleSave = (eventoData) => { onAddOrUpdateEvento(eventoData, editingEvento ? editingEvento.id : null); closeModal(); };
    const handleUpdateEscalacao = (eventoId, novaEscalacao) => { const eventoToUpdate = (eventos || []).find(e => e.id === eventoId); if (eventoToUpdate) { onAddOrUpdateEvento({ ...eventoToUpdate, escalacao: novaEscalacao }, eventoId); } };
    const getProximaPartida = (partidas) => { if (!partidas || partidas.length === 0) return null; const hoje = new Date(); hoje.setHours(0, 0, 0, 0); const partidasFuturas = partidas.map(p => ({ ...p, dataObj: new Date(p.data + 'T00:00:00') })).filter(p => p.dataObj >= hoje).sort((a, b) => a.dataObj - b.dataObj); return partidasFuturas[0]; };
    const eventosFuturos = (eventos || []).filter(e => !e.realizado).map(e => ({...e, proximaPartida: getProximaPartida(e.partidas)})).sort((a, b) => { if (a.proximaPartida && !b.proximaPartida) return -1; if (!a.proximaPartida && b.proximaPartida) return 1; if (a.proximaPartida && b.proximaPartida) { return a.proximaPartida.dataObj - b.proximaPartida.dataObj; } return a.title.localeCompare(b.title); });
    const getCategoriaNome = (id) => (categorias || []).find(c => c.id === id)?.nome || 'Sem Categoria';
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const eventosRealizadosMes = (eventos || []).filter(e => e.realizado && (e.partidas || []).some(p => { const dataPartida = new Date(p.data + 'T00:00:00'); return dataPartida.getMonth() === mesAtual && dataPartida.getFullYear() === anoAtual; })).length;
    const eventosRealizadosAno = (eventos || []).filter(e => e.realizado && (e.partidas || []).some(p => { const dataPartida = new Date(p.data + 'T00:00:00'); return dataPartida.getFullYear() === anoAtual; })).length;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Agenda de Eventos</h2>
                {userPermissions.canEdit && (
                    <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition">
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Evento
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div onClick={() => setIsRealizadosMesModalOpen(true)} className="cursor-pointer"> <Card icon={CalendarDays} title="Eventos Realizados no Mês" value={eventosRealizadosMes} color="teal" /> </div>
                <div onClick={() => setIsRealizadosAnoModalOpen(true)} className="cursor-pointer"> <Card icon={CalendarDays} title="Eventos Realizados no Ano" value={eventosRealizadosAno} color="blue" /> </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Próximos Jogos</h3>
                <ul className="divide-y divide-gray-200">
                    {eventosFuturos.map(evento => (
                        <li key={evento.id} className="py-4 group">
                            <div className="flex items-start justify-between">
                                <div className="flex-grow cursor-pointer" onClick={() => openModal(evento)}>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{getCategoriaNome(evento.categoriaId)}</span>
                                        <p className="text-sm text-gray-600 font-semibold"> {evento.proximaPartida ? `${evento.proximaPartida.dataObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} vs ${evento.proximaPartida.adversario}` : 'Nenhuma partida agendada'} </p>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mt-1">{evento.title}</h3>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {userPermissions.canEdit && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); onToggleRealizado(evento); }} className={`p-2 rounded-full transition-colors ${evento.realizado ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title={evento.realizado ? "Marcar como não realizado" : "Marcar como realizado"}> <Check size={18} /> </button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal(evento); }} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                        </>
                                    )}
                                    {userPermissions.canDelete && (
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteEvento(evento.id, evento.title); }} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                    {eventosFuturos.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum evento futuro agendado.</p>}
                </ul>
            </div>
            {isModalOpen && <EventoModal evento={editingEvento} onClose={closeModal} onSave={handleSave} categorias={categorias} onAddCategoria={onAddCategoria} onDeleteCategoria={onDeleteCategoria} todosAlunos={todosAlunos} onUpdateEscalacao={handleUpdateEscalacao} onUpdateAluno={onUpdateAluno} confirmAction={confirmAction} triggerUndo={triggerUndo} userPermissions={userPermissions} />}
            {isRealizadosMesModalOpen && <EventosRealizadosModal eventos={eventos} categorias={categorias} onClose={() => setIsRealizadosMesModalOpen(false)} onViewDetails={openModal} />}
            {isRealizadosAnoModalOpen && <EventosRealizadosAnoModal eventos={eventos} categorias={categorias} onClose={() => setIsRealizadosAnoModalOpen(false)} onViewDetails={openModal} />}
        </div>
    );
};



const GestaoMetas = ({ metas, onAddMeta, onUpdateMetaStatus, onDeleteMeta, userPermissions }) => {
    const [addingMetaTo, setAddingMetaTo] = useState(null);
    const [newMetaText, setNewMetaText] = useState('');

    // Adicionamos as cores para cada coluna aqui
    const COLUMNS = [
        { id: 'a_fazer', title: 'A Fazer', color: 'bg-gray-200', textColor: 'text-gray-800' },
        { id: 'em_andamento', title: 'Em Andamento', color: 'bg-blue-200', textColor: 'text-blue-800' },
        { id: 'em_teste', title: 'Em Teste', color: 'bg-yellow-200', textColor: 'text-yellow-800' },
        { id: 'concluido', title: 'Concluído', color: 'bg-green-200', textColor: 'text-green-800' },
    ];

    const handleAddClick = (columnId) => {
        setAddingMetaTo(columnId);
    };

    const handleSaveNewMeta = () => {
        if (newMetaText.trim() === '') return;
        onAddMeta(newMetaText, addingMetaTo);
        setNewMetaText('');
        setAddingMetaTo(null);
    };

    const handleMoveTask = (meta) => {
        const currentIndex = COLUMNS.findIndex(col => col.id === meta.status);
        if (currentIndex >= COLUMNS.length - 1) return; 

        const nextColumn = COLUMNS[currentIndex + 1];
        onUpdateMetaStatus(meta.id, nextColumn.id);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Metas (Kanban)</h2>
            <div className="flex gap-6 overflow-x-auto pb-4">
                {COLUMNS.map(column => {
                    const tasksInColumn = (metas || []).filter(meta => meta.status === column.id);
                    return (
                        <div key={column.id} className="w-80 flex-shrink-0 bg-gray-100 rounded-lg shadow-md flex flex-col">
                            {/* O cabeçalho da coluna agora usa as cores definidas */}
                            <div className={`p-4 flex justify-between items-center rounded-t-lg ${column.color}`}>
                                <h3 className={`font-bold ${column.textColor}`}>{column.title} ({tasksInColumn.length})</h3>
                                {userPermissions.canEdit && column.id === 'a_fazer' && (
                                    <button onClick={() => handleAddClick(column.id)} className={`${column.textColor} hover:opacity-70`}>
                                        <PlusCircle size={22} />
                                    </button>
                                )}
                            </div>
                            <div className="p-4 space-y-3 flex-grow overflow-y-auto">
                                {addingMetaTo === column.id && (
                                    <div className="p-2 bg-white rounded-lg shadow">
                                        <textarea 
                                            value={newMetaText}
                                            onChange={(e) => setNewMetaText(e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm"
                                            placeholder="Descreva a meta..."
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button onClick={() => setAddingMetaTo(null)} className="text-gray-600"><X size={20}/></button>
                                            <button onClick={handleSaveNewMeta} className="text-green-600"><Check size={20}/></button>
                                        </div>
                                    </div>
                                )}
                                {tasksInColumn.map(meta => (
                                    <div key={meta.id} className="bg-white p-3 rounded-lg shadow group">
                                        <div className="flex items-start">
                                            {column.id !== 'concluido' && userPermissions.canEdit && (
                                                <button onClick={() => handleMoveTask(meta)} className="mr-3 mt-1 flex-shrink-0">
                                                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full hover:border-green-500 hover:bg-green-100 transition-colors"></div>
                                                </button>
                                            )}
                                            {column.id === 'concluido' && (
                                                 <Check size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                                            )}
                                            <p className="text-gray-800 flex-grow">{meta.text}</p>
                                            {userPermissions.canDelete && (
                                                <button onClick={() => onDeleteMeta(meta.id)} className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Comunicacao = () => {
    const [message, setMessage] = React.useState('');
    const [geminiPrompt, setGeminiPrompt] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [sent, setSent] = React.useState(false);

    const handleGenerateMessage = async () => {
        if (!geminiPrompt.trim()) return;
        setIsLoading(true);
        const prompt = `Você é um gestor de uma escola de futebol. Escreva um comunicado claro, breve e profissional para os pais dos alunos sobre o seguinte tópico: "${geminiPrompt}".`;
        const result = await callGemini(prompt);
        setMessage(result);
        setIsLoading(false);
    };

    const handleSend = () => {
        if(message.trim() === '') return;
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setMessage('');
            setGeminiPrompt('');
        }, 3000);
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Comunicação</h2>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Enviar Comunicado Geral</h3>
                <p className="text-gray-600 mb-4">Envie uma mensagem para todos os responsáveis. Use a IA para ajudar a redigir a mensagem.</p>
                
                <div className="mb-4">
                    <label htmlFor="gemini-prompt" className="block text-sm font-medium text-gray-700 mb-1">Ideia para o comunicado</label>
                    <div className="flex gap-2">
                        <input 
                            id="gemini-prompt"
                            type="text"
                            value={geminiPrompt}
                            onChange={(e) => setGeminiPrompt(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: cancelar treino amanhã por causa da chuva"
                        />
                        <button onClick={handleGenerateMessage} disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-purple-700 transition disabled:bg-purple-300">
                           {isLoading ? <Loader className="animate-spin" size={20} /> : <Sparkles size={20} />}
                           <span className="ml-2 hidden sm:inline">Gerar</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensagem Final</label>
                    <textarea 
                        id="message"
                        rows="8" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="A mensagem gerada pela IA aparecerá aqui...">
                    </textarea>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={handleSend} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition flex items-center justify-center ml-auto">
                        <Mail className="h-5 w-5 mr-2" />
                        Enviar Comunicado
                    </button>
                </div>
                {sent && <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">Mensagem enviada com sucesso! (Simulação)</div>}
            </div>
        </div>
    );
};

const HistoricoPresencaAluno = ({ aluno, turmas }) => {
    // CORREÇÃO APLICADA AQUI: Inicia com a data atual
    const [mesSelecionado, setMesSelecionado] = React.useState(new Date());

    const registrosDoAluno = React.useMemo(() => {
        const registros = [];
        const alunoTurmas = (turmas || []).filter(t => (aluno.turmaIds || []).includes(t.id));

        alunoTurmas.forEach(turma => {
            for (const mesAnoChave in turma.presenca) {
                for (const dataChave in turma.presenca[mesAnoChave].registros) {
                    const status = turma.presenca[mesAnoChave].registros[dataChave][aluno.id];
                    if (status) {
                        registros.push({
                            data: new Date(dataChave + 'T00:00:00'), // Garante que a data seja interpretada corretamente
                            status,
                            turmaNome: turma.nome,
                        });
                    }
                }
            }
        });
        return registros.sort((a, b) => b.data - a.data);
    }, [aluno, turmas]);

    const registrosFiltrados = registrosDoAluno.filter(r => 
        r.data.getFullYear() === mesSelecionado.getFullYear() &&
        r.data.getMonth() === mesSelecionado.getMonth()
    );

    const mudarMes = (inc) => {
        setMesSelecionado(prev => new Date(prev.getFullYear(), prev.getMonth() + inc, 1));
    };

    const presencas = registrosFiltrados.filter(r => r.status === 'presente').length;
    const faltas = registrosFiltrados.filter(r => r.status === 'ausente').length;

    return (
        <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Histórico de Presença</h3>
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
                <button onClick={() => mudarMes(-1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeft/></button>
                <span className="font-bold text-lg">{mesSelecionado.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                <button onClick={() => mudarMes(1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronRight/></button>
            </div>

            <div className="flex justify-around mb-4 text-center p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-2xl font-bold text-green-600">{presencas}</p>
                    <p className="text-sm text-gray-500">Presenças</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-red-600">{faltas}</p>
                    <p className="text-sm text-gray-500">Faltas</p>
                </div>
            </div>

            <div className="max-h-60 overflow-y-auto pr-2">
                {registrosFiltrados.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {registrosFiltrados.map((registro, index) => (
                            <li key={index} className="py-2 flex justify-between items-center">
                                <div>
                                    <span className="font-medium">{registro.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                    <span className="text-sm text-gray-500 ml-2">({registro.turmaNome})</span>
                                </div>
                                {registro.status === 'presente' && <span className="text-green-600 font-semibold">Presente</span>}
                                {registro.status === 'ausente' && <span className="text-red-600 font-semibold">Ausente</span>}
                                {registro.status === 'NT' && <span className="text-gray-600 font-semibold">Não Treinou</span>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum registro de presença para este mês.</p>
                )}
            </div>
        </div>
    );
};

const DetalheAluno = ({ aluno, onUpdateAluno, onBack, turmas, confirmAction, triggerUndo, isModal = false, onClose = () => {} }) => {
    const [isAvaliacaoModalOpen, setAvaliacaoModalOpen] = React.useState(false);
    const [editingAvaliacao, setEditingAvaliacao] = React.useState(null);
    const [isPagamentoModalOpen, setPagamentoModalOpen] = React.useState(false);
    const [editingPagamento, setEditingPagamento] = React.useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = React.useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);
    const [summaryContent, setSummaryContent] = React.useState('');
    const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
    const [isUploadingFoto, setIsUploadingFoto] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const docInputRef = React.useRef(null);
    
    const hoje = new Date();
    const niver = new Date(aluno.dataNascimento);
    const isAniversario = hoje.getMonth() === niver.getMonth();
    
    const calculateDaysRemaining = (endDateString) => { if (!endDateString) return 'Não definido'; const endDate = new Date(endDateString); const today = new Date(); today.setHours(0, 0, 0, 0); endDate.setHours(0, 0, 0, 0); const timeDiff = endDate.getTime() - today.getTime(); if (timeDiff < 0) return 'Plano Expirado'; const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24)); return `${daysRemaining} dias restantes`; };
    const handleGenerateSummary = async () => { setIsSummaryLoading(true); setIsSummaryModalOpen(true); const historicoFormatado = (aluno.avaliacoes || []).map(av => `Data: ${new Date(av.data).toLocaleDateString('pt-BR')}, Peso: ${av.peso}, Altura: ${av.altura}, Velocidade: ${av.velocidade}, Salto: ${av.salto}, Observações: ${av.observacoes}`).join('\n'); const prompt = `Você é um treinador de futebol experiente. Analise o seguinte histórico de avaliações do atleta ${aluno.nome} e escreva um resumo conciso (em 2 ou 3 parágrafos) sobre seu desempenho e evolução. Destaque os pontos fortes e as áreas que precisam de melhoria, oferecendo um feedback construtivo.\n\nHistórico:\n${historicoFormatado}`; const result = await callGemini(prompt); setSummaryContent(result); setIsSummaryLoading(false); };
    const handleFieldUpdate = (field, value) => { onUpdateAluno({ ...aluno, [field]: value }); };
    
    // LÓGICA DA FOTO 100% CORRIGIDA PARA O FIREBASE STORAGE
    const handleFotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingFoto(true);

        // Se já existe uma foto, apaga a antiga do Storage primeiro
        if (aluno.fotoStoragePath) {
            const oldPhotoRef = ref(storage, aluno.fotoStoragePath);
            try { await deleteObject(oldPhotoRef); } catch (error) { console.warn("Foto antiga não encontrada no Storage, continuando..."); }
        }

        const storageRef = ref(storage, `fotos_perfil/${aluno.id}/${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            // Salva tanto o link visível quanto o caminho interno para futuras exclusões
            onUpdateAluno({ ...aluno, foto: downloadURL, fotoStoragePath: snapshot.ref.fullPath });
        } catch (error) {
            console.error("Erro ao fazer upload da foto:", error);
            alert("Não foi possível carregar a foto. Tente novamente.");
        } finally {
            setIsUploadingFoto(false);
        }
    };
    
    const handleRemoveFoto = () => {
        if (!aluno.foto) return;
        confirmAction("Tem a certeza de que quer remover a foto de perfil?", async () => {
            if (aluno.fotoStoragePath) {
                const photoRef = ref(storage, aluno.fotoStoragePath);
                try { await deleteObject(photoRef); } catch (error) { console.error("Erro ao apagar foto do Storage:", error); }
            }
            onUpdateAluno({ ...aluno, foto: null, fotoStoragePath: null });
        });
    };

    const handleDocumentoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const storageRef = ref(storage, `documentos/${aluno.id}/${Date.now()}_${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            const newDocument = { id: Date.now(), name: file.name, type: file.type.includes('pdf') ? 'pdf' : 'image', url: downloadURL, storagePath: snapshot.ref.fullPath };
            handleFieldUpdate('documentos', [...(aluno.documentos || []), newDocument]);
        } catch (error) {
            console.error("Erro ao fazer upload do documento:", error);
            alert("Não foi possível carregar o documento. Tente novamente.");
        }
    };
    
    const handleRemoveDocumento = (docToRemove) => {
        const executeDelete = async () => {
            if (docToRemove.storagePath) {
                const fileRef = ref(storage, docToRemove.storagePath);
                try {
                    await deleteObject(fileRef);
                } catch (error) {
                     console.error("Erro ao apagar o documento do Storage:", error);
                     if (error.code !== 'storage/object-not-found') {
                        alert("Não foi possível apagar o documento do armazenamento. Tente novamente.");
                        return; // Para a execução se não conseguir apagar do storage
                     }
                }
            }
            // Remove da lista do aluno independentemente de ter apagado do storage (para limpar registos antigos)
            const novosDocumentos = (aluno.documentos || []).filter(d => d.id !== docToRemove.id);
            handleFieldUpdate('documentos', novosDocumentos);
        };
        confirmAction(`Tem a certeza de que quer remover o documento "${docToRemove.name}"?`, executeDelete);
    };

    const handleOpenAvaliacaoModal = (avaliacao = null) => { setEditingAvaliacao(avaliacao); setAvaliacaoModalOpen(true); };
    const handleSaveAvaliacao = (avaliacaoData) => { let avaliacoesAtualizadas; const currentAvaliacoes = aluno.avaliacoes || []; if (editingAvaliacao) { avaliacoesAtualizadas = currentAvaliacoes.map(a => a.id === editingAvaliacao.id ? { ...a, ...avaliacaoData } : a); } else { const newId = currentAvaliacoes.length > 0 ? Math.max(...currentAvaliacoes.map(a => a.id)) + 1 : 1; avaliacoesAtualizadas = [{ ...avaliacaoData, id: newId }, ...currentAvaliacoes]; } handleFieldUpdate('avaliacoes', avaliacoesAtualizadas); setAvaliacaoModalOpen(false); setEditingAvaliacao(null); };
    const handleRemoveAvaliacao = (id) => { const executeDelete = () => { const avaliacoesAtualizadas = (aluno.avaliacoes || []).filter(a => a.id !== id); handleFieldUpdate('avaliacoes', avaliacoesAtualizadas); }; confirmAction("Tem certeza que deseja remover esta avaliação?", executeDelete); };
    const handleOpenPagamentoModal = (pagamento = null) => { setEditingPagamento(pagamento); setPagamentoModalOpen(true); };
    const handleSavePagamento = (pagamentoData) => { const numericPagamentoData = { ...pagamentoData, valor: parseFloat(pagamentoData.valor) || 0 }; let pagamentosAtualizados; const currentPagamentos = aluno.pagamentos || []; if (editingPagamento) { pagamentosAtualizados = currentPagamentos.map(p => p.id === editingPagamento.id ? { ...p, ...numericPagamentoData } : p); } else { const newId = currentPagamentos.length > 0 ? Math.max(...currentPagamentos.map(p => p.id)) + 1 : 1; pagamentosAtualizados = [...currentPagamentos, { ...numericPagamentoData, id: newId }]; } handleFieldUpdate('pagamentos', pagamentosAtualizados); setPagamentoModalOpen(false); setEditingPagamento(null); };
    const handleRemovePagamento = (id) => { const executeDelete = () => { const pagamentosAtualizados = (aluno.pagamentos || []).filter(p => p.id !== id); onUpdateAluno({ ...aluno, pagamentos: pagamentosAtualizados }); }; confirmAction("Tem certeza que deseja remover este pagamento?", executeDelete); };

    const content = (
        <div className="relative">
             {!isModal && ( <button onClick={onBack} className="flex items-center text-blue-600 font-semibold mb-6 hover:underline"> <ArrowLeft size={20} className="mr-2" /> Voltar para a lista de alunos </button> )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 {isModal && ( <div className="flex justify-end mb-4"> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div> )}
                <div className="flex flex-col md:flex-row items-start">
                     <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 text-center">
                        <div className="w-40 h-40 rounded-full bg-gray-200 mx-auto flex items-center justify-center relative group">
                            {isUploadingFoto ? ( <Loader size={32} className="animate-spin text-blue-600" /> ) : (
                                <>
                                    {aluno.foto ? <img src={aluno.foto} alt={aluno.nome} className="w-full h-full rounded-full object-cover" /> : <User className="text-gray-400 w-20 h-20" />}
                                    <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload size={32} />
                                    </div>
                                </>
                            )}
                        </div>
                        {isAniversario && ( <div className="flex items-center justify-center mt-2 text-yellow-500"> <Cake size={24} /> <span className="ml-2 font-semibold">Aniversariante do mês!</span> </div> )}
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={() => fileInputRef.current.click()} className="text-sm text-blue-600 hover:underline">Alterar Foto</button>
                            <button onClick={handleRemoveFoto} className="text-sm text-red-600 hover:underline">Remover Foto</button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFotoChange} accept="image/*" className="hidden" />
                    </div>
                    <div className="flex-grow">
                        <div className="flex items-start gap-4">
                            <EditableInfoItem value={aluno.nome} onSave={(v) => handleFieldUpdate('nome', v)} textClassName="text-3xl font-bold text-gray-800" inputClassName="text-3xl font-bold text-gray-800" hasCopy={true} />
                            <EditableInfoItem type="select" value={aluno.status} onSave={(v) => handleFieldUpdate('status', v)} options={[{value: 'Ativo', label: 'Ativo'}, {value: 'Inativo', label: 'Inativo'}]} displayTransform={(v) => ( <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${v === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v}</span> )} />
                        </div>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            <EditableInfoItem type="number" icon={DollarSign} label="Valor da Mensalidade" value={aluno.valorMensalidade} onSave={(v) => handleFieldUpdate('valorMensalidade', Number(v))} displayTransform={(v) => v ? `R$ ${Number(v).toFixed(2)}` : 'Não definido'} />
                            <EditableInfoItem type="number" icon={CalendarDays} label="Dia do Vencimento" value={aluno.diaVencimento} onSave={(v) => handleFieldUpdate('diaVencimento', Number(v))} displayTransform={(v) => v ? `Todo dia ${v}` : 'Não definido'} />
                             <EditableInfoItem type="date" icon={CalendarDays} label="Fim do Plano" value={aluno.dataFimPlano} onSave={(v) => handleFieldUpdate('dataFimPlano', v)} displayTransform={(v) => v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : 'Não definido'} />
                        </div>
                        <div className="mt-4 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <EditableInfoItem type="date" label="Data de Nascimento" value={aluno.dataNascimento} onSave={(v) => handleFieldUpdate('dataNascimento', v)} displayTransform={(v) => new Date(v).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} />
                            <EditableTurmasList label="Turmas" aluno={aluno} turmas={turmas} onUpdateAluno={onUpdateAluno} />
                            <EditableMultiInfoItem icon={Phone} label="Contatos" items={aluno.contatos || []} onUpdate={(newItems) => handleFieldUpdate('contatos', newItems)} fields={[ { name: 'parentesco', placeholder: 'Parentesco', className: 'w-1/4', autoFocus: true }, { name: 'nome', placeholder: 'Nome do Contato', className: 'w-1/2' }, { name: 'valor', placeholder: 'Número', className: 'w-1/4', mask: maskPhone, maxLength: 15 } ]} />
                            <EditableInfoItem type="textarea" label="Endereço" value={aluno.endereco} onSave={(v) => handleFieldUpdate('endereco', v)} hasCopy={true} className="sm:col-span-2" />
                             <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                                <EditableInfoItem label="RG" value={aluno.rg} onSave={(v) => handleFieldUpdate('rg', v)} mask={maskRG} maxLength={12} hasCopy={true} />
                                <EditableInfoItem label="CPF" value={aluno.cpf} onSave={(v) => handleFieldUpdate('cpf', v)} mask={maskCPF} maxLength={14} hasCopy={true} />
                            </div>
                            <EditableInfoItem type="textarea" label="Observações Médicas" value={aluno.problemasMedicos} onSave={(v) => handleFieldUpdate('problemasMedicos', v)} className="sm:col-span-2" />
                        </div>
                    </div>
                </div>
                 <HistoricoPresencaAluno aluno={aluno} turmas={turmas} />
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Documentos Anexados</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(aluno.documentos || []).map((doc) => ( <div key={doc.id} className="bg-gray-100 p-3 rounded-lg flex items-center justify-between group"> <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center flex-grow min-w-0"> {doc.type === 'pdf' ? <FileText className="text-red-500 mr-3 flex-shrink-0" /> : <ImageIcon className="text-blue-500 mr-3 flex-shrink-0" />} <span className="text-sm text-gray-800 truncate" title={doc.name}>{doc.name}</span> </a> <button onClick={() => handleRemoveDocumento(doc)} className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"> <Trash2 size={16} /> </button> </div> ))}
                        <button onClick={() => docInputRef.current.click()} className="bg-blue-50 border-2 border-dashed border-blue-300 text-blue-600 p-3 rounded-lg flex items-center justify-center hover:bg-blue-100 transition"> <Upload size={20} className="mr-2"/> Adicionar </button>
                        <input type="file" ref={docInputRef} onChange={handleDocumentoChange} accept=".png,.jpeg,.jpg,.pdf" className="hidden" />
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-700">Histórico de Pagamentos</h3>
                        <button onClick={() => handleOpenPagamentoModal()} className="bg-green-600 text-white px-3 py-2 text-sm rounded-lg flex items-center shadow-md hover:bg-green-700 transition"> <PlusCircle size={18} className="mr-2" /> Adicionar Pagamento </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50"> <tr> <th scope="col" className="px-6 py-3">Descrição</th> <th scope="col" className="px-6 py-3">Valor</th> <th scope="col" className="px-6 py-3">Status</th> <th scope="col" className="px-6 py-3">Data Pag.</th> <th scope="col" className="px-6 py-3">Forma Pag.</th> <th scope="col" className="px-6 py-3">Ações</th> </tr> </thead>
                            <tbody>
                                {(aluno.pagamentos || []).map(p => ( <tr key={p.id} className="bg-white border-b"> <td className="px-6 py-4 font-medium text-gray-900">{p.descricao}</td> <td className="px-6 py-4">R$ {Number(p.valor).toFixed(2)}</td> <td className="px-6 py-4"> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'Pago' ? 'bg-green-100 text-green-800' : p.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}> {p.status} </span> </td> <td className="px-6 py-4">{p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---'}</td> <td className="px-6 py-4">{p.formaPagamento || '---'}</td> <td className="px-6 py-4 flex items-center gap-2"> <button onClick={() => handleOpenPagamentoModal(p)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button> <button onClick={() => handleRemovePagamento(p.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button> {p.status === 'Pago'  } </td> </tr> ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-700">Histórico de Avaliações</h3>
                        <div className="flex gap-2">
                             <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="bg-purple-600 text-white px-3 py-2 text-sm rounded-lg flex items-center shadow-md hover:bg-purple-700 transition disabled:bg-purple-300"> <Sparkles size={18} className="mr-2" /> {isSummaryLoading ? 'Gerando...' : 'Gerar Resumo'} </button>
                            <button onClick={() => handleOpenAvaliacaoModal()} className="bg-blue-600 text-white px-3 py-2 text-sm rounded-lg flex items-center shadow-md hover:bg-blue-700 transition"> <PlusCircle size={18} className="mr-2" /> Nova Avaliação </button>
                        </div>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50"> <tr> <th scope="col" className="px-6 py-3">Data</th> <th scope="col" className="px-6 py-3">Peso</th> <th scope="col" className="px-6 py-3">Altura</th> <th scope="col" className="px-6 py-3">Velocidade</th> <th scope="col" className="px-6 py-3">Salto</th> <th scope="col" className="px-6 py-3">Observações</th> <th scope="col" className="px-6 py-3">Ações</th> </tr> </thead>
                            <tbody>
                                {(aluno.avaliacoes || []).map(av => ( <tr key={av.id} className="bg-white border-b"> <td className="px-6 py-4 font-medium text-gray-900">{new Date(av.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td> <td className="px-6 py-4">{av.peso}</td> <td className="px-6 py-4">{av.altura}</td> <td className="px-6 py-4">{av.velocidade}</td> <td className="px-6 py-4">{av.salto}</td> <td className="px-6 py-4">{av.observacoes}</td> <td className="px-6 py-4 flex items-center gap-2"> <button onClick={() => handleOpenAvaliacaoModal(av)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button> <button onClick={() => handleRemoveAvaliacao(av.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button> </td> </tr> ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isPagamentoModalOpen && <PagamentoModal pagamento={editingPagamento} onClose={() => {setPagamentoModalOpen(false); setEditingPagamento(null);}} onSave={handleSavePagamento} />}
            {isAvaliacaoModalOpen && <AvaliacaoModal avaliacao={editingAvaliacao} onClose={() => {setAvaliacaoModalOpen(false); setEditingAvaliacao(null);}} onSave={handleSaveAvaliacao} />}
            {isCropModalOpen && <CropImageModal imageUrl={aluno.foto} onClose={() => setIsCropModalOpen(false)} />}
            {isSummaryModalOpen && <GeminiSummaryModal isLoading={isSummaryLoading} content={summaryContent} onClose={() => setIsSummaryModalOpen(false)} />}
        </div>
    );

    if (isModal) {
        return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}> <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}> {content} </div> </div> );
    }

    return content;
};



// --- Main App Component (Now with Firebase) ---

export default function App() {
  const [activeView, setActiveView] = useState('visaoGeral');
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [transacoes, setTransacoes] = useState(null);
  const [metas, setMetas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [eventoParaAbrir, setEventoParaAbrir] = useState(null);
  const [undoState, setUndoState] = useState({ isOpen: false, onUndo: null });
  const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', onConfirm: null });
  const undoTimeoutRef = useRef(null);
  const [historicoSaidas, setHistoricoSaidas] = useState([]); // This could also be a Firebase collection
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState('login'); // 'login' ou 'register'
  const [firestoreUser, setFirestoreUser] = useState(null);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({});
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const handleLogout = async () => { await signOut(auth);};
    const userPermissions = React.useMemo(() => { // Determina as permissões do usuário logado com base no seu cargo
    const role = firestoreUser?.role || 'analista'; // Se não houver usuário, usa as permissões do cargo mais restrito (analista)
     return PERMISSIONS[role] || PERMISSIONS.analista;}, [firestoreUser]);

  // --- Função de propagação de dados ---
  // Essa função é executada apenas uma vez para preencher o banco de dados com dados iniciais
  const seedDatabase = async () => {
    console.log("Checking if database needs seeding...");
    const batch = writeBatch(db);
    
    const metaRef = doc(db, 'meta', 'seeding');
    const metaSnap = await getDocs(collection(db, 'meta'));
    
    let seeded = false;
    metaSnap.forEach(doc => {
        if(doc.id === 'seeding' && doc.data().done) {
            seeded = true;
        }
    });

    if (!seeded) {
        console.log("Database is empty or not seeded. Seeding now...");
        
        // Seed Categorias and create a map from name to ID
        const categoriasIdMap = {};
        initialCategorias.forEach((cat) => {
            // Create a clean, predictable ID
            const id = `cat_${cat.nome.toLowerCase().replace(/ /g, '_').replace('ç', 'c').replace('ã', 'a')}`;
            const docRef = doc(collection(db, 'categorias'), id);
            categoriasIdMap[cat.nome] = docRef.id; // Map 'Campeonato' -> 'cat_campeonato'
            batch.set(docRef, { ...cat });
        });

        // Seed Turmas
        initialTurmas.forEach(turma => {
            const docRef = doc(collection(db, 'turmas'), turma.id); // Use predefined ID
            batch.set(docRef, { ...turma });
        });
        
        // Seed Alunos
        initialAlunos.forEach(aluno => {
            const docRef = doc(collection(db, 'alunos'));
            batch.set(docRef, { ...aluno });
        });

        // Seed Eventos using the map
        initialEventos.forEach(evento => {
            const docRef = doc(collection(db, 'eventos'));
            const newCategoriaId = categoriasIdMap[evento.categoriaId]; // Look up the ID
            const updatedEvento = { ...evento, categoriaId: newCategoriaId }; // Set the correct ID
            batch.set(docRef, updatedEvento);
        });

        // Seed Despesas (was 'financeiro')
        initialFinanceiro.forEach(item => {
            const docRef = doc(collection(db, 'despesas'));
            batch.set(docRef, item);
        });

        // Seed Metas
        initialMetas.forEach(item => {
            const docRef = doc(collection(db, 'metas'));
            batch.set(docRef, item);
        });

        // Set the flag to indicate seeding is done
        batch.set(metaRef, { done: true });
        
        await batch.commit();
        console.log("Database seeded successfully!");
    } else {
        console.log("Database already seeded. Skipping.");
    }
  };


  // --- useEffect para ouvir dados em tempo real do Firebase ---
  // Listener de Dados do Firebase e Seeding Inicial
    useEffect(() => {
        const seedDatabase = async () => {
        
        };

        seedDatabase().then(() => {
            // Listener para Alunos
            const unsubAlunos = onSnapshot(collection(db, 'alunos'), (snapshot) => {
                const alunosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAlunos(alunosData);
                setIsLoading(false);
            });

            // Listener para Turmas
            const unsubTurmas = onSnapshot(collection(db, 'turmas'), (snapshot) => {
                const turmasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTurmas(turmasData);
            });

            // Listener para Transações (Receitas/Despesas)
            const unsubTransacoes = onSnapshot(collection(db, 'transacoes'), (snapshot) => {
                const transacoesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTransacoes(transacoesData);
            });

            const unsubConfigs = onSnapshot(doc(db, 'configuracoes', 'financeiro'), (doc) => {
            if (doc.exists()) {
                setConfiguracoes(doc.data());
            }
            });

            // Listener para Metas
            const unsubMetas = onSnapshot(collection(db, 'metas'), (snapshot) => {
                const metasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMetas(metasData);
            });

            // Listener para Eventos
            const unsubEventos = onSnapshot(collection(db, 'eventos'), (snapshot) => {
                const eventosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEventos(eventosData);
            });

            // Listener para Categorias de Eventos
            const unsubCategorias = onSnapshot(collection(db, 'categorias'), (snapshot) => {
                const categoriasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCategorias(categoriasData);
            });
            

            // Função de limpeza para desligar todos os listeners
            return () => {
                unsubAlunos();
                unsubTurmas();
                unsubTransacoes();
                unsubMetas();
                unsubEventos();
                unsubCategorias();
            };
        });
    }, []); // Array de dependências vazio para rodar apenas uma vez

 // Listener de Autenticação e Perfil do Usuário

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            if (user) {
                setFirestoreLoading(true);
                const userDocRef = doc(db, "users", user.uid);
                const unsubDoc = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setFirestoreUser({ id: doc.id, ...doc.data() });
                        setAuthLoading(false);
                        setFirestoreLoading(false);
                    } else {
                        // CORREÇÃO DE SEGURANÇA: Se o documento do usuário não existe (foi rejeitado/deletado),
                        // desloga-o imediatamente.
                        setFirestoreUser(null);
                        signOut(auth); 
                        setAuthLoading(false);
                        setFirestoreLoading(false);
                    }
                });
                return () => unsubDoc();
            } else {
                setFirestoreUser(null);
                setAuthLoading(false);
                setFirestoreLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

// Efeito para verificar a versão e mostrar as notas da atualização
useEffect(() => {
    const lastSeenVersion = localStorage.getItem('gestorFC_lastSeenVersion');
    if (lastSeenVersion !== APP_VERSION) {
        setIsUpdateModalOpen(true);
    }
}, []); // Roda apenas uma vez quando o app carrega

// Listener para carregar dados específicos do Admin (como a lista de todos os usuários)
useEffect(() => {
    // Só executa se o usuário logado for um admin
    if (firestoreUser?.role === 'admin') {
        const unsubAllUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(usersList);
        });
        // Retorna a função de limpeza para este listener específico
        return () => unsubAllUsers();
    }
}, [firestoreUser]); // Este efeito depende do firestoreUser


  
  // --- Data Manipulation Functions (now interact with Firebase) ---

  const triggerUndo = (undoAction) => {
    // Por enquanto, vamos apenas logar no console para confirmar que funciona
    // No futuro, podemos implementar um toast de notificação visual aqui
    console.log("Ação de desfazer foi acionada com sucesso:", undoAction);
};

  const handleSelectAlunoFromVisaoGeral = (aluno) => {
        setActiveView('alunos');
        setSelectedAluno(aluno);
    };

    const handleUpdateConfigs = async (newConfigs) => {
    const docRef = doc(db, 'configuracoes', 'financeiro');
    // Usamos set com merge: true para criar o documento se ele não existir
    await setDoc(docRef, newConfigs, { merge: true }); 
    };

    const handleApplyDefaultFeeToAll = async (defaultValue, overrideAll) => {
        const batch = writeBatch(db);
        (alunos || []).forEach(aluno => {
            // A condição agora verifica a opção 'overrideAll'
            if (overrideAll || aluno.valorMensalidade === undefined || aluno.valorMensalidade === null || aluno.valorMensalidade === 0) {
                const docRef = doc(db, 'alunos', aluno.id);
                batch.update(docRef, { valorMensalidade: defaultValue });
            }
        });
        await batch.commit();
    };

    const handleSelectEventoFromVisaoGeral = (evento) => {
        setActiveView('eventos');
        setEventoParaAbrir(evento);
    };

  const handleAddOrUpdateAluno = async (alunoData, editingId) => {
      const dataToSave = {
        nome: alunoData.nome,
        dataNascimento: alunoData.dataNascimento,
        status: alunoData.status,
        responsaveis: [{ id: Date.now(), nome: alunoData.responsavel }],
        contatos: [{ id: Date.now() + 1, tipo: 'Celular', valor: alunoData.contato }],
        endereco: alunoData.endereco || '',
        problemasMedicos: alunoData.problemasMedicos || '',
      };

      if (editingId) {
          const docRef = doc(db, 'alunos', editingId);
          await updateDoc(docRef, {
            ...dataToSave,
            turmaIds: alunoData.turmaId ? [alunoData.turmaId] : [], // Update turma if provided
          });
      } else {
          const newAluno = {
              ...dataToSave,
              turmaIds: alunoData.turmaId ? [alunoData.turmaId] : [],
              foto: null, peso: '', altura: '', dataAcordoPagamento: 'Todo dia 10', dataFimPlano: '',
              documentos: [], pagamentos: [], avaliacoes: [], dataAdicao: new Date().toISOString().split('T')[0],
              rg: '', cpf: '', eventosParticipados: 0,
          };
          await addDoc(collection(db, 'alunos'), newAluno);
      }
  };

  const handleUpdateUserStatus = async (uid, status) => {
        const userDocRef = doc(db, "users", uid);
        if (status === 'rejected') {
            // Se rejeitado, podemos deletar o documento do usuário para limpar
            await deleteDoc(userDocRef);
        } else {
            // Se aprovado, atualizamos o status
            await updateDoc(userDocRef, { status: status });
        }
    };

    const handleUpdateUserRole = async (uid, newRole) => {
        const userDocRef = doc(db, "users", uid);
        try {
            await updateDoc(userDocRef, { role: newRole });
        } catch (error) {
            console.error("Erro ao atualizar o cargo do usuário:", error);
        }
    };

  const handleDeleteAluno = async (alunoId) => {
      await deleteDoc(doc(db, 'alunos', alunoId));
  };

  const handleDeleteAlunos = (alunoIds) => {
        if (!alunoIds || alunoIds.length === 0) return;

        const executeDelete = async () => {
            const batch = writeBatch(db);
            alunoIds.forEach(id => {
                const docRef = doc(db, 'alunos', id);
                batch.delete(docRef);
            });
            await batch.commit();
        };

        const message = alunoIds.length === 1 
            ? "Tem a certeza de que quer excluir este aluno?" 
            : `Tem a certeza de que quer excluir os ${alunoIds.length} alunos selecionados?`;

        confirmAction(message, executeDelete);
    };
  
  const handleUpdateAluno = async (updatedAluno) => {
      const { id, ...alunoData } = updatedAluno;
      if (!id) {
        console.error("Attempted to update an aluno without an ID.");
        return;
      }
      const docRef = doc(db, 'alunos', id);
      await updateDoc(docRef, alunoData);
  }

  const handleAddOrUpdateTurma = async (turmaData, editingId) => {
    const dataToSave = {
        nome: turmaData.nome,
        horario: turmaData.horario,
        professores: [{id: 1, nome: turmaData.professor}],
    };
    if (editingId) {
        const docRef = doc(db, 'turmas', editingId);
        await updateDoc(docRef, dataToSave);
    } else {
        const newTurma = {
            ...dataToSave,
            diasDaSemana: [2, 4], 
            planejamento: {},
            presenca: {}
        };
        await addDoc(collection(db, 'turmas'), newTurma);
    }
  };
  
  const handleUpdateTurma = async (updatedTurma) => {
      const { id, ...turmaData } = updatedTurma;
      if (!id) {
        console.error("Attempted to update a turma without an ID.");
        return;
      }
      const docRef = doc(db, 'turmas', id);
      await updateDoc(docRef, turmaData);
  }

  const handleDeleteTurma = async (turmaId) => {
      await deleteDoc(doc(db, 'turmas', turmaId));
      // You might want to remove this turmaId from all alunos in a batch write
  };
  
  const handleAddDespesa = async (despesaData) => {
        try {
            // Adiciona a nova despesa à coleção 'transacoes'
            await addDoc(collection(db, 'transacoes'), despesaData);
        } catch (error) {
            console.error("Erro ao adicionar despesa:", error);
        }
    };

  const handleRemoveTransacao = async (transacaoId) => {
        // Esta função agora SÓ deleta. A confirmação será feita no modal.
        await deleteDoc(doc(db, 'transacoes', transacaoId));
    };

  const handleAddReceita = async (receitaData) => {
        try {
            await addDoc(collection(db, 'transacoes'), receitaData);
        } catch (error) {
            console.error("Erro ao adicionar receita:", error);
        }
    };
  const handleAddMeta = async (text, status) => {
        await addDoc(collection(db, 'metas'), { text, status: status || 'a_fazer' });
    };

    const handleUpdateMetaStatus = async (metaId, newStatus) => {
        const docRef = doc(db, 'metas', metaId);
        await updateDoc(docRef, { status: newStatus });
    };
  

  const handleDeleteMeta = async (metaId) => {
      await deleteDoc(doc(db, 'metas', metaId));
  };
  
  
  const handleAddOrUpdateEvento = async (eventoData, editingId) => {
    try {
        // 1. Cria uma cópia limpa dos dados, garantindo que 'partidas' seja um array
        const dataToSave = {
            title: eventoData.title || '',
            local: eventoData.local || '',
            description: eventoData.description || '',
            categoriaId: eventoData.categoriaId || '',
            escalacao: eventoData.escalacao || [],
            taxaInscricao: Number(eventoData.taxaInscricao) || 0,
            avaliacoesPosEvento: eventoData.avaliacoesPosEvento || [],
            partidas: eventoData.partidas || [], // Garante que o campo exista
            realizado: eventoData.realizado || false,
        };

        // 2. Decide se vai atualizar um existente ou criar um novo
        if (editingId) {
            const docRef = doc(db, 'eventos', editingId);
            await updateDoc(docRef, dataToSave);
        } else {
            await addDoc(collection(db, 'eventos'), dataToSave);
        }
    } catch (error) {
        // Este console.log nos ajudará a ver qualquer erro que o Firebase retorne
        console.error("Erro ao salvar o evento:", error);
        alert("Ocorreu um erro ao salvar o evento. Verifique o console para mais detalhes.");
    }
};
  
  const handleDeleteEvento = (eventoId, eventoTitle) => {
    const executeDelete = async () => {
        await deleteDoc(doc(db, 'eventos', eventoId));
    };
    confirmAction(`Tem certeza que deseja remover o evento "${eventoTitle}"?`, executeDelete);
};
  
  const handleToggleRealizado = async (evento) => {
      const docRef = doc(db, 'eventos', evento.id);
      await updateDoc(docRef, { realizado: !evento.realizado });
  };

  const handleAddCategoria = async (nome) => {
      await addDoc(collection(db, 'categorias'), { nome });
  };

  const handleDeleteCategoria = async (categoriaId) => {
      await deleteDoc(doc(db, 'categorias', categoriaId));
  };

  const handleBulkUpdate = async (updates, creations, replacements) => {
        const batch = writeBatch(db);
        
        // Processa as ATUALIZAÇÕES (alunos encontrados)
        (updates || []).forEach(update => {
            const docRef = doc(db, 'alunos', update.id);
            batch.update(docRef, update.updates);
        });

        // Processa as CRIAÇÕES (novos alunos)
        (creations || []).forEach(newAluno => {
            const docRef = doc(collection(db, 'alunos'));
            batch.set(docRef, newAluno);
        });

        // Processa as SUBSTITUIÇÕES (erros de digitação)
        (replacements || []).forEach(rep => {
            const docRef = doc(db, 'alunos', rep.targetId);
            // Ao substituir, também atualizamos o nome para o que veio do CSV
            const finalUpdates = { ...rep.updates, nome: rep.updates.nome }; 
            batch.update(docRef, finalUpdates);
        });
        
        await batch.commit();
    };
  
  // Confirmation and other UI logic remains largely the same
  const confirmAction = (message, onConfirm) => {
      setConfirmation({ isOpen: true, message, onConfirm });
  };
  const handleSelectAluno = (aluno) => { setSelectedAluno(aluno); setActiveView('alunos'); };
  const handleDeselectAluno = () => { setSelectedAluno(null); };
  const handleSelectTurma = (turma) => { setSelectedTurma(turma); setActiveView('turmas'); };
  const handleDeselectTurma = () => { setSelectedTurma(null); };

 if (authLoading || firestoreLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <Loader size={48} className="animate-spin text-blue-600" />
        </div>
    );
}

if (!currentUser) {
    if (authScreen === 'login') {
        return <LoginScreen setAuthScreen={setAuthScreen} />;
    } else {
        return <RegisterScreen setAuthScreen={setAuthScreen} />;
    }
}

if (firestoreUser && firestoreUser.status === 'pending') {
    return <PendingScreen handleLogout={handleLogout} />;
}

// Se chegou aqui, o usuário está logado e aprovado

if (!currentUser) {
    return <LoginScreen />;
}

  const renderView = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><Loader size={48} className="animate-spin text-blue-600"/></div>;
        }
        if (activeView === 'alunos' && selectedAluno) {
             const currentAlunoData = alunos.find(a => a.id === selectedAluno.id);
             if (!currentAlunoData) { handleDeselectAluno(); return <GestaoAlunos userPermissions={userPermissions} alunos={alunos} turmas={turmas} onSelectAluno={handleSelectAluno} onDeleteAluno={handleDeleteAluno} onAddOrUpdateAluno={handleAddOrUpdateAluno}/>; }
             return <DetalheAluno userPermissions={userPermissions} aluno={currentAlunoData} onUpdateAluno={handleUpdateAluno} onBack={handleDeselectAluno} turmas={turmas} confirmAction={confirmAction} />;
        }
        if (activeView === 'turmas' && selectedTurma) {
            const currentTurmaData = turmas.find(t => t.id === selectedTurma.id);
            if (!currentTurmaData) { handleDeselectTurma(); return <GestaoTurmas userPermissions={userPermissions} turmas={turmas} alunos={alunos} onSelectTurma={handleSelectTurma} onAddOrUpdateTurma={handleAddOrUpdateTurma} onDeleteTurma={handleDeleteTurma}/>; }
            return <DetalheTurma userPermissions={userPermissions} turma={currentTurmaData} onUpdateTurma={handleUpdateTurma} onBack={handleDeselectTurma} alunosNaTurma={alunos.filter(a => (a.turmaIds || []).includes(selectedTurma.id))} todosAlunos={alunos} onUpdateAluno={handleUpdateAluno} onRemoveAlunoDaTurma={(alunoId) => { const aluno = alunos.find(a => a.id === alunoId); if(aluno) { const novasTurmas = (aluno.turmaIds || []).filter(id => id !== currentTurmaData.id); handleUpdateAluno({ ...aluno, turmaIds: novasTurmas }); } }} onSelectAluno={handleSelectAluno} confirmAction={confirmAction} />;
        }

        switch (activeView) {
            case 'visaoGeral': 
                return <VisaoGeral 
                    userPermissions={userPermissions} 
                    alunos={alunos} 
                    eventos={eventos} 
                    onSelectAluno={handleSelectAlunoFromVisaoGeral} 
                    onSelectEvento={handleSelectEventoFromVisaoGeral} 
                    categorias={categorias} 
                    turmas={turmas} 
                />;
             case 'alunos': return <GestaoAlunos userPermissions={userPermissions} alunos={alunos} turmas={turmas} onSelectAluno={handleSelectAluno} onDeleteAlunos={handleDeleteAlunos} onAddOrUpdateAluno={handleAddOrUpdateAluno} onOpenBulkUpdate={() => {setIsBulkUpdateModalOpen(true)}}/>;
            case 'turmas': 
                return <GestaoTurmas userPermissions={userPermissions} turmas={turmas} alunos={alunos} onSelectTurma={handleSelectTurma} onAddOrUpdateTurma={handleAddOrUpdateTurma} onDeleteTurma={handleDeleteTurma}/>;
            case 'financeiro': 
                return <GestaoFinanceira 
                    userPermissions={userPermissions} 
                    transacoes={transacoes} // Usa a variável correta
                    alunos={alunos} 
                    onAddDespesa={handleAddDespesa} 
                    onAddReceita={handleAddReceita} 
                    onRemoveTransacao={handleRemoveTransacao} 
                    onSelectAluno={handleSelectAlunoFromVisaoGeral} 
                    confirmAction={confirmAction} 
                />;
            case 'eventos':
            return <GestaoEventos userPermissions={userPermissions} eventos={eventos} categorias={categorias} onAddOrUpdateEvento={handleAddOrUpdateEvento} onDeleteEvento={handleDeleteEvento} onAddCategoria={handleAddCategoria} onDeleteCategoria={handleDeleteCategoria} todosAlunos={alunos} onUpdateAluno={handleUpdateAluno} onToggleRealizado={handleToggleRealizado} confirmAction={confirmAction} triggerUndo={triggerUndo} eventoParaAbrir={eventoParaAbrir} clearEventoParaAbrir={() => setEventoParaAbrir(null)} />;
            case 'metas': return <GestaoMetas userPermissions={userPermissions} metas={metas} onAddMeta={handleAddMeta} onUpdateMetaStatus={handleUpdateMetaStatus} onDeleteMeta={handleDeleteMeta} />;
            case 'comunicacao': 
                return <Comunicacao userPermissions={userPermissions} />;
            default: 
                return <VisaoGeral 
                    userPermissions={userPermissions} 
                    alunos={alunos} 
                    eventos={eventos} 
                    onSelectAluno={handleSelectAlunoFromVisaoGeral} 
                    onSelectEvento={handleSelectEventoFromVisaoGeral} 
                    categorias={categorias} 
                    turmas={turmas}
                />;
        }
    };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} resetSelection={() => {setSelectedAluno(null); setSelectedTurma(null);}} onOpenSettings={() => setIsSettingsModalOpen(true)} userPermissions={userPermissions} />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {renderView()}
      </main>
      {confirmation.isOpen && (
          <ConfirmationModal 
              message={confirmation.message} 
              onConfirm={() => {
                  confirmation.onConfirm();
                  setConfirmation({ isOpen: false, message: '', onConfirm: null });
              }}
              onCancel={() => setConfirmation({ isOpen: false, message: '', onConfirm: null })}
          />
      )}
      {isUpdateModalOpen && <UpdateNotesModal notes={UPDATE_NOTES} onClose={() => {
    setIsUpdateModalOpen(false);
    localStorage.setItem('gestorFC_lastSeenVersion', APP_VERSION);
}} />}

    {isSettingsModalOpen && <SettingsModal user={firestoreUser} allUsers={allUsers} onUpdateUserStatus={handleUpdateUserStatus} onUpdateUserRole={handleUpdateUserRole} onClose={() => setIsSettingsModalOpen(false)} isAdmin={firestoreUser?.role === 'admin'} onLogout={handleLogout} currentUser={currentUser} confirmAction={confirmAction} configs={configuracoes} onUpdateConfigs={handleUpdateConfigs} onApplyDefaultFee={handleApplyDefaultFeeToAll} />}

    {isBulkUpdateModalOpen && <AtualizacaoEmMassa alunos={alunos} onBulkUpdate={handleBulkUpdate} onClose={() => setIsBulkUpdateModalOpen(false)} />}
    </div>
  );
}

// --- Componentes da Tela de Configurações ---

const ProfileSettings = ({ user }) => {
    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Meu Perfil</h3>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="font-semibold text-xl">{user.name}</p>
                
                {/* CARGO ADICIONADO AQUI */}
                <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Cargo não definido'}
                </span>

                <p className="text-gray-600 mt-2">{user.email}</p>
                <p className="mt-4 text-sm text-gray-500">(Tela de edição de perfil, foto e senha em breve...)</p>
            </div>
        </div>
    );
};

const FinancialSettings = ({ onApplyToAll, confirmAction }) => {
    const [valorEmMassa, setValorEmMassa] = useState('');
    const [overrideAll, setOverrideAll] = useState(false);

    const handleApplyClick = () => {
        if (!valorEmMassa || Number(valorEmMassa) <= 0) {
            alert("Por favor, insira um valor de mensalidade válido.");
            return;
        }
        confirmAction(
            `Tem a certeza de que quer aplicar o valor de R$ ${Number(valorEmMassa).toFixed(2)} a todos os alunos ${overrideAll ? '(incluindo os com valores personalizados)' : 'que não têm um valor personalizado'}? Esta ação não pode ser desfeita.`,
            () => onApplyToAll(Number(valorEmMassa), overrideAll)
        );
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Financeiro - Ações em Massa</h3>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                    <label htmlFor="bulk-fee" className="block text-sm font-medium text-gray-700">Definir valor da mensalidade para os alunos</label>
                    <input 
                        type="number" 
                        id="bulk-fee"
                        value={valorEmMassa}
                        onChange={(e) => setValorEmMassa(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        placeholder="150.00"
                    />
                </div>
                <div className="mt-2 flex items-center">
                    <input
                        id="override-all-checkbox"
                        type="checkbox"
                        checked={overrideAll}
                        onChange={(e) => setOverrideAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="override-all-checkbox" className="ml-2 block text-sm text-gray-700">
                        Sobrescrever valores personalizados existentes
                    </label>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleApplyClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Aplicar a Alunos</button>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ user, allUsers, onUpdateUserStatus, onUpdateUserRole, onClose, isAdmin, onLogout, currentUser, confirmAction, configs, onUpdateConfigs, onApplyDefaultFee }) => {
    const [activeTab, setActiveTab] = useState(isAdmin ? 'acesso' : 'perfil');

    const renderContent = () => {
        switch (activeTab) {
            case 'perfil':
                return <ProfileSettings user={user} />;
            case 'acesso':
                return <GestaoUsuarios allUsers={allUsers} onUpdateUserStatus={onUpdateUserStatus} onUpdateUserRole={onUpdateUserRole} currentUser={currentUser} confirmAction={confirmAction} />;
            case 'financeiro':
                return <FinancialSettings configs={configs} onUpdate={onUpdateConfigs} onApplyToAll={onApplyDefaultFee} confirmAction={confirmAction} />;
            default:
                return <ProfileSettings user={user} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"> <h2 className="text-2xl font-bold text-gray-800">Configurações</h2> <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button> </div>
                <div className="flex flex-grow overflow-hidden">
                    <nav className="w-1/4 bg-gray-50 p-4 border-r flex flex-col justify-between">
                        <ul>
                            <li className="mb-2"> <button onClick={() => setActiveTab('perfil')} className={`w-full text-left px-3 py-2 rounded-md font-semibold ${activeTab === 'perfil' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}> Meu Perfil </button> </li>
                            {isAdmin && (<>
                                <li className="mb-2"> <button onClick={() => setActiveTab('acesso')} className={`w-full text-left px-3 py-2 rounded-md font-semibold ${activeTab === 'acesso' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}> Gestão de Acesso </button> </li>
                                <li className="mb-2"> <button onClick={() => setActiveTab('financeiro')} className={`w-full text-left px-3 py-2 rounded-md font-semibold ${activeTab === 'financeiro' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}> Financeiro </button> </li>
                            </>)}
                        </ul>
                        <div> <button onClick={onLogout} className="w-full flex items-center text-left px-3 py-2 rounded-md font-semibold text-red-600 hover:bg-red-50"> <LogOut size={18} className="mr-2" /> Sair </button> </div>
                    </nav>
                    <main className="w-3/4 p-6 overflow-y-auto"> {renderContent()} </main>
                </div>
            </div>
        </div>
    );
};