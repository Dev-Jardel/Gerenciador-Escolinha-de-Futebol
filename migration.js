// --- SCRIPT DE MIGRAÇÃO DO FIREBASE ---
// Este script é temporário. Você o usa uma vez e pode apagá-lo depois.

// 1. Importações necessárias do Firebase
// NOTA: Talvez você precise instalar o 'firebase-admin' se o script
// não funcionar, mas vamos tentar com o SDK do cliente primeiro
// rode: npm install firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// 2. A SUA CONFIGURAÇÃO DO FIREBASE
// !! COPIE E COLE O SEU objeto `firebaseConfig` DO `App.jsx` AQUI !!
const firebaseConfig = {
  apiKey: "AIzaSyDcY1-29jWmbnpBDePgAmJfWhr79Nsl7Ug",
  authDomain: "gestor-futebol-app.firebaseapp.com",
  projectId: "gestor-futebol-app",
  storageBucket: "gestor-futebol-app.firebasestorage.app",
  messagingSenderId: "643691351263",
  appId: "1:643691351263:web:6ad71343afed3a0305ad6a",
  measurementId: "G-BZQ57SN00Q"
};

// !! CONFIRME SE O ID DA ESCOLA ESTÁ CORRETO !!
const ID_DA_ESCOLA = 'escola_ousacs';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/*
 * Esta função copia uma coleção inteira (ex: 'alunos') para
 * dentro de uma sub-coleção em 'escolas/{ID_DA_ESCOLA}/'
 */
async function migrateCollection(sourceCollectionName) {
  console.log(`Iniciando migração da coleção: "${sourceCollectionName}"...`);

  const sourceRef = collection(db, sourceCollectionName);
  const destRef = collection(db, 'escolas', ID_DA_ESCOLA, sourceCollectionName);

  try {
    const snapshot = await getDocs(sourceRef);
    if (snapshot.empty) {
      console.log(`Coleção "${sourceCollectionName}" está vazia. Nada a fazer.`);
      return;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach(documento => {
      // Re-utiliza o ID do documento original para manter a consistência
      const newDocRef = doc(destRef, documento.id);
      batch.set(newDocRef, documento.data());
      count++;
    });

    // Envia o lote para o Firebase
    await batch.commit();
    console.log(`SUCESSO: ${count} documentos migrados de "${sourceCollectionName}" para "escolas/${ID_DA_ESCOLA}/${sourceCollectionName}"`);

  } catch (error) {
    console.error(`ERRO ao migrar "${sourceCollectionName}":`, error);
  }
}

// Função principal que roda todas as migrações
async function runAllMigrations() {
  console.log(`Iniciando migração para a escola: ${ID_DA_ESCOLA}`);
  console.log("-----------------------------------------------");

  // Lista de todas as coleções que você precisa mover
  // (baseado na sua imagem)
  await migrateCollection('agendamentos');
  await migrateCollection('alunos');
  await migrateCollection('categorias');
  await migrateCollection('configuracoes');
  await migrateCollection('eventos');
  await migrateCollection('metas');
  await migrateCollection('schedules');
  await migrateCollection('turmas');
  

  console.log("-----------------------------------------------");
  console.log("--- MIGRAÇÃO CONCLUÍDA ---");
  console.log("Verifique seu banco de dados no Firebase!");
}

// Inicia o script
runAllMigrations();