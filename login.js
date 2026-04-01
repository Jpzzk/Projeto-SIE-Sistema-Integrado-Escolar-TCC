function fazerLogin() {
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
  
    // Login fixo (simples)
    if (usuario === 'admin' && senha === '1234') {
      localStorage.setItem('logado', 'true');
      window.location.href = 'index.html';
    } else {
      alert('Usuário ou senha incorretos');
    }
  }
  function logout() {
    localStorage.removeItem('logado');
    window.location.href = 'login.html';
  }