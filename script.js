import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// Configuração do Firebase com seus dados reais
const firebaseConfig = {
  apiKey: "AIzaSyBnKmIAnR80BzMv9oVeKWgF_ZQVZbdAfew",
  authDomain: "crm23-7beb7.firebaseapp.com",
  databaseURL: "https://crm23-7beb7-default-rtdb.firebaseio.com",
  projectId: "crm23-7beb7",
  storageBucket: "crm23-7beb7.appspot.com",
  messagingSenderId: "219795920284",
  appId: "1:219795920284:web:9817ab18b0f098e8f4e459",
  measurementId: "G-ZLELD4MVLF"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Referência para o nó 'clientes' no Firebase
const clientesRef = ref(db, 'clientes');

// Elementos DOM
const addClienteBtn = document.getElementById('addClienteBtn');
const modal = document.getElementById('modalCliente');
const cancelarBtn = document.getElementById('cancelarBtn');
const salvarBtn = document.getElementById('salvarClienteBtn');
const listaClientes = document.getElementById('listaClientes');
const totalValorEl = document.getElementById('totalValor');
const filtroStatus = document.getElementById('filtroStatus');
const filtroServico = document.getElementById('filtroServico');
const exportarBtn = document.getElementById('exportarBtn');
const importarInput = document.getElementById('importarInput');

// Variáveis de estado
let clientes = [];
let editando = false;
let clienteIdAtual = null;

// Inicialização
carregarClientes();
setupEventListeners();

// Funções principais
function carregarClientes() {
  onValue(clientesRef, (snapshot) => {
    const data = snapshot.val();
    clientes = data ? Object.entries(data).map(([id, cliente]) => ({ id, ...cliente })) : [];
    atualizarLista();
  }, {
    onlyOnce: false // Para atualizações em tempo real
  });
}

function setupEventListeners() {
  addClienteBtn.addEventListener('click', abrirModalNovoCliente);
  cancelarBtn.addEventListener('click', fecharModal);
  salvarBtn.addEventListener('click', salvarCliente);
  filtroStatus.addEventListener('change', atualizarLista);
  filtroServico.addEventListener('change', atualizarLista);
  exportarBtn.addEventListener('click', exportarClientes);
  importarInput.addEventListener('change', importarClientes);
}

function atualizarLista() {
  listaClientes.innerHTML = '';
  let total = 0;
  const fs = filtroStatus.value;
  const ft = filtroServico.value;

  clientes.forEach(cliente => {
    if ((fs && cliente.status !== fs) || (ft && cliente.tipo !== ft)) return;
    
    total += cliente.valor || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${cliente.nome || ''}</td>
      <td class="p-2">${cliente.empresa || ''}</td>
      <td class="p-2">${cliente.contato || ''}</td>
      <td class="p-2">${cliente.tipo || ''}</td>
      <td class="p-2">R$ ${(cliente.valor || 0).toFixed(2)}</td>
      <td class="p-2">${cliente.prioridade || ''}</td>
      <td class="p-2">${cliente.status || ''}</td>
      <td class="p-2">${cliente.data || ''}</td>
      <td class="p-2 flex gap-1 flex-wrap">
        <button class="btn-edit px-2 py-1 bg-blue-500 text-white rounded" data-id="${cliente.id}">Editar</button>
        <a class="btn-whatsapp px-2 py-1 bg-green-500 text-white rounded" 
           href="https://wa.me/${(cliente.contato || '').replace(/\D/g, '')}" 
           target="_blank">Zap</a>
        <button class="btn-delete px-2 py-1 bg-red-500 text-white rounded" data-id="${cliente.id}">Excluir</button>
      </td>
    `;
    listaClientes.appendChild(tr);
  });

  // Adiciona eventos aos botões dinâmicos
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editarCliente(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => excluirCliente(btn.dataset.id));
  });

  totalValorEl.textContent = `R$ ${total.toFixed(2)}`;
}

// Funções do modal
function abrirModalNovoCliente() {
  limparFormulario();
  editando = false;
  clienteIdAtual = null;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function fecharModal() {
  modal.classList.add('hidden');
}

function salvarCliente() {
  const cliente = obterDadosFormulario();
  
  if (!cliente.nome || !cliente.contato) {
    alert("Nome e contato são obrigatórios!");
    return;
  }

  if (editando) {
    // Atualiza cliente existente
    update(ref(db, `clientes/${clienteIdAtual}`), cliente)
      .then(fecharModal)
      .catch(error => alert(`Erro ao atualizar: ${error.message}`));
  } else {
    // Adiciona novo cliente
    push(clientesRef, cliente)
      .then(fecharModal)
      .catch(error => alert(`Erro ao adicionar: ${error.message}`));
  }
}

// Funções auxiliares
function obterDadosFormulario() {
  return {
    nome: document.getElementById('nomeCliente').value,
    empresa: document.getElementById('empresaCliente').value,
    contato: document.getElementById('contatoCliente').value,
    valor: parseFloat(document.getElementById('valorCliente').value) || 0,
    tipo: document.getElementById('tipoServico').value,
    prioridade: document.getElementById('prioridadeCliente').value,
    status: document.getElementById('statusCliente').value,
    data: document.getElementById('dataCriacao').value,
    obs: document.getElementById('obsCliente').value
  };
}

function preencherFormulario(cliente) {
  document.getElementById('nomeCliente').value = cliente.nome || '';
  document.getElementById('empresaCliente').value = cliente.empresa || '';
  document.getElementById('contatoCliente').value = cliente.contato || '';
  document.getElementById('valorCliente').value = cliente.valor || '';
  document.getElementById('tipoServico').value = cliente.tipo || '';
  document.getElementById('prioridadeCliente').value = cliente.prioridade || 'baixa';
  document.getElementById('statusCliente').value = cliente.status || 'realizando';
  document.getElementById('dataCriacao').value = cliente.data || '';
  document.getElementById('obsCliente').value = cliente.obs || '';
}

function limparFormulario() {
  document.querySelectorAll('#modalCliente input, #modalCliente select, #modalCliente textarea').forEach(el => el.value = '');
}

// Funções de edição/exclusão
function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (cliente) {
    editando = true;
    clienteIdAtual = id;
    preencherFormulario(cliente);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function excluirCliente(id) {
  if (confirm('Tem certeza que deseja excluir este cliente?')) {
    remove(ref(db, `clientes/${id}`))
      .catch(error => alert(`Erro ao excluir: ${error.message}`));
  }
}

// Exportar/Importar
function exportarClientes() {
  const dataStr = JSON.stringify(clientes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes-wa-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarClientes(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const dados = JSON.parse(event.target.result);
      if (!Array.isArray(dados)) throw new Error('Formato inválido');

      if (confirm(`Importar ${dados.length} clientes?`)) {
        const batch = [];
        dados.forEach(cliente => {
          // Remove o ID existente para o Firebase gerar um novo
          const { id, ...clienteSemId } = cliente;
          batch.push(push(clientesRef, clienteSemId));
        });

        Promise.all(batch)
          .then(() => alert('Clientes importados com sucesso!'))
          .catch(err => alert(`Erro ao importar: ${err.message}`));
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
    e.target.value = ''; // Limpa o input
  };
  reader.readAsText(file);
}
