let scripts = [];
let currentPage = 0;
const itemsPerPage = 6;

// Load scripts from JSON
async function loadScripts() {
    try {
        const response = await fetch('scripts.json');
        scripts = await response.json();
        updateStats();
        renderScripts();
    } catch (error) {
        console.error('Error loading scripts:', error);
        showToast('❌ Failed to load scripts', 'error');
    }
}

// Update statistics
function updateStats() {
    const totalScripts = scripts.length;
    const undetectedCount = scripts.filter(s => s.status.toLowerCase() === 'undetected').length;
    const gamesCount = new Set(scripts.map(s => s.game)).size;

    document.getElementById('totalScripts').textContent = totalScripts;
    document.getElementById('undetectedCount').textContent = undetectedCount;
    document.getElementById('gamesCount').textContent = gamesCount;
}

// Get status class
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'undetected') {
        return 'status-undetected';
    } else if (statusLower === 'detected') {
        return 'status-detected';
    } else if (statusLower.includes('detected in some')) {
        return 'status-partial';
    }
    return 'status-partial';
}

// Show image modal
function showImageModal(imageSrc, imageName) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    modalImage.src = imageSrc;
    modalImage.alt = imageName;
    modal.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Hide image modal
function hideImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
}

// Render scripts for current page
function renderScripts() {
    const container = document.getElementById('scriptsContainer');
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const pageScripts = scripts.slice(start, end);

    container.innerHTML = pageScripts.map((script, index) => `
    <div class="card" style="animation-delay: ${index * 0.1}s">
      <img 
        src="img/${script.image}" 
        alt="${script.name}" 
        class="script-image" 
        onerror="this.src='img/placeholder.png'"
        onclick="showImageModal('img/${script.image}', '${escapeHtml(script.name)}')"
      >
      <h3 class="text-xl font-bold mb-2">${escapeHtml(script.name)}</h3>
      <p class="text-gray-400 text-sm mb-3">${escapeHtml(script.description)}</p>
      <div class="text-xs text-gray-500 mb-2">
        <div class="mb-1">Author: <span class="text-gray-300">${escapeHtml(script.author)}</span></div>
        <div class="mb-1">Game: <span class="text-gray-300">${escapeHtml(script.game)}</span></div>
        <div><span class="status-badge ${getStatusClass(script.status)}">${escapeHtml(script.status)}</span></div>
      </div>
      <button class="btn-copy" onclick="copyScript(\`${escapeHtml(script.script)}\`, '${escapeHtml(script.name)}')">
        Copy Script
      </button>
    </div>
  `).join('');

    updateNavigation();
}

// Copy script to clipboard
function copyScript(scriptContent, scriptName) {
    navigator.clipboard.writeText(scriptContent).then(() => {
        showToast(`✓ ${scriptName} copied to clipboard`);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('❌ Failed to copy script', 'error');
    });
}

// Update navigation buttons
function updateNavigation() {
    const totalPages = Math.ceil(scripts.length / itemsPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
}

// Navigation handlers
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        renderScripts();
        window.scrollTo({ top: document.querySelector('.scripts-section').offsetTop - 100, behavior: 'smooth' });
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    const totalPages = Math.ceil(scripts.length / itemsPerPage);
    if (currentPage < totalPages - 1) {
        currentPage++;
        renderScripts();
        window.scrollTo({ top: document.querySelector('.scripts-section').offsetTop - 100, behavior: 'smooth' });
    }
});

// Image modal event listener
document.getElementById('imageModal').addEventListener('click', hideImageModal);

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
loadScripts();
