// LOGIN

function login() {

  const usuario =
    document.getElementById('usuario').value;

  const senha =
    document.getElementById('senha').value;

  const erro =
    document.getElementById('erroLogin');

  // LOGIN PADRÃO

  if (
    usuario === 'joao' &&
    senha === '1234'
  ) {

    localStorage.setItem('logado', 'true');

    localStorage.setItem('usuario', usuario);

    window.location.href = 'index.html';

  } else {

    erro.innerText =
      'Usuário ou senha incorretos';

  }

}

// MOSTRAR SENHA

function mostrarSenha() {

  const senha =
    document.getElementById('senha');

  if (senha.type === 'password') {

    senha.type = 'text';

  } else {

    senha.type = 'password';

  }

}
