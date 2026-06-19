// Variable globale contenant la structure de fichiers (à initialiser au début de votre script global si ce n'est pas fait)
let fileSystem = fileSystem || { '/': {} }; 
let currentPath = currentPath || '/';

/**
 * Récupère le dossier actuel à partir de la variable 'currentPath'
 */
function getCurrentDirectory() {
    const parts = currentPath.split('/').filter(p => p);
    let current = fileSystem['/']; // CORRECTION : Assure un point de départ racine valide

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
    const clockEl = document.getElementById('clock');
    if (clockEl) { // CORRECTION : Évite une erreur JS si l'élément HTML n'est pas encore rendu
        clockEl.textContent = now.toLocaleTimeString('fr-FR');
    }
}
setInterval(updateClock, 1000);

// Démarrer le noyau au chargement
window.addEventListener('load', () => {
    // S'assure que la fonction bootKernel existe avant de l'appeler
    if (typeof bootKernel === 'function') {
        setTimeout(bootKernel, 500);
    }
});

// Cliquer sur l'écran pour focus l'input
const screenEl = document.getElementById('screen');
if (screenEl) {
    screenEl.addEventListener('click', () => {
        const input = document.getElementById('cmd-input');
        if (input && !input.disabled) {
            input.focus();
        }
    });
}
