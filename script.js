// Função para salvar os dados
function salvarDados() {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const retirada = document.getElementById('retirada').value;
    const devolucao = document.getElementById('devolucao').value;
  
    // Validação simples
    if (!nome || !telefone || !retirada || !devolucao) {
      alert('Preencha todos os campos');
      return;
    }
  
    // Criando objeto
    const registro = {
      nome: nome,
      telefone: telefone,
      retirada: retirada,
      devolucao: devolucao
    };
  
    // Pegando dados já salvos
    let dados = JSON.parse(localStorage.getItem('emprestimos')) || [];
  
    // Adicionando novo registro
    dados.push(registro);
  
    // Salvando novamente
    localStorage.setItem('emprestimos', JSON.stringify(dados));
  
    alert('Empréstimo registrado com sucesso');
  
    limparCampos();
    mostrarDados();
  }
  
  // Função para mostrar os dados
  function mostrarDados() {
    const lista = document.getElementById('lista');
    lista.innerHTML = '';
  
    let dados = JSON.parse(localStorage.getItem('emprestimos')) || [];
  
    dados.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'card';
  
      div.innerHTML = `
        <strong>${item.nome}</strong><br>
        Telefone: ${item.telefone}<br>
        Retirada: ${item.retirada}<br>
        Devolução: ${item.devolucao}<br><br>
        <button onclick="excluirRegistro(${index})">Excluir</button>
      `;
  
      lista.appendChild(div);
    });
  }
  
  // Função para excluir
  function excluirRegistro(index) {
    let dados = JSON.parse(localStorage.getItem('emprestimos')) || [];
  
    dados.splice(index, 1);
  
    localStorage.setItem('emprestimos', JSON.stringify(dados));
  
    mostrarDados();
  }
  
  // Limpar formulário
  function limparCampos() {
    document.getElementById('nome').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('retirada').value = '';
    document.getElementById('devolucao').value = '';
  }
  
  // Carregar ao abrir
  window.onload = mostrarDados;
  window.onload = function() {

    criarBibliotecaPadrao();
  
    carregarLivros();
  
    mostrarDados();
  
    atualizarRelatorios();
  
    mostrarSecao('dashboard');
  
  }
  function pesquisarRegistro() {

    const pesquisa =
      document.getElementById('pesquisa')
      .value
      .toLowerCase();
  
    const registros =
      document.querySelectorAll('.registro-card');
  
    registros.forEach((registro) => {
  
      const texto =
        registro.innerText.toLowerCase();
  
      if (texto.includes(pesquisa)) {
  
        registro.style.display = 'flex';
  
      } else {
  
        registro.style.display = 'none';
  
      }
  
    });
  
  }
  // CADASTRAR LIVRO

function cadastrarLivro() {

  const nome =
    document.getElementById('nomeLivro').value;

  const autor =
    document.getElementById('autorLivro').value;

  const categoria =
    document.getElementById('categoriaLivro').value;

  if (!nome || !autor || !categoria) {

    alert('Preencha todos os campos');

    return;

  }

  const livro = {
    nome,
    autor,
    categoria,
    disponivel: true
  };

  let livros =
    JSON.parse(localStorage.getItem('livros')) || [];

  livros.push(livro);

  localStorage.setItem(
    'livros',
    JSON.stringify(livros)
  );

  alert('Livro cadastrado');

  carregarLivros();

  limparCamposLivro();

}

// CARREGAR LIVROS

function carregarLivros() {

  const select =
    document.getElementById('livro');

  select.innerHTML =
    '<option value="">Selecione um livro</option>';

  let livros =
    JSON.parse(localStorage.getItem('livros')) || [];

  livros.forEach((livro) => {

    const option =
      document.createElement('option');

    option.value = livro.nome;

    option.innerText =
      livro.nome + ' - ' + livro.autor;

    select.appendChild(option);

  });

}

// LIMPAR CAMPOS

function limparCamposLivro() {

  document.getElementById('nomeLivro').value = '';

  document.getElementById('autorLivro').value = '';

  document.getElementById('categoriaLivro').value = '';

}
// BIBLIOTECA PADRÃO

function criarBibliotecaPadrao() {

  let livros =
    JSON.parse(localStorage.getItem('livros'));

  // Evita recriar livros
  if (livros && livros.length > 0) {
    return;
  }

  const biblioteca = [

    {
      nome: 'Dom Casmurro',
      autor: 'Machado de Assis',
      categoria: 'Romance',
      disponivel: true
    },

    {
      nome: 'Harry Potter',
      autor: 'J.K Rowling',
      categoria: 'Fantasia',
      disponivel: true
    },

    {
      nome: 'Percy Jackson',
      autor: 'Rick Riordan',
      categoria: 'Fantasia',
      disponivel: true
    },

    {
      nome: 'O Pequeno Príncipe',
      autor: 'Antoine de Saint-Exupéry',
      categoria: 'Infantil',
      disponivel: true
    },

    {
      nome: '1984',
      autor: 'George Orwell',
      categoria: 'Ficção',
      disponivel: true
    },

    {
      nome: 'A Revolução dos Bichos',
      autor: 'George Orwell',
      categoria: 'Ficção',
      disponivel: true
    },

    {
      nome: 'Naruto',
      autor: 'Masashi Kishimoto',
      categoria: 'Mangá',
      disponivel: true
    },

    {
      nome: 'One Piece',
      autor: 'Eiichiro Oda',
      categoria: 'Mangá',
      disponivel: true
    },

    {
      nome: 'Clean Code',
      autor: 'Robert C. Martin',
      categoria: 'Programação',
      disponivel: true
    },

    {
      nome: 'HTML e CSS',
      autor: 'Jon Duckett',
      categoria: 'Programação',
      disponivel: true
    }

  ];

  localStorage.setItem(
    'livros',
    JSON.stringify(biblioteca)
  );

}

function mostrarSecao(id) {

  const secoes =
    document.querySelectorAll('.secao');

  secoes.forEach((secao) => {

    secao.style.display = 'none';

  });

  document.getElementById(id)
    .style.display = 'block';

}

function atualizarRelatorios() {

  let emprestimos =
    JSON.parse(localStorage.getItem('emprestimos')) || [];

  let livros =
    JSON.parse(localStorage.getItem('livros')) || [];

  document.getElementById('relatorioEmprestimos')
    .innerText = emprestimos.length;

  document.getElementById('relatorioLivros')
    .innerText = livros.length;

}
