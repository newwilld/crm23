// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// Configuração do Firebase
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

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

// Event Listeners
addClienteBtn.addEventListener('click', abrirModalNovoCliente);
cancelarBtn.addEventListener('click', fecharModal);
salvarBtn.addEventListener('click', salvarCliente);
filtroStatus.addEventListener('change', atualizarLista);
filtroServico.addEventListener('change', atualizarLista);
exportarBtn.addEventListener('click', exportarClientes);
importarInput.addEventListener('change', importarClientes);

// Carregar clientes do Firebase
carregarClientes();

// Funções
function carregarClientes() {
  const clientesRef = ref(db, 'clientes');
  onValue(clientesRef, (snapshot) => {
    const data = snapshot.val();
    clientes = data ? Object.entries(data).map(([id, cliente]) => ({ id, ...cliente })) : [];
    atualizarLista();
  });
}

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

  const clientesRef = ref(db, 'clientes');
  
  if (editando) {
    // Atualizar cliente existente
    const clienteRef = ref(db, `clientes/${clienteIdAtual}`);
    update(clienteRef, cliente)
      .then(() => {
        fecharModal();
      })
      .catch((error) => {
        alert("Erro ao atualizar cliente: " + error.message);
      });
  } else {
    // Adicionar novo cliente
    push(clientesRef, cliente)
      .then(() => {
        fecharModal();
      })
      .catch((error) => {
        alert("Erro ao adicionar cliente: " + error.message);
      });
  }
}

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
  document.querySelectorAll('#modalCliente input, #modalCliente select, #modalCliente textarea').forEach(e => e.value = '');
}

function atualizarLista() {
  listaClientes.innerHTML = '';
  let total = 0;
  const fs = filtroStatus.value;
  const ft = filtroServico.value;

  clientes.forEach((cliente) => {
    if ((fs && cliente.status !== fs) || (ft && cliente.tipo !== ft)) return;
    total += cliente.valor || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${cliente.nome}</td>
      <td class="p-2">${cliente.empresa}</td>
      <td class="p-2">${cliente.contato}</td>
      <td class="p-2">${cliente.tipo}</td>
      <td class="p-2">R$ ${(cliente.valor || 0).toFixed(2)}</td>
      <td class="p-2">${cliente.prioridade}</td>
      <td class="p-2">${cliente.status}</td>
      <td class="p-2">${cliente.data}</td>
      <td class="p-2 flex gap-1 flex-wrap">
        <button class="btn-edit action-btn" onclick="editarCliente('${cliente.id}')">Editar</button>
        <a class="btn-whatsapp action-btn" href="https://wa.me/${cliente.contato.replace(/\D/g, '')}" target="_blank">Zap</a>
        <button class="btn-delete action-btn" onclick="excluirCliente('${cliente.id}')">Excluir</button>
      </td>
    `;
    listaClientes.appendChild(tr);
  });

  totalValorEl.textContent = 'R$ ' + total.toFixed(2);
}

// Funções globais necessárias para os botões na tabela
window.editarCliente = function(id) {
  const cliente = clientes.find(c => c.id === id);
  if (cliente) {
    editando = true;
    clienteIdAtual = id;
    preencherFormulario(cliente);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

window.excluirCliente = function(id) {
  if (confirm("Tem certeza que deseja excluir este cliente?")) {
    const clienteRef = ref(db, `clientes/${id}`);
    remove(clienteRef)
      .catch((error) => {
        alert("Erro ao excluir cliente: " + error.message);
      });
  }
};

function exportarClientes() {
  const blob = new Blob([JSON.stringify(clientes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clientes-wa.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importarClientes(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const dadosImportados = JSON.parse(event.target.result);

      if (!Array.isArray(dadosImportados)) {
        alert("O arquivo não está no formato correto.");
        return;
      }

      if (confirm(`Deseja importar ${dadosImportados.length} clientes?`)) {
        const clientesRef = ref(db, 'clientes');
        
        // Limpar clientes existentes (opcional - comente se não quiser apagar os existentes)
        // remove(clientesRef).catch(error => console.error("Erro ao limpar clientes:", error));
        
        // Adicionar novos clientes
        dadosImportados.forEach(cliente => {
          push(clientesRef, cliente)
            .catch(error => console.error("Erro ao importar cliente:", error));
        });
        
        alert("Clientes importados com sucesso!");
        e.target.value = ''; // Limpar o input
      }
    } catch (err) {
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}