import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// Firebase Config
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const clientesRef = ref(db, 'clientes');

// Elementos do DOM
const buscarCliente = document.getElementById('buscarCliente');
const addClienteBtn = document.getElementById('addClienteBtn');
const modal = document.getElementById('modalCliente');
const cancelarBtn = document.getElementById('cancelarBtn');
const salvarBtn = document.getElementById('salvarClienteBtn');
const listaClientes = document.getElementById('listaClientes');
const totalValorEl = document.getElementById('totalValor');
const filtroStatus = document.getElementById('filtroStatus');
const filtroServico = document.getElementById('filtroServico');
const filtroPrioridade = document.getElementById('filtroPrioridade');
const exportarBtn = document.getElementById('exportarBtn');
const importarInput = document.getElementById('importarInput');

// Estado
let clientes = [];
let editando = false;
let clienteIdAtual = null;

// Inicializa
carregarClientes();
setupEventListeners();

// Carrega dados do Firebase em tempo real
function carregarClientes() {
  onValue(clientesRef, (snapshot) => {
    const data = snapshot.val();
    clientes = data ? Object.entries(data).map(([id, cliente]) => ({ id, ...cliente })) : [];
    atualizarLista();
  });
}

// Eventos principais
function setupEventListeners() {
  addClienteBtn.addEventListener('click', abrirModalNovoCliente);
  cancelarBtn.addEventListener('click', fecharModal);
  salvarBtn.addEventListener('click', salvarCliente);
  filtroStatus.addEventListener('change', atualizarLista);
  filtroServico.addEventListener('change', atualizarLista);
  filtroPrioridade.addEventListener('change', atualizarLista);
  buscarCliente.addEventListener('input', atualizarLista);
  exportarBtn.addEventListener('click', exportarClientes);
  importarInput.addEventListener('change', importarClientes);
}

// Atualiza tabela com filtros
function atualizarLista() {
  listaClientes.innerHTML = '';
  let total = 0;

  const fs = filtroStatus.value;
  const ft = filtroServico.value;
  const fp = filtroPrioridade.value;
  const textoBusca = buscarCliente.value.trim().toLowerCase();

  clientes.forEach(cliente => {
    if (
      (fs && cliente.status !== fs) ||
      (ft && cliente.tipo !== ft) ||
      (fp && cliente.prioridade !== fp) ||
      (textoBusca &&
        !cliente.nome.toLowerCase().includes(textoBusca) &&
        !cliente.empresa.toLowerCase().includes(textoBusca))
    ) return;

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

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editarCliente(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => excluirCliente(btn.dataset.id));
  });

  totalValorEl.textContent = `R$ ${total.toFixed(2)}`;
}

// Modal
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

// Salvar ou atualizar
function salvarCliente() {
  const cliente = obterDadosFormulario();
  if (!cliente.nome || !cliente.contato) {
    alert("Nome e contato são obrigatórios!");
    return;
  }

  if (editando && clienteIdAtual) {
    update(ref(db, `clientes/${clienteIdAtual}`), cliente)
      .then(fecharModal)
      .catch(err => alert(`Erro ao atualizar: ${err.message}`));
  } else {
    push(clientesRef, cliente)
      .then(fecharModal)
      .catch(err => alert(`Erro ao adicionar: ${err.message}`));
  }
}

// Formulário
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
  document.getElementById('prioridadeCliente').value = cliente.prioridade || '';
  document.getElementById('statusCliente').value = cliente.status || '';
  document.getElementById('dataCriacao').value = cliente.data || '';
  document.getElementById('obsCliente').value = cliente.obs || '';
}

function limparFormulario() {
  document.querySelectorAll('#modalCliente input, #modalCliente select, #modalCliente textarea')
    .forEach(el => el.value = '');
}

// Editar / Excluir
function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (cliente) {
    preencherFormulario(cliente);
    editando = true;
    clienteIdAtual = id;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function excluirCliente(id) {
  if (confirm("Deseja excluir este cliente?")) {
    remove(ref(db, `clientes/${id}`))
      .catch(err => alert(`Erro ao excluir: ${err.message}`));
  }
}

// Exportar / Importar
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
        const promessas = dados.map(c => {
          const { id, ...novo } = c;
          return push(clientesRef, novo);
        });

        Promise.all(promessas)
          .then(() => alert('Importado com sucesso!'))
          .catch(err => alert(`Erro: ${err.message}`));
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
