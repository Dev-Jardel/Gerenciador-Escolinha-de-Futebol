// --- Controle de Acesso Baseado em Cargos (RBAC) ---

// Define o que cada cargo pode fazer no sistema
export const PERMISSIONS = {
    admin: {
        view: ['visaoGeral', 'alunos', 'turmas', 'financeiro', 'eventos', 'aluguelQuadra', 'metas', 'comunicacao', 'gestaoUsuarios', 'aluguelQuadra'],
        canEdit: true, // PODE editar
        canDelete: true, // PODE deletar
        canViewFinancials: true, // PODE ver valores financeiros
    },
    gerente: {
        view: ['visaoGeral', 'alunos', 'turmas', 'financeiro', 'eventos', 'aluguelQuadra', 'metas', 'comunicacao', 'aluguelQuadra'],
        canEdit: true, // PODE editar
        canDelete: true, // PODE deletar
        canViewFinancials: true, // PODE ver valores financeiros
    },
    professor: {
        view: ['visaoGeral', 'alunos', 'turmas', 'eventos'],
        canEdit: true,  // PODE deletar
        canDelete: false, // NÃO PODE deletar
        canViewFinancials: false, // NÃO PODE ver valores financeiros
    },
    analista: {
        view: ['visaoGeral', 'alunos', 'turmas', 'eventos', 'financeiro'],
        canEdit: false,  // SÓ PODE VISUALIZAR
        canDelete: false,  // SÓ PODE VISUALIZAR
        canViewFinancials: true, // PODE ver valores financeiros (mas não editar)
    }
};

// Lista de cargos disponíveis para seleção
export const ROLES = ['admin', 'gerente', 'professor', 'analista'];
