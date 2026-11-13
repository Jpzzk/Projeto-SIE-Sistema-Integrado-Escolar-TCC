// ==========================================
// CONFIGURAÇÕES
// ==========================================

const API_GOOGLE_BOOKS =
  'https://www.googleapis.com/books/v1/volumes';

const GOOGLE_BOOKS_API_KEY = 'AIzaSyBpIKNjIX9aVZCZWnBW75glc76uaKjPg5U';

const STORAGE_LIVROS = 'livros';
const STORAGE_EMPRESTIMOS = 'emprestimos';

const STORAGE_USUARIOS = 'usuarios';

let usuarioEditandoId = null;

// Controle da paginação do Google Books
let termoBuscaAtual = '';
let proximoIndice = 0;
let totalResultados = 0;
let carregandoLivros = false;
let resultadosBuscaAPI = [];


// ==========================================
// FUNÇÕES GERAIS
// ==========================================

function lerDados(chave) {
  try {
    const dados = JSON.parse(
      localStorage.getItem(chave) || '[]'
    );

    return Array.isArray(dados) ? dados : [];

  } catch {
    return [];
  }
}


function salvarLocal(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}


function gerarId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}


// ==========================================
// BIBLIOTECA PADRÃO
// ==========================================

function criarBibliotecaPadrao() {
  const livros = lerDados(STORAGE_LIVROS);

  if (livros.length) return;

  const iniciais = [
    ['Dom Casmurro', 'Machado de Assis', 'Romance'],
    ['Harry Potter', 'J. K. Rowling', 'Fantasia'],
    ['Percy Jackson', 'Rick Riordan', 'Fantasia'],
    ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Infantil'],
    ['1984', 'George Orwell', 'Ficção'],
    ['A Revolução dos Bichos', 'George Orwell', 'Ficção'],
    ['Naruto', 'Masashi Kishimoto', 'Mangá'],
    ['One Piece', 'Eiichiro Oda', 'Mangá'],
    ['Clean Code', 'Robert C. Martin', 'Programação'],
    ['HTML e CSS', 'Jon Duckett', 'Programação']
  ];

  const biblioteca = iniciais.map(
    ([nome, autor, categoria]) => ({
      id: gerarId(),
      nome,
      autor,
      categoria,
      disponivel: true,
      origem: 'manual'
    })
  );

  salvarLocal(STORAGE_LIVROS, biblioteca);
}


// ==========================================
// GOOGLE BOOKS API
// ==========================================

// Faz até três tentativas quando ocorre erro 503.

async function buscarComTentativas(url, tentativas = 3) {

  for (let i = 0; i < tentativas; i++) {

    const resposta = await fetch(url);

    if (resposta.ok) {
      return resposta;
    }

    if (
      resposta.status !== 503 ||
      i === tentativas - 1
    ) {
      return resposta;
    }

    await new Promise(resolve =>
      setTimeout(resolve, 1000 * (i + 1))
    );
  }
}


// Pesquisa livros na API.

async function buscarLivros(termo, carregarMais = false) {

  const mensagem = document.getElementById('mensagemBusca');
  const resultados = document.getElementById('resultadosLivros');
  const botao = document.getElementById('btnBuscar');
  const botaoMais = document.getElementById('btnCarregarMais');

  if (!termo.trim()) {
    mensagem.textContent = 'Digite o título, autor ou ISBN.';
    return;
  }

  if (carregandoLivros) return;

  // Nova pesquisa
  if (!carregarMais) {

    termoBuscaAtual = termo.trim();
    proximoIndice = 0;
    totalResultados = 0;
    resultadosBuscaAPI = [];

    resultados.replaceChildren();

  }

  carregandoLivros = true;

  mensagem.textContent = carregarMais
    ? 'Carregando mais livros...'
    : 'Pesquisando livros...';

  if (botao) botao.disabled = true;
  if (botaoMais) botaoMais.disabled = true;

  try {

    const parametros = new URLSearchParams({
      q: termoBuscaAtual,
      maxResults: '40',
      startIndex: String(proximoIndice),
      printType: 'books'
    });

    if (GOOGLE_BOOKS_API_KEY && GOOGLE_BOOKS_API_KEY !== 'SUA_CHAVE_AQUI') {
      parametros.set('key', GOOGLE_BOOKS_API_KEY);
    }

    const url = `${API_GOOGLE_BOOKS}?${parametros}`;

    const resposta = await buscarComTentativas(url);

    if (!resposta.ok) {

      const erro = await resposta.json().catch(() => ({}));

      console.error(
        'Erro detalhado do Google Books:',
        erro
      );

      throw new Error(
        erro.error?.message ||
        'Erro ao consultar o Google Books.'
      );
    }

    const dados = await resposta.json();

    const livros = dados.items || [];

    totalResultados = Number(dados.totalItems) || 0;

    if (!livros.length && proximoIndice === 0) {

      mensagem.textContent = 'Nenhum livro encontrado.';

      if (botaoMais) botaoMais.hidden = true;

      return;
    }

    if (!livros.length) {

      mensagem.textContent = 'Não existem mais resultados.';

      if (botaoMais) botaoMais.hidden = true;

      return;
    }

    resultadosBuscaAPI.push(...livros);

    proximoIndice += livros.length;

    renderizarResultadosBusca();

    mensagem.textContent =
      `Exibindo ${resultadosBuscaAPI.length} de ${totalResultados} resultado(s).`;

    if (botaoMais) {

      botaoMais.hidden =
        proximoIndice >= totalResultados ||
        livros.length === 0;

    }

  } catch (erro) {

    console.error(erro);

    mensagem.textContent =
      erro.message === 'Failed to fetch'
        ? 'Erro de conexão. Verifique sua internet.'
        : erro.message;

  } finally {

    carregandoLivros = false;

    if (botao) botao.disabled = false;
    if (botaoMais) botaoMais.disabled = false;

  }
}


// ==========================================
// EXIBIR RESULTADOS DA PESQUISA
// ==========================================

function renderizarResultadosBusca() {

  const container = document.getElementById('resultadosLivros');

  container.replaceChildren();

  const acervo = lerDados(STORAGE_LIVROS);

  resultadosBuscaAPI.forEach(livro => {

    const info = livro.volumeInfo || {};

    const card = document.createElement('article');
    card.className = 'livro-card';

    // Capa
    const imagem = info.imageLinks?.thumbnail
      ?.replace(/^http:/, 'https:');

    if (imagem) {

      const capa = document.createElement('img');

      capa.src = imagem;
      capa.alt = `Capa de ${info.title || 'livro'}`;
      capa.loading = 'lazy';

      card.appendChild(capa);

    } else {

      const semCapa = document.createElement('div');

      semCapa.className = 'capa-indisponivel';
      semCapa.textContent = 'Sem capa disponível';

      card.appendChild(semCapa);

    }

    // Título
    const titulo = document.createElement('h3');

    titulo.textContent =
      info.title || 'Título desconhecido';

    card.appendChild(titulo);

    // Autor
    const autor = document.createElement('p');

    autor.textContent =
      `Autor: ${(info.authors || []).join(', ') || 'Desconhecido'}`;

    card.appendChild(autor);

    // Editora
    const editora = document.createElement('p');

    editora.textContent =
      `Editora: ${info.publisher || 'Não informada'}`;

    card.appendChild(editora);

    // Ano
    const ano = document.createElement('p');

    ano.textContent =
      `Publicação: ${info.publishedDate || 'Não informada'}`;

    card.appendChild(ano);

    // Verifica se já existe no acervo
    const jaExiste = acervo.some(
      item => item.googleId === livro.id
    );

    // Botão
    const adicionar = document.createElement('button');

    adicionar.type = 'button';

    adicionar.textContent = jaExiste
      ? 'Já está no acervo'
      : 'Adicionar ao acervo';

    adicionar.disabled = jaExiste;

    adicionar.addEventListener('click', () => {
      adicionarAoAcervo(livro);
    });

    card.appendChild(adicionar);

    container.appendChild(card);

  });

}


// ==========================================
// ADICIONAR LIVRO AO ACERVO
// ==========================================

function adicionarAoAcervo(resultado) {

  const info = resultado.volumeInfo || {};

  const livros = lerDados(STORAGE_LIVROS);

  if (
    livros.some(livro => livro.googleId === resultado.id)
  ) {

    alert('Esse livro já está no acervo.');

    return;
  }

  livros.push({

    id: gerarId(),

    googleId: resultado.id,

    nome: info.title || 'Título desconhecido',

    autor: (info.authors || []).join(', ') ||
      'Autor desconhecido',

    categoria: (info.categories || []).join(', ') ||
      'Não informada',

    editora: info.publisher || '',

    ano: info.publishedDate || '',

    capa: info.imageLinks?.thumbnail
      ?.replace(/^http:/, 'https:') || '',

    disponivel: true,

    origem: 'google-books'

  });

  salvarLocal(STORAGE_LIVROS, livros);

  atualizarInterface();

  renderizarResultadosBusca();

  document.getElementById('mensagemBusca').textContent =
    'Livro adicionado ao acervo com sucesso!';

}


// ==========================================
// CARREGAR MAIS LIVROS
// ==========================================

function carregarMaisLivros() {

  if (!termoBuscaAtual || carregandoLivros) return;

  buscarLivros(termoBuscaAtual, true);

}


// ==========================================
// CADASTRO MANUAL
// ==========================================

function cadastrarLivro() {

  const nome = document
    .getElementById('nomeLivro')
    .value.trim();

  const autor = document
    .getElementById('autorLivro')
    .value.trim();

  const categoria = document
    .getElementById('categoriaLivro')
    .value.trim();

  if (!nome || !autor || !categoria) {

    alert('Preencha todos os campos do livro.');

    return;
  }

  const livros = lerDados(STORAGE_LIVROS);

  livros.push({

    id: gerarId(),

    nome,

    autor,

    categoria,

    disponivel: true,

    origem: 'manual'

  });

  salvarLocal(STORAGE_LIVROS, livros);

  document.getElementById('nomeLivro').value = '';
  document.getElementById('autorLivro').value = '';
  document.getElementById('categoriaLivro').value = '';

  atualizarInterface();

  alert('Livro cadastrado com sucesso!');

}


// ==========================================
// SELETOR DE LIVROS PARA EMPRÉSTIMOS
// ==========================================

function carregarLivros() {

  const select = document.getElementById('livro');

  if (!select) return;

  const selecionado = select.value;

  select.replaceChildren();

  const inicial = document.createElement('option');

  inicial.value = '';
  inicial.textContent = 'Selecione um livro disponível';

  select.appendChild(inicial);

  lerDados(STORAGE_LIVROS)

    .filter(livro => livro.disponivel)

    .forEach(livro => {

      const option = document.createElement('option');

      option.value = livro.id;

      option.textContent =
        `${livro.nome} - ${livro.autor}`;

      select.appendChild(option);

    });

  if (
    [...select.options].some(
      option => option.value === selecionado
    )
  ) {

    select.value = selecionado;

  }

}


// ==========================================
// MOSTRAR ACERVO
// ==========================================

function mostrarAcervo() {

  const container = document.getElementById('acervoLivros');

  if (!container) return;

  container.replaceChildren();

  let livros = lerDados(STORAGE_LIVROS);

  // Pesquisa no acervo
  const pesquisa = (
    document.getElementById('pesquisarAcervo')?.value || ''
  ).toLocaleLowerCase('pt-BR');

  // Filtro de disponibilidade
  const filtro = (
    document.getElementById('filtroDisponibilidade')?.value ||
    'todos'
  );

  // Filtra título, autor, categoria e editora
  if (pesquisa) {

    livros = livros.filter(livro => {

      const texto = [
        livro.nome,
        livro.autor,
        livro.categoria,
        livro.editora
      ].join(' ').toLocaleLowerCase('pt-BR');

      return texto.includes(pesquisa);

    });

  }

  // Filtra disponibilidade
  if (filtro === 'disponivel') {

    livros = livros.filter(livro => livro.disponivel);

  } else if (filtro === 'emprestado') {

    livros = livros.filter(livro => !livro.disponivel);

  }

  if (!livros.length) {

    container.textContent =
      'Nenhum livro encontrado com esses filtros.';

    return;
  }

  livros.forEach(livro => {

    const card = document.createElement('article');

    card.className = 'livro-card';

    // Capa
    if (livro.capa) {

      const img = document.createElement('img');

      img.src = livro.capa;
      img.alt = `Capa de ${livro.nome}`;
      img.loading = 'lazy';

      card.appendChild(img);

    } else {

      const semCapa = document.createElement('div');

      semCapa.className = 'capa-indisponivel';
      semCapa.textContent = 'Sem capa disponível';

      card.appendChild(semCapa);

    }

    // Título
    const titulo = document.createElement('h3');

    titulo.textContent = livro.nome;

    card.appendChild(titulo);

    // Autor
    const autor = document.createElement('p');

    autor.textContent = `Autor: ${livro.autor}`;

    card.appendChild(autor);

    // Categoria
    const categoria = document.createElement('p');

    categoria.textContent =
      `Categoria: ${livro.categoria || 'Não informada'}`;

    card.appendChild(categoria);

    // Editora
    if (livro.editora) {

      const editora = document.createElement('p');

      editora.textContent = `Editora: ${livro.editora}`;

      card.appendChild(editora);

    }

    // Ano
    if (livro.ano) {

      const ano = document.createElement('p');

      ano.textContent = `Publicação: ${livro.ano}`;

      card.appendChild(ano);

    }

    // Status
    const status = document.createElement('p');

    status.className = livro.disponivel
      ? 'status-disponivel'
      : 'status-emprestado';

    status.textContent = livro.disponivel
      ? 'Disponível'
      : 'Emprestado';

    card.appendChild(status);

    container.appendChild(card);

  });

}


/* ==========================================
   GERENCIAMENTO DE USUÁRIOS
========================================== */

// Cadastrar ou atualizar usuário

function salvarUsuario(event) {
  event.preventDefault();

  const nome = document.getElementById('nomeUsuario').value.trim();
  const telefone = document.getElementById('telefoneUsuario').value.trim();
  const tipo = document.getElementById('tipoUsuario').value;
  const turma = document.getElementById('turmaUsuario').value.trim();

  if (!nome || !telefone || !tipo) {
    alert('Preencha os campos obrigatórios.');
    return;
  }

  const usuarios = lerDados(STORAGE_USUARIOS);

  if (usuarioEditandoId) {
    const usuario = usuarios.find(
      item => item.id === usuarioEditandoId
    );

    if (!usuario) return;

    usuario.nome = nome;
    usuario.telefone = telefone;
    usuario.tipo = tipo;
    usuario.turma = turma;

    salvarLocal(STORAGE_USUARIOS, usuarios);

    alert('Usuário atualizado com sucesso!');
  } else {
    usuarios.push({
      id: gerarId(),
      nome,
      telefone,
      tipo,
      turma
    });

    salvarLocal(STORAGE_USUARIOS, usuarios);

    alert('Usuário cadastrado com sucesso!');
  }

  cancelarEdicaoUsuario();
  atualizarInterface();
}


// Mostrar usuários cadastrados

function mostrarUsuarios() {
  const lista = document.getElementById('listaUsuarios');

  if (!lista) return;

  lista.replaceChildren();

  const pesquisa = (
    document.getElementById('pesquisaUsuarios')?.value || ''
  ).toLocaleLowerCase('pt-BR');

  const usuarios = lerDados(STORAGE_USUARIOS).filter(usuario => {
    const texto = [
      usuario.nome,
      usuario.telefone,
      usuario.tipo,
      usuario.turma
    ].join(' ').toLocaleLowerCase('pt-BR');

    return texto.includes(pesquisa);
  });

  if (!usuarios.length) {
    const linha = document.createElement('tr');
    const celula = document.createElement('td');

    celula.colSpan = 5;
    celula.textContent = 'Nenhum usuário encontrado.';

    linha.appendChild(celula);
    lista.appendChild(linha);

    return;
  }

  usuarios.forEach(usuario => {
    const linha = document.createElement('tr');

    [
      usuario.nome,
      usuario.telefone,
      usuario.tipo,
      usuario.turma || '-'
    ].forEach(valor => {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    });

    const acoes = document.createElement('td');

    const editar = document.createElement('button');
    editar.type = 'button';
    editar.textContent = 'Editar';
    editar.className = 'return-btn';

    editar.addEventListener('click', () => {
      editarUsuario(usuario.id);
    });

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.textContent = 'Excluir';
    excluir.className = 'delete-btn';

    excluir.addEventListener('click', () => {
      excluirUsuario(usuario.id);
    });

    acoes.appendChild(editar);
    acoes.appendChild(excluir);

    linha.appendChild(acoes);
    lista.appendChild(linha);
  });
}


// Editar usuário

function editarUsuario(id) {
  const usuarios = lerDados(STORAGE_USUARIOS);

  const usuario = usuarios.find(item => item.id === id);

  if (!usuario) return;

  usuarioEditandoId = id;

  document.getElementById('nomeUsuario').value = usuario.nome;
  document.getElementById('telefoneUsuario').value = usuario.telefone;
  document.getElementById('tipoUsuario').value = usuario.tipo;
  document.getElementById('turmaUsuario').value = usuario.turma || '';

  document.getElementById('tituloFormularioUsuario').textContent =
    'Editar usuário';

  document.getElementById('btnSalvarUsuario').textContent =
    'Salvar alterações';

  document.getElementById('btnCancelarEdicao').hidden = false;

  document.getElementById('nomeUsuario').focus();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// Cancelar edição

function cancelarEdicaoUsuario() {
  usuarioEditandoId = null;

  document.getElementById('formUsuario').reset();

  document.getElementById('tituloFormularioUsuario').textContent =
    'Cadastrar usuário';

  document.getElementById('btnSalvarUsuario').textContent =
    'Cadastrar usuário';

  document.getElementById('btnCancelarEdicao').hidden = true;
}


// Excluir usuário

function excluirUsuario(id) {
  const usuarios = lerDados(STORAGE_USUARIOS);

  const usuario = usuarios.find(item => item.id === id);

  if (!usuario) return;

  const emprestimos = lerDados(STORAGE_EMPRESTIMOS);

  const emprestimoAtivo = emprestimos.some(
    item => item.usuarioId === id && !item.devolvido
  );

  if (emprestimoAtivo) {
    alert(
      'Não é possível excluir este usuário porque ele possui um empréstimo ativo.'
    );
    return;
  }

  if (!confirm(`Deseja excluir o usuário ${usuario.nome}?`)) {
    return;
  }

  salvarLocal(
    STORAGE_USUARIOS,
    usuarios.filter(item => item.id !== id)
  );

  atualizarInterface();

  alert('Usuário excluído com sucesso!');
}


// Carregar usuários no formulário de empréstimos

function carregarUsuarios() {
  const select = document.getElementById('usuarioEmprestimo');

  if (!select) return;

  const selecionado = select.value;

  select.replaceChildren();

  const inicial = document.createElement('option');
  inicial.value = '';
  inicial.textContent = 'Ou preencha os dados manualmente';

  select.appendChild(inicial);

  lerDados(STORAGE_USUARIOS).forEach(usuario => {
    const option = document.createElement('option');

    option.value = usuario.id;
    option.textContent = `${usuario.nome} - ${usuario.tipo}`;

    select.appendChild(option);
  });

  select.value = selecionado;
}


// Preencher nome e telefone automaticamente

function selecionarUsuarioEmprestimo() {
  const id = document.getElementById('usuarioEmprestimo').value;

  if (!id) return;

  const usuarios = lerDados(STORAGE_USUARIOS);

  const usuario = usuarios.find(item => item.id === id);

  if (!usuario) return;

  document.getElementById('nome').value = usuario.nome;
  document.getElementById('telefone').value = usuario.telefone;
}


// ==========================================
// EMPRÉSTIMOS
// ==========================================

function salvarDados() {

  const nome = document.getElementById('nome').value.trim();

  const telefone = document
    .getElementById('telefone')
    .value.trim();

  const livroId = document.getElementById('livro').value;

    const usuarioId =
  document.getElementById('usuarioEmprestimo')?.value || '';

  const retirada = document.getElementById('retirada').value;

  const devolucao = document.getElementById('devolucao').value;

  if (
    !nome ||
    !telefone ||
    !livroId ||
    !retirada ||
    !devolucao
  ) {

    alert('Preencha todos os campos do empréstimo.');

    return;
  }

  if (devolucao < retirada) {

    alert('A data de devolução não pode ser anterior à retirada.');

    return;
  }

  const livros = lerDados(STORAGE_LIVROS);

  const livro = livros.find(item => item.id === livroId);

  if (!livro || !livro.disponivel) {

    alert('Esse livro não está disponível para empréstimo.');

    atualizarInterface();

    return;
  }

  const emprestimos = lerDados(STORAGE_EMPRESTIMOS);

  emprestimos.push({usuarioId,

    id: gerarId(),

    nome,

    telefone,

    livroId: livro.id,

    livro: livro.nome,

    retirada,

    devolucao,

    devolvido: false

  });

  livro.disponivel = false;

  salvarLocal(STORAGE_LIVROS, livros);

  salvarLocal(STORAGE_EMPRESTIMOS, emprestimos);

  document.getElementById('nome').value = '';
  document.getElementById('telefone').value = '';
  document.getElementById('retirada').value = '';
  document.getElementById('devolucao').value = '';

  atualizarInterface();

  document.getElementById('usuarioEmprestimo').value = '';

  alert('Empréstimo registrado com sucesso!');
}


// ==========================================
// DEVOLVER LIVRO
// ==========================================

function devolverLivro(id) {

  const emprestimos = lerDados(STORAGE_EMPRESTIMOS);

  const registro = emprestimos.find(
    item => item.id === id
  );

  if (!registro || registro.devolvido) return;

  registro.devolvido = true;

  const livros = lerDados(STORAGE_LIVROS);

  const livro = livros.find(
    item => item.id === registro.livroId
  );

  if (livro) {

    livro.disponivel = true;

  }

  salvarLocal(STORAGE_EMPRESTIMOS, emprestimos);

  salvarLocal(STORAGE_LIVROS, livros);

  atualizarInterface();

}


// ==========================================
// EXCLUIR REGISTRO
// ==========================================

function excluirRegistro(id) {

  const emprestimos = lerDados(STORAGE_EMPRESTIMOS);

  const registro = emprestimos.find(
    item => item.id === id
  );

  if (!registro) return;

  if (
    !confirm('Deseja excluir esse registro de empréstimo?')
  ) return;

  // Se ainda estiver emprestado,
  // devolve o livro ao acervo.

  if (!registro.devolvido) {

    const livros = lerDados(STORAGE_LIVROS);

    const livro = livros.find(
      item => item.id === registro.livroId
    );

    if (livro) {

      livro.disponivel = true;

    }

    salvarLocal(STORAGE_LIVROS, livros);

  }

  salvarLocal(

    STORAGE_EMPRESTIMOS,

    emprestimos.filter(item => item.id !== id)

  );

  atualizarInterface();

}


// ==========================================
// MOSTRAR REGISTROS DE EMPRÉSTIMOS
// ==========================================

function mostrarDados() {

  const lista = document.getElementById('lista');

  if (!lista) return;

  lista.replaceChildren();

  lerDados(STORAGE_EMPRESTIMOS).forEach(registro => {

    const linha = document.createElement('tr');

    const atrasado =
      !registro.devolvido &&
      registro.devolucao < dataHoje();

    const valores = [

      registro.nome,

      registro.telefone,

      registro.livro || 'Livro não identificado',

      formatarData(registro.retirada),

      formatarData(registro.devolucao)

    ];

    valores.forEach(valor => {

      const td = document.createElement('td');

      td.textContent = valor || '-';

      linha.appendChild(td);

    });

    // Status
    const tdStatus = document.createElement('td');

    const status = document.createElement('span');

    status.className = registro.devolvido
      ? 'status status-disponivel'
      : atrasado
        ? 'status atrasado'
        : 'status status-emprestado';

    status.textContent = registro.devolvido
      ? 'Devolvido'
      : atrasado
        ? 'Atrasado'
        : 'Emprestado';

    tdStatus.appendChild(status);

    linha.appendChild(tdStatus);

    // Ações
    const tdAcoes = document.createElement('td');

    if (!registro.devolvido) {

      const botaoDevolver = document.createElement('button');

      botaoDevolver.type = 'button';
      botaoDevolver.className = 'return-btn';
      botaoDevolver.textContent = 'Devolver';

      botaoDevolver.addEventListener('click', () => {

        devolverLivro(registro.id);

      });

      tdAcoes.appendChild(botaoDevolver);

    }

    const botaoExcluir = document.createElement('button');

    botaoExcluir.type = 'button';
    botaoExcluir.className = 'delete-btn';
    botaoExcluir.textContent = 'Excluir';

    botaoExcluir.addEventListener('click', () => {

      excluirRegistro(registro.id);

    });

    tdAcoes.appendChild(botaoExcluir);

    linha.appendChild(tdAcoes);

    lista.appendChild(linha);

  });

  pesquisarRegistro();

}


// ==========================================
// PESQUISAR REGISTROS
// ==========================================

function pesquisarRegistro() {

  const campo = document.getElementById('pesquisa');

  if (!campo) return;

  const pesquisa = campo.value.toLocaleLowerCase('pt-BR');

  document.querySelectorAll('#lista tr').forEach(linha => {

    linha.style.display =
      linha.textContent
        .toLocaleLowerCase('pt-BR')
        .includes(pesquisa)
        ? ''
        : 'none';

  });

}


// ==========================================
// DATAS
// ==========================================

function dataHoje() {

  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    agora.getDate()
  ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;

}


function formatarData(data) {

  if (!data) return '-';

  const partes = data.split('-');

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : data;

}


// ==========================================
// DASHBOARD
// ==========================================

function atualizarRelatorios() {

  const emprestimos = lerDados(STORAGE_EMPRESTIMOS);
  const livros = lerDados(STORAGE_LIVROS);

  const ativos = emprestimos.filter(
    item => !item.devolvido
  );

  const disponiveis = livros.filter(
    livro => livro.disponivel
  );

  const atrasados = emprestimos.filter(
    item =>
      !item.devolvido &&
      item.devolucao < dataHoje()
  );

  const indicadores = {
    totalEmprestimos: emprestimos.length,
    emprestimosAtivos: ativos.length,
    totalLivros: livros.length,
    livrosDisponiveis: disponiveis.length,
    totalAtrasados: atrasados.length
  };

  Object.entries(indicadores).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  });
}


// ==========================================
// ATUALIZAR INTERFACE
// ==========================================

function atualizarInterface() {
  carregarLivros();
  carregarUsuarios();
  mostrarAcervo();
  mostrarDados();
  mostrarUsuarios();
  atualizarRelatorios();
}


// ==========================================
// NAVEGAÇÃO
// ==========================================

function mostrarSecao(id) {
  const secoes = [
    'dashboard',
    'emprestimos',
    'livros',
    'usuarios'
  ];

  const titulos = {
    dashboard: 'Painel Principal',
    emprestimos: 'Gerenciamento de Empréstimos',
    livros: 'Biblioteca e Acervo',
    usuarios: 'Gerenciamento de Usuários'
  };

  if (!secoes.includes(id)) {
    console.error('Seção inválida:', id);
    return;
  }

  secoes.forEach(nome => {
    const elemento = document.getElementById(nome);
    if (elemento) {
      elemento.style.display = 'none';
    }
  });

  const selecionada = document.getElementById(id);

  if (!selecionada) {
    console.error('Seção não encontrada:', id);
    return;
  }

  selecionada.style.display = id === 'dashboard' ? 'grid' : 'block';

  const titulo = document.querySelector('.top-content h1');
  if (titulo) {
    titulo.textContent = titulos[id] || 'Sistema Escolar';
  }

  document.querySelectorAll('.sidebar nav a[data-section]').forEach(link => {
    const ativo = link.dataset.section === id;
    link.classList.toggle('ativo', ativo);

    if (ativo) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}


// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  criarBibliotecaPadrao();
  atualizarInterface();
  mostrarSecao('dashboard');

  // Cadastro, edição e pesquisa de usuários.
  const formUsuario = document.getElementById('formUsuario');
  if (formUsuario) {
    formUsuario.addEventListener('submit', salvarUsuario);
  }

  const pesquisaUsuarios = document.getElementById('pesquisaUsuarios');
  if (pesquisaUsuarios) {
    pesquisaUsuarios.addEventListener('input', mostrarUsuarios);
  }

  const botaoCancelarEdicao = document.getElementById('btnCancelarEdicao');
  if (botaoCancelarEdicao) {
    botaoCancelarEdicao.type = 'button';
    botaoCancelarEdicao.addEventListener('click', cancelarEdicaoUsuario);
  }

  // Seleção de usuário no formulário de empréstimo.
  const usuarioEmprestimo = document.getElementById('usuarioEmprestimo');
  if (usuarioEmprestimo) {
    usuarioEmprestimo.addEventListener('change', selecionarUsuarioEmprestimo);
  }

  // Pesquisa de livros na API Google Books.
  const formularioBusca = document.getElementById('formBuscaLivros');
  if (formularioBusca) {
    formularioBusca.addEventListener('submit', evento => {
      evento.preventDefault();
      const campoBusca = document.getElementById('buscaLivro');
      buscarLivros(campoBusca ? campoBusca.value : '');
    });
  }

  // Paginação dos resultados da API.
  const botaoMais = document.getElementById('btnCarregarMais');
  if (botaoMais) {
    botaoMais.addEventListener('click', carregarMaisLivros);
  }

  // Pesquisa e filtro do acervo local.
  const pesquisaAcervo = document.getElementById('pesquisarAcervo');
  if (pesquisaAcervo) {
    pesquisaAcervo.addEventListener('input', mostrarAcervo);
  }

  const filtroDisponibilidade = document.getElementById('filtroDisponibilidade');
  if (filtroDisponibilidade) {
    filtroDisponibilidade.addEventListener('change', mostrarAcervo);
  }
});
