let scripts = [];
let filteredScripts = [];
let currentPage = 0;
const itemsPerPage = 6;

let filters = {
    search: '',
    game: '',
    status: 'all'
};

// Load scripts from JSON
async function loadScripts() {
    try {
        const response = await fetch('scripts.json');
        scripts = await response.json();
        filteredScripts = [...scripts];
        updateStats();
        populateGameFilter();
        setupEventListeners();
        renderScripts();
    } catch (error) {
        console.error('Error loading scripts:', error);
        showToast('❌ Failed to load scripts', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search box
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            filters.search = e.target.value;
            applyFilters();
        });
    }

    // Game filter
    const gameFilter = document.getElementById('gameFilter');
    if (gameFilter) {
        gameFilter.addEventListener('change', (e) => {
            filters.game = e.target.value;
            applyFilters();
        });
    }

    // Status toggles
    const statusAll = document.getElementById('statusAll');
    const statusUndetected = document.getElementById('statusUndetected');
    const statusDetected = document.getElementById('statusDetected');

    if (statusAll) {
        statusAll.addEventListener('click', () => toggleStatus('all'));
    }
    if (statusUndetected) {
        statusUndetected.addEventListener('click', () => toggleStatus('undetected'));
    }
    if (statusDetected) {
        statusDetected.addEventListener('click', () => toggleStatus('detected'));
    }
}

// Populate game filter dropdown
function populateGameFilter() {
    const gameFilter = document.getElementById('gameFilter');
    const games = [...new Set(scripts.map(s => s.game))].sort();

    // Clear existing options except "All Games"
    gameFilter.innerHTML = '<option value="">All Games</option>';

    games.forEach(game => {
        const option = document.createElement('option');
        option.value = game;
        option.textContent = game;
        gameFilter.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    filteredScripts = scripts.filter(script => {
        // Search filter - search in name field
        const matchesSearch = !filters.search ||
            script.name.toLowerCase().includes(filters.search.toLowerCase());

        // Game filter - match exact game
        const matchesGame = !filters.game || script.game === filters.game;

        // Status filter - check status field
        let matchesStatus = true;
        if (filters.status === 'undetected') {
            matchesStatus = script.status.toLowerCase() === 'undetected';
        } else if (filters.status === 'detected') {
            // Match both "Detected" and "Detected in some games"
            const statusLower = script.status.toLowerCase();
            matchesStatus = statusLower.includes('detected') && statusLower !== 'undetected';
        }
        // if status is 'all', matchesStatus stays true

        return matchesSearch && matchesGame && matchesStatus;
    });

    currentPage = 0;
    renderScripts();
}

// Toggle status filter
function toggleStatus(status) {
    filters.status = status;

    // Update active button
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-status="${status}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    applyFilters();
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
    const pageScripts = filteredScripts.slice(start, end);

    if (pageScripts.length === 0) {
        container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <p style="color: #888888; font-size: 1.125rem;">No scripts found</p>
        <p style="color: #666666; font-size: 0.875rem; margin-top: 0.5rem;">Try adjusting your filters</p>
      </div>
    `;
        updateNavigation();
        return;
    }

    container.innerHTML = pageScripts.map((script, index) => `
    <div class="card" style="animation-delay: ${index * 0.1}s">
      <img 
        src="img/${script.image}" 
        alt="${escapeHtml(script.name)}" 
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
    const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1 || totalPages === 0;

    if (totalPages === 0) {
        pageInfo.textContent = 'No results';
    } else {
        pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    }
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
    const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);
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
