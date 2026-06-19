// Simulateur du noyau LDM-OS
const MAX_CMD = 256;
let cmdBuffer = [];
let cmdPos = 0;
let kernelLoaded = false;

// Mémoire simulée (4MB)
const RAM = new Uint8Array(4 * 1024 * 1024);

// Système de fichiers simulé
const fileSystem = {
    '/': {
        'boot': { type: 'dir', content: {} },
        'kernel.sys': { type: 'file', content: 'LDM-OS Kernel Binary', size: 32768 },
        'readme.txt': { type: 'file', content: 'LDM-OS v1.0 - Systeme d exploitation 32 bits', size: 48 },
        'Documents': { type: 'dir', content: {} },
        'Programmes': { type: 'dir', content: {} }
    }
};

// Processus
let processes = [];
let currentPID = 3;
let currentPath = '/';

// Initialiser quelques processus système
processes.push({ pid: 1, name: 'system', state: 'running', memory: 1024 });
processes.push({ pid: 2, name: 'shell', state: 'running', memory: 512 });

// Logo NIRROX en ASCII art
const NIRROX_LOGO = `
<span class="info">
    ███╗   ██╗██╗██████╗ ██████╗  ██████╗ ██╗  ██╗
    ████╗  ██║██║██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝
    ██╔██╗ ██║██║██████╔╝██████╔╝██║   ██║ ╚███╔╝ 
    ██║╚██╗██║██║██╔══██╗██╔══██╗██║   ██║ ██╔██╗ 
    ██║ ╚████║██║██║  ██║██║  ██║╚██████╔╝██╔╝ ██╗
    ╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
</span>
<span class="success">
    ██████╗ ███████╗    ██╗  ██╗███████╗██████╗ ███╗   ██╗███████╗██╗     
    ██╔═══██╗██╔════╝    ██║ ██╔╝██╔════╝██╔══██╗████╗  ██║██╔════╝██║     
    ██║   ██║███████╗    █████╔╝ █████╗  ██████╔╝██╔██╗ ██║█████╗  ██║     
    ██║   ██║╚════██║    ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╗██║██╔══╝  ██║     
    ╚██████╔╝███████║    ██║  ██╗███████╗██║  ██║██║ ╚████║███████╗███████╗
     ╚═════╝ ╚══════╝    ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
</span>`;

// Initialisation du noyau
function bootKernel() {
    const kernelOutput = document.getElementById('kernel-output');
    
    const messages = [
        { text: '', cls: '', delay: 300 },
        { text: NIRROX_LOGO, cls: '', delay: 500 },
        { text: '', cls: '', delay: 200 },
        { text: '╔══════════════════════════════════════════════════════════════╗', cls: 'success', delay: 300 },
        { text: '║           NIRROX CHANNEL - LDM-OS Kernel v1.0              ║', cls: 'success', delay: 300 },
        { text: '║         Systeme d exploitation 32 bits Mode Protege        ║', cls: 'success', delay: 300 },
        { text: '╚══════════════════════════════════════════════════════════════╝', cls: 'success', delay: 300 },
        { text: '', cls: '', delay: 200 },
        { text: '[KERNEL] Initialisation du noyau...', cls: 'info', delay: 400 },
        { text: '[KERNEL] GDT chargee - Segments de code et donnees configures', cls: 'success', delay: 400 },
        { text: '[KERNEL] IDT configuree - 256 vecteurs d interruption', cls: 'success', delay: 400 },
        { text: '[KERNEL] MMU initialisee - Pagination 4KB active', cls: 'success', delay: 400 },
        { text: '[KERNEL] Chargement des drivers peripheriques...', cls: 'info', delay: 300 },
        { text: '[DRIVER] Clavier PS/2 initialise - Port 0x60', cls: 'success', delay: 300 },
        { text: '[DRIVER] VGA Text Mode 80x25 - 0xB8000', cls: 'success', delay: 300 },
        { text: '[DRIVER] Controleur ATA detecte - PIO Mode', cls: 'success', delay: 300 },
        { text: '[DRIVER] RTC Horloge Temps Reel initialise', cls: 'success', delay: 300 },
        { text: '[KERNEL] Montage du systeme de fichiers...', cls: 'info', delay: 300 },
        { text: '[FS] Partition FAT12 montee sur /', cls: 'success', delay: 300 },
        { text: '[KERNEL] Lancement du shell interactif...', cls: 'info', delay: 300 },
        { text: '', cls: '', delay: 100 },
        { text: '██████████████████████████████████████████████████████████████', cls: 'success', delay: 200 },
        { text: '██          NIRROX OS - DEMARRAGE TERMINE                  ██', cls: 'success', delay: 200 },
        { text: '██     Bienvenue sur LDM-OS Kernel v1.0                   ██', cls: 'success', delay: 200 },
        { text: '██████████████████████████████████████████████████████████████', cls: 'success', delay: 200 },
        { text: '', cls: '', delay: 100 }
    ];
    
    let totalDelay = 0;
    messages.forEach(msg => {
        totalDelay += msg.delay;
        setTimeout(() => {
            kernelOutput.innerHTML += `<div class="${msg.cls}">${msg.text}</div>`;
            document.getElementById('screen').scrollTop = document.getElementById('screen').scrollHeight;
        }, totalDelay);
    });
    
    setTimeout(() => {
        createPrompt();
        kernelLoaded = true;
        document.getElementById('screen').scrollTop = document.getElementById('screen').scrollHeight;
    }, totalDelay + 100);
}

// Créer une nouvelle invite
function createPrompt() {
    const terminal = document.getElementById('terminal');
    
    // Supprimer les anciens inputs désactivés
    const oldInputs = terminal.querySelectorAll('#cmd-input');
    oldInputs.forEach(inp => inp.remove());
    
    const inputLine = document.createElement('div');
    inputLine.className = 'input-line';
    inputLine.innerHTML = `<span class="prompt">root@NIRROX-OS:${currentPath}#</span>`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'cmd-input';
    input.autofocus = true;
    
    inputLine.appendChild(input);
    terminal.appendChild(inputLine);
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = this.value.trim();
            
            // Remplacer l'input par du texte
            const cmdText = document.createElement('span');
            cmdText.style.color = '#00ff00';
            cmdText.textContent = command;
            this.parentElement.replaceChild(cmdText, this);
            
            if (command !== '') {
                // Exécuter la commande
                executeCommand(command);
            }
            
            // Créer un nouveau prompt
            setTimeout(() => {
                createPrompt();
            }, 10);
        }
    });
    
    input.focus();
    
    // Scroll en bas
    document.getElementById('screen').scrollTop = document.getElementById('screen').scrollHeight;
}

// Exécuter les commandes
function executeCommand(cmd) {
    const terminal = document.getElementById('terminal');
    let output = '';
    const cmdLower = cmd.toLowerCase().trim();
    
    // Commandes simples
    switch(cmdLower) {
        case 'help':
            output = `
<div class="info">╔══════════════════════════════════════════════════════╗</div>
<div class="info">║        NIRROX OS - Commandes Systeme                 ║</div>
<div class="info">╚══════════════════════════════════════════════════════╝</div>
<div class="output">  📌 Commandes de base:</div>
<div class="success">    help      Affiche cette aide</div>
<div class="success">    clear     Efface l ecran</div>
<div class="success">    info      Informations systeme</div>
<div class="success">    logo      Re-afficher le logo NIRROX</div>
<div class="output">  📁 Systeme de fichiers:</div>
<div class="success">    ls        Liste les fichiers</div>
<div class="success">    pwd       Repertoire courant</div>
<div class="success">    cd        Changer de repertoire</div>
<div class="success">    cat       Lire un fichier</div>
<div class="success">    mkdir     Creer un dossier</div>
<div class="success">    touch     Creer un fichier</div>
<div class="success">    rm        Supprimer un fichier</div>
<div class="output">  🔧 Systeme:</div>
<div class="success">    ps        Processus en cours</div>
<div class="success">    mem       Etat de la memoire</div>
<div class="success">    date      Date et heure</div>
<div class="success">    whoami    Utilisateur actuel</div>
<div class="success">    echo      Afficher du texte</div>
<div class="success">    reboot    Redemarrer le systeme</div>
<div class="success">    halt      Arreter le systeme</div>
`;
            break;
            
        case 'logo':
            output = NIRROX_LOGO;
            break;
            
        case 'clear':
            const terminalDiv = document.getElementById('terminal');
            terminalDiv.innerHTML = '';
            return;
            
        case 'info':
            output = `
<div class="info">╔══════════════════════════════════════════════════════╗</div>
<div class="info">║        NIRROX OS - Informations Systeme              ║</div>
<div class="info">╚══════════════════════════════════════════════════════╝</div>
<div class="output">  🖥️  OS: NIRROX Channel - LDM-OS v1.0</div>
<div class="output">  ⚙️  Kernel: 1.0.0 (Protected Mode 32-bit)</div>
<div class="output">  🔧 Architecture: x86 (i386+)</div>
<div class="output">  💻 CPU: Intel Compatible 32-bit</div>
<div class="output">  🧠 RAM: 4 MB total</div>
<div class="output">  📺 Video: VGA 80x25 Text Mode (0xB8000)</div>
<div class="output">  💾 Filesystem: FAT12-like</div>
<div class="output">  📊 Processus: ${processes.length} actifs</div>
<div class="output">  ⏱️  Uptime: ${Math.floor((Date.now() - startTime) / 1000)}s</div>
`;
            break;
            
        case 'ls':
            const currentDir = getCurrentDirectory();
            const files = Object.entries(currentDir || {});
            if (files.length === 0) {
                output = '<div class="output">(vide)</div>';
            } else {
                output = '<div class="output">';
                files.forEach(([name, info]) => {
                    if (info.type === 'dir') {
                        output += `<div class="info">📁 ${name}/</div>`;
                    } else {
                        output += `<div class="output">📄 ${name} (${info.size} octets)</div>`;
                    }
                });
                output += '</div>';
            }
            break;
            
        case 'pwd':
            output = `<div class="output">${currentPath}</div>`;
            break;
            
        case 'ps':
            output = '<div class="info">PID  NOM              ETAT     MEMOIRE</div>';
            processes.forEach(proc => {
                output += `<div class="output">${proc.pid.toString().padEnd(4)} ${proc.name.padEnd(16)} ${proc.state.padEnd(8)} ${proc.memory} KB</div>`;
            });
            break;
            
        case 'mem':
            const usedMem = Math.round(RAM.length / 1024);
            const freeMem = (4 * 1024) - usedMem;
            output = `
<div class="info">╔══════════════════════════════════════════════════════╗</div>
<div class="info">║        ETAT DE LA MEMOIRE SYSTEME                    ║</div>
<div class="info">╚══════════════════════════════════════════════════════╝</div>
<div class="output">  🧠 Total: 4 MB (4096 KB)</div>
<div class="output">  📊 Utilise: ${usedMem} KB (Systeme + Kernel)</div>
<div class="output">  ✅ Libre: ${freeMem} KB</div>
<div class="output">  📄 Pages: ${Math.floor(freeMem/4)} disponibles (4KB/page)</div>
<div class="output">  📍 Kernel: 0x100000 - 0x1FFFFF</div>
<div class="output">  📍 Stack:  0x90000</div>
`;
            break;
            
        case 'date':
            const now = new Date();
            output = `<div class="output">📅 Date: ${now.toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</div><div class="output">⏰ Heure: ${now.toLocaleTimeString('fr-FR')}</div>`;
            break;
            
        case 'whoami':
            output = '<div class="output">👤 root@NIRROX</div>';
            break;
            
        case 'reboot':
            output = '<div class="warning">🔄 Redemarrage du systeme NIRROX OS...</div>';
            addOutput(output);
            setTimeout(() => {
                location.reload();
            }, 1500);
            return;
            
        case 'halt':
            output = '<div class="error">⏻ Arret du systeme. Vous pouvez eteindre l ordinateur.</div>';
            addOutput(output);
            setTimeout(() => {
                document.body.innerHTML = `<div style="background:#000; color:#00ff00; text-align:center; padding:50px; font-family:monospace; height:100vh; display:flex; align-items:center; justify-content:center;"><div><pre style="color:#0f0;">${NIRROX_LOGO.replace(/<[^>]*>/g, '')}</pre><h1 style="color:#0f0;">NIRROX OS</h1><p style="color:#0f0;">Systeme arrete.</p><p style="color:#0f0; font-size:12px;">Appuyez sur F5 pour redemarrer</p></div></div>`;
            }, 2000);
            return;
            
        default:
            // Commandes avec arguments
            if (cmdLower.startsWith('echo ')) {
                output = `<div class="output">${cmd.substring(5)}</div>`;
                
            } else if (cmdLower.startsWith('mkdir ')) {
                const dirname = cmd.substring(6).trim();
                if (dirname) {
                    const dir = getCurrentDirectory();
                    if (dir[dirname]) {
                        output = `<div class="error">❌ Le dossier '${dirname}' existe deja.</div>`;
                    } else {
                        dir[dirname] = { type: 'dir', content: {} };
                        output = `<div class="success">✅ Dossier '${dirname}' cree avec succes.</div>`;
                    }
                } else {
                    output = `<div class="error">❌ Usage: mkdir &lt;nom_dossier&gt;</div>`;
                }
                
            } else if (cmdLower.startsWith('touch ')) {
                const filename = cmd.substring(6).trim();
                if (filename) {
                    const dir = getCurrentDirectory();
                    dir[filename] = { type: 'file', content: '', size: 0 };
                    output = `<div class="success">✅ Fichier '${filename}' cree avec succes.</div>`;
                } else {
                    output = `<div class="error">❌ Usage: touch &lt;nom_fichier&gt;</div>`;
                }
                
            } else if (cmdLower.startsWith('cat ')) {
                const filename = cmd.substring(4).trim();
                const dir = getCurrentDirectory();
                if (dir[filename] && dir[filename].type === 'file') {
                    output = `<div class="output">${dir[filename].content || '(fichier vide)'}</div>`;
                } else {
                    output = `<div class="error">❌ cat: ${filename}: Fichier introuvable</div>`;
                }
                
            } else if (cmdLower.startsWith('cd ')) {
                const dirname = cmd.substring(3).trim();
                if (dirname === '..') {
                    if (currentPath !== '/') {
                        const parts = currentPath.split('/').filter(p => p);
                        parts.pop();
                        currentPath = parts.length === 0 ? '/' : '/' + parts.join('/') + '/';
                    }
                    output = '';
                } else if (dirname === '/') {
                    currentPath = '/';
                    output = '';
                } else {
                    const dir = getCurrentDirectory();
                    if (dir[dirname] && dir[dirname].type === 'dir') {
                        currentPath = currentPath === '/' ? `/${dirname}/` : `${currentPath}${dirname}/`;
                        output = '';
                    } else {
                        output = `<div class="error">❌ cd: ${dirname}: Dossier introuvable</div>`;
                    }
                }
                
            } else if (cmdLower.startsWith('rm ')) {
                const filename = cmd.substring(3).trim();
                const dir = getCurrentDirectory();
                if (dir[filename]) {
                    delete dir[filename];
                    output = `<div class="success">✅ '${filename}' supprime avec succes.</div>`;
                } else {
                    output = `<div class="error">❌ rm: ${filename}: Fichier introuvable</div>`;
                }
                
            } else {
                output = `<div class="error">❌ Commande inconnue: ${cmd}</div><div class="output">💡 Tapez 'help' pour la liste des commandes.</div>`;
            }
    }
    
    addOutput(output);
}

// Ajouter du texte dans le terminal
function addOutput(html) {
    if (!html) return;
    const terminal = document.getElementById('terminal');
    const outputDiv = document.createElement('div');
    outputDiv.innerHTML = html;
    terminal.appendChild(outputDiv);
    document.getElementById('screen').scrollTop = document.getElementById('screen').scrollHeight;
}

// Obtenir le répertoire courant
function getCurrentDirectory() {
    if (currentPath === '/' || currentPath === '') return fileSystem['/'];
    
    const parts = currentPath.split('/').filter(p => p);
    let current = fileSystem['/'];
    
    for (const part of parts) {
        if (current[part] && current[part].type === 'dir') {
            current = current[part].content;
        } else {
            return fileSystem['/'];
        }
    }
    
    return current;
}

// Temps de démarrage
const startTime = Date.now();

// Horloge système
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('fr-FR');
}
setInterval(updateClock, 1000);

// Démarrer le noyau au chargement
window.addEventListener('load', () => {
    setTimeout(bootKernel, 500);
});

// Cliquer sur l'écran pour focus
document.getElementById('screen').addEventListener('click', () => {
    const input = document.getElementById('cmd-input');
    if (input && !input.disabled) {
        input.focus();
    }
});