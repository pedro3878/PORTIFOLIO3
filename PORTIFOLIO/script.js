document.addEventListener('DOMContentLoaded', function() {
    
    const elementoAno = document.getElementById('ano-atual');
    if (elementoAno) {
        elementoAno.textContent = new Date().getFullYear();
    }

    iniciarFoguete3D();
    iniciarParticulas();
    configurarFiltros();
    configurarFormulario();
});

function iniciarFoguete3D() {
    const elementoContainer = document.getElementById('container-foguete-3d');
    if (!elementoContainer) return;

    const cena = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, elementoContainer.clientWidth / elementoContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderizador = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderizador.setSize(elementoContainer.clientWidth, elementoContainer.clientHeight);
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    elementoContainer.appendChild(renderizador.domElement);

    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.8);
    cena.add(luzAmbiente);

    const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.2);
    luzDirecional.position.set(5, 10, 7);
    cena.add(luzDirecional);

    const grupoInclinacao = new THREE.Group();
    grupoInclinacao.rotation.z = -0.35;
    grupoInclinacao.rotation.x = 0.2;
    cena.add(grupoInclinacao);

    const meuFoguete = new THREE.Group();
    grupoInclinacao.add(meuFoguete);

    const geoCorpo = new THREE.CylinderGeometry(0.7, 0.8, 3.2, 32);
    const matCorpo = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 });
    const corpo = new THREE.Mesh(geoCorpo, matCorpo);
    meuFoguete.add(corpo);

    const geoBico = new THREE.ConeGeometry(0.7, 1.4, 32);
    const matBico = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2, metalness: 0.4 });
    const bico = new THREE.Mesh(geoBico, matBico);
    bico.position.y = 2.3;
    meuFoguete.add(bico);

    const geoAnel = new THREE.TorusGeometry(0.73, 0.08, 16, 32);
    const matAnel = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.6 });
    
    const anelTopo = new THREE.Mesh(geoAnel, matAnel);
    anelTopo.position.y = 1.3;
    anelTopo.rotation.x = Math.PI / 2;
    meuFoguete.add(anelTopo);

    const anelBase = new THREE.Mesh(geoAnel, matAnel);
    anelBase.position.y = -1.1;
    anelBase.rotation.x = Math.PI / 2;
    meuFoguete.add(anelBase);

    const geoJanelaBorda = new THREE.TorusGeometry(0.35, 0.06, 16, 32);
    const matJanelaBorda = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7, roughness: 0.2 });
    const janelaBorda = new THREE.Mesh(geoJanelaBorda, matJanelaBorda);
    janelaBorda.position.set(0, 0.7, 0.7);
    meuFoguete.add(janelaBorda);

    const geoVidro = new THREE.CircleGeometry(0.33, 32);
    const matVidro = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const vidro = new THREE.Mesh(geoVidro, matVidro);
    vidro.position.set(0, 0.7, 0.71);
    meuFoguete.add(vidro);

    const formatoAsa = new THREE.Shape();
    formatoAsa.moveTo(0, 0);
    formatoAsa.lineTo(0.95, -0.6);
    formatoAsa.lineTo(0.95, -1.35);
    formatoAsa.lineTo(0, -0.9);
    formatoAsa.closePath();

    const configuracaoExtrusao = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const geoAsa = new THREE.ExtrudeGeometry(formatoAsa, configuracaoExtrusao);
    const matAsa = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 });

    for (let i = 0; i < 3; i++) {
        const asa = new THREE.Mesh(geoAsa, matAsa);
        const angulo = (i * Math.PI * 2) / 3;
        asa.position.set(Math.sin(angulo) * 0.7, -0.8, Math.cos(angulo) * 0.7);
        asa.rotation.y = angulo + Math.PI / 2;
        meuFoguete.add(asa);
    }

    const geoTurbina = new THREE.CylinderGeometry(0.42, 0.62, 0.6, 32);
    const matTurbina = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const turbina = new THREE.Mesh(geoTurbina, matTurbina);
    turbina.position.y = -1.9;
    meuFoguete.add(turbina);

    const geoChama = new THREE.ConeGeometry(0.5, 1.5, 32);
    geoChama.rotateX(Math.PI);
    const matChama = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85 });
    const chama = new THREE.Mesh(geoChama, matChama);
    chama.position.y = -2.95;
    meuFoguete.add(chama);

    let velocidadePadrao = 0.022;
    let velocidadeAtual = velocidadePadrao;
    let relogio = new THREE.Clock();

    const botaoTurbo = document.getElementById('botao-turbo');
    if (botaoTurbo) {
        botaoTurbo.addEventListener('click', function() {
            velocidadeAtual = 0.12;
            setTimeout(function() {
                velocidadeAtual = velocidadePadrao;
            }, 2500);
        });
    }

    let estaArrastando = false;
    let posicaoAnteriorX = 0;

    elementoContainer.addEventListener('mousedown', function(evento) {
        estaArrastando = true;
        posicaoAnteriorX = evento.clientX;
    });

    window.addEventListener('mouseup', function() {
        estaArrastando = false;
    });

    window.addEventListener('mousemove', function(evento) {
        if (!estaArrastando) return;
        const diferencaX = evento.clientX - posicaoAnteriorX;
        meuFoguete.rotation.y += diferencaX * 0.01;
        posicaoAnteriorX = evento.clientX;
    });

    function animar() {
        requestAnimationFrame(animar);
        const tempo = relogio.getElapsedTime();

        meuFoguete.rotation.y += velocidadeAtual;

        grupoInclinacao.position.y = Math.sin(tempo * 2.2) * 0.18;

        const escalaChama = velocidadeAtual > velocidadePadrao ? 1.8 : 1.0;
        chama.scale.set(
            escalaChama + Math.sin(tempo * 18) * 0.15,
            escalaChama + Math.cos(tempo * 20) * 0.25,
            escalaChama + Math.sin(tempo * 18) * 0.15
        );

        renderizador.render(cena, camera);
    }

    animar();

    window.addEventListener('resize', function() {
        camera.aspect = elementoContainer.clientWidth / elementoContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderizador.setSize(elementoContainer.clientWidth, elementoContainer.clientHeight);
    });
}

function iniciarParticulas() {
    const canvas = document.getElementById('canvas-particulas');
    if (!canvas) return;
    const contexto = canvas.getContext('2d');

    function redimensionar() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    redimensionar();
    window.addEventListener('resize', redimensionar);

    const particulas = [];
    const quantidadeParticulas = 60;

    for (let i = 0; i < quantidadeParticulas; i++) {
        particulas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            tamanho: Math.random() * 2 + 0.5,
            velocidadeX: (Math.random() - 0.5) * 0.4,
            velocidadeY: (Math.random() - 0.5) * 0.4,
            opacidade: Math.random() * 0.5 + 0.2
        });
    }

    function desenharParticulas() {
        contexto.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach(p => {
            contexto.fillStyle = `rgba(168, 85, 247, ${p.opacidade})`;
            contexto.beginPath();
            contexto.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
            contexto.fill();

            p.x += p.velocidadeX;
            p.y += p.velocidadeY;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });
        requestAnimationFrame(desenharParticulas);
    }
    desenharParticulas();
}

function configurarFiltros() {
    const botoesFiltro = document.querySelectorAll('.botao-filtro');
    const cartoesHabilidade = document.querySelectorAll('.cartao-habilidade');

    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', function() {
            botoesFiltro.forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');

            const categoria = this.getAttribute('data-categoria');
            cartoesHabilidade.forEach(cartao => {
                if (categoria === 'todas' || cartao.getAttribute('data-categoria') === categoria) {
                    cartao.style.display = 'block';
                } else {
                    cartao.style.display = 'none';
                }
            });
        });
    });
}

function configurarFormulario() {
    const formularioContacto = document.getElementById('formulario-contacto');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    if (!formularioContacto) return;

    formularioContacto.addEventListener('submit', function(evento) {
        evento.preventDefault();
        mensagemSucesso.classList.remove('oculto');
        formularioContacto.reset();
        
        setTimeout(function() {
            mensagemSucesso.classList.add('oculto');
        }, 4000);
    });
}

function abrirModal(titulo, descricao) {
    document.getElementById('titulo-modal').textContent = titulo;
    document.getElementById('descricao-modal').textContent = descricao;
    document.getElementById('modal-projeto').classList.remove('oculto');
}

function fecharModal() {
    document.getElementById('modal-projeto').classList.add('oculto');
}


