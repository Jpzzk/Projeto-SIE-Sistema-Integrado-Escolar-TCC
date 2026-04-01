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