import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// Firebase config
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
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
const filtroPrioridade = document.getElementById('filtroPrioridade');
const buscarCliente = document.getElementById('buscarCliente');
const exportarBtn = document.getElementById('exportarBtn');
const importarInput = document.getElementById('importarInput');

// Dashboard
const totalRealizandoEl = document.getElementById('totalRealizando');
const totalEntregueEl = document.getElementById('totalEntregue');
const totalClientesEl = document.getElementById('totalClientes');

// Estado
let clientes = [];
let editando = false;
let clienteIdAtual = null;

// Inicialização
carregarClientes();
setupEventListeners();

function carregarClientes() {
  onValue(clientesRef, (snapshot) => {
    const data = snapshot.val();
    clientes = data ? Object.entries(data).map(([id, cliente]) => ({ id, ...cliente })) : [];
    atualizarLista();
  });
}

function setupEventListeners() {
  addClienteBtn.onclick = abrirModalNovoCliente;
  cancelarBtn.onclick = fecharModal;
  salvarBtn.onclick = salvarCliente;
  filtroStatus.onchange = atualizarLista;
  filtroServico.onchange = atualizarLista;
  filtroPrioridade.onchange = atualizarLista;
  buscarCliente.oninput = atualizarLista;
  exportarBtn.onclick = exportarClientes;
  importarInput.onchange = importarClientes;
}

function atualizarLista() {
  listaClientes.innerHTML = '';
  let totalValor = 0;
  let totalRealizando = 0;
  let totalEntregue = 0;
  let totalExibido = 0;

  const fs = filtroStatus.value;
  const ft = filtroServico.value;
  const fp = filtroPrioridade.value;
  const busca = buscarCliente.value.toLowerCase().trim();

  clientes.forEach(cliente => {
    if (
      (fs && cliente.status !== fs) ||
      (ft && cliente.tipo !== ft) ||
      (fp && cliente.prioridade !== fp) ||
      (busca &&
        !cliente.nome.toLowerCase().includes(busca) &&
        !cliente.empresa.toLowerCase().includes(busca))
    ) return;

    totalValor += cliente.valor || 0;
    totalExibido++;

    if (cliente.status === 'realizando') totalRealizando++;
    if (cliente.status === 'entregue') totalEntregue++;

    const card = document.createElement('div');
    card.className = "bg-white shadow-lg rounded-xl p-4 flex flex-col gap-2 border-l-4 " +
      (cliente.prioridade === 'alta'
        ? 'border-red-500'
        : cliente.prioridade === 'média'
        ? 'border-yellow-400'
        : 'border-blue-400');

    card.innerHTML = `
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-blue-800">${cliente.nome || 'Sem nome'}</h3>
        <span class="text-sm text-gray-500">${cliente.data || ''}</span>
      </div>
      <p class="text-sm text-gray-600"><strong>Empresa:</strong> ${cliente.empresa || '-'}</p>
      <p class="text-sm"><strong>Contato:</strong> ${cliente.contato || '-'}</p>
      <p class="text-sm"><strong>Serviço:</strong> ${cliente.tipo || '-'} — <strong>R$</strong> ${(cliente.valor || 0).toFixed(2)}</p>
      <div class="flex gap-2 text-sm">
        <span class="px-2 py-1 rounded-full text-white text-xs ${cliente.status === 'entregue' ? 'bg-green-500' : 'bg-blue-500'}">${cliente.status}</span>
        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800 text-xs">${cliente.prioridade}</span>
      </div>
      <div class="flex gap-2 mt-3">
        <button class="btn-edit flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded" data-id="${cliente.id}">✏️ Editar</button>
        <a class="btn-whatsapp flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-center" href="https://wa.me/${(cliente.contato || '').replace(/\D/g, '')}" target="_blank">📱 WhatsApp</a>
        <button class="btn-delete flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded" data-id="${cliente.id}">🗑️ Excluir</button>
      </div>
    `;

    listaClientes.appendChild(card);
  });

  // Eventos dos botões
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editarCliente(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => excluirCliente(btn.dataset.id));
  });

  // Atualiza o dashboard
  totalValorEl.textContent = `R$ ${totalValor.toFixed(2)}`;
  totalRealizandoEl.textContent = totalRealizando;
  totalEntregueEl.textContent = totalEntregue;
  totalClientesEl.textContent = totalExibido;
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

// CRUD
function salvarCliente() {
  const cliente = obterDadosFormulario();
  if (!cliente.nome || !cliente.contato) {
    alert("Nome e contato são obrigatórios!");
    return;
  }

  if (editando) {
    update(ref(db, `clientes/${clienteIdAtual}`), cliente).then(fecharModal);
  } else {
    push(clientesRef, cliente).then(fecharModal);
  }
}

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
    remove(ref(db, `clientes/${id}`));
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
  document.getElementById('prioridadeCliente').value = cliente.prioridade || 'baixa';
  document.getElementById('statusCliente').value = cliente.status || 'realizando';
  document.getElementById('dataCriacao').value = cliente.data || '';
  document.getElementById('obsCliente').value = cliente.obs || '';
}
function limparFormulario() {
  document.querySelectorAll('#modalCliente input, #modalCliente select, #modalCliente textarea')
    .forEach(el => el.value = '');
}

// Exportar e Importar
function exportarClientes() {
  const blob = new Blob([JSON.stringify(clientes, null, 2)], { type: 'application/json' });
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
        dados.forEach(c => {
          const { id, ...semId } = c;
          push(clientesRef, semId);
        });
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
