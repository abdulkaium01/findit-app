// API Base URL - will be set based on environment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' 
  : '/api';

// Global state
let currentUser = null;
let token = localStorage.getItem('token');
let currentFilter = 'all';
let currentSearch = '';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const userTypeBtns = document.querySelectorAll('.user-type-btn');
const reportLostBtn = document.getElementById('report-lost-btn');
const reportFoundBtn = document.getElementById('report-found-btn');
const browseBtn = document.getElementById('browse-btn');
const searchBtn = document.getElementById('search-btn');
const lostModal = document.getElementById('lost-modal');
const foundModal = document.getElementById('found-modal');
const lostForm = document.getElementById('lost-form');
const foundForm = document.getElementById('found-form');
const closeButtons = document.querySelectorAll('.close');
const searchContainer = document.getElementById('search-container');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const filterOptions = document.getElementById('filter-options');
const filterBtns = document.querySelectorAll('.filter-btn');
const listingsContainer = document.getElementById('listings-container');
const noListings = document.getElementById('no-listings');
const adminPanel = document.getElementById('admin-panel');
const userInterface = document.getElementById('user-interface');
const switchToUserBtn = document.getElementById('switch-to-user');
const adminStats = document.getElementById('admin-stats');
const adminTableBody = document.getElementById('admin-table-body');

// Initialize the application
function initApp() {
  // Check if user is already logged in
  if (token) {
    verifyToken();
  }
  
  // Event listeners
  setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
  // Login/Register toggles
  document.getElementById('register-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    loginScreen.style.display = 'none';
    registerScreen.style.display = 'flex';
  });
  
  document.getElementById('login-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    registerScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
  });
  
  // User type selection
  userTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      userTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Form submissions
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);
  
  // Main menu buttons
  reportLostBtn.addEventListener('click', () => openModal(lostModal));
  reportFoundBtn.addEventListener('click', () => openModal(foundModal));
  browseBtn.addEventListener('click', () => loadListings());
  searchBtn.addEventListener('click', () => {
    searchContainer.style.display = 'block';
    filterOptions.style.display = 'flex';
    loadListings();
  });
  
  // Modal forms
  lostForm.addEventListener('submit', handleReportLost);
  foundForm.addEventListener('submit', handleReportFound);
  
  // Close modals
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      lostModal.style.display = 'none';
      foundModal.style.display = 'none';
    });
  });
  
  // Click outside modal to close
  window.addEventListener('click', (e) => {
    if (e.target === lostModal) lostModal.style.display = 'none';
    if (e.target === foundModal) foundModal.style.display = 'none';
  });
  
  // Search and filter
  searchForm.addEventListener('submit', handleSearch);
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadListings();
    });
  });
  
  // Admin view toggle
  switchToUserBtn.addEventListener('click', () => {
    adminPanel.style.display = 'none';
    userInterface.style.display = 'block';
  });
}

// Verify JWT token
async function verifyToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.data.user;
      showApp();
      
      // Load appropriate view based on user role
      if (currentUser.role === 'admin') {
        loadAdminDashboard();
      } else {
        adminPanel.style.display = 'none';
        userInterface.style.display = 'block';
      }
    } else {
      localStorage.removeItem('token');
      token = null;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    localStorage.removeItem('token');
    token = null;
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const userType = document.querySelector('.user-type-btn.active').dataset.type;
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Check if user is trying to login as admin but isn't one
      if (userType === 'admin' && data.data.user.role !== 'admin') {
        showAlert('Access denied. Admin privileges required.', 'danger');
        return;
      }
      
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.data.user;
      
      showApp();
      showAlert('Login successful!', 'success');
      
      // Load appropriate view based on user role
      if (currentUser.role === 'admin') {
        loadAdminDashboard();
      }
    } else {
      showAlert(data.message || 'Login failed', 'danger');
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
    console.error('Login error:', error);
  }
}

// Handle register
async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'danger');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.data.user;
      
      showApp();
      showAlert('Registration successful!', 'success');
      registerScreen.style.display = 'none';
    } else {
      if (data.errors) {
        showAlert(data.errors[0].msg, 'danger');
      } else {
        showAlert(data.message || 'Registration failed', 'danger');
      }
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
    console.error('Registration error:', error);
  }
}

// Handle logout
function handleLogout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  
  loginScreen.style.display = 'flex';
  appContainer.style.display = 'none';
  registerScreen.style.display = 'none';
  
  // Reset forms
  loginForm.reset();
  registerForm.reset();
}

// Show main application
function showApp() {
  loginScreen.style.display = 'none';
  registerScreen.style.display = 'none';
  appContainer.style.display = 'block';
  
  // Update user info in header
  document.getElementById('user-name').textContent = currentUser.name;
  const userAvatar = document.getElementById('user-avatar');
  userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
  userAvatar.style.backgroundColor = currentUser.avatarColor;
}

// Open modal
function openModal(modal) {
  if (!currentUser) {
    showAlert('Please login to report items', 'danger');
    return;
  }
  
  modal.style.display = 'flex';
}

// Handle report lost item
async function handleReportLost(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('lost-item-name').value,
    category: document.getElementById('lost-category').value,
    description: document.getElementById('lost-description').value,
    location: document.getElementById('lost-location').value,
    date: document.getElementById('lost-date').value,
    contact: document.getElementById('lost-contact').value,
    type: 'lost'
  };
  
  try {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      lostModal.style.display = 'none';
      lostForm.reset();
      showAlert('Lost item reported successfully!', 'success');
      
      // Reload listings if we're in browse mode
      if (listingsContainer.style.display !== 'none') {
        loadListings();
      }
    } else {
      showAlert(data.message || 'Failed to report lost item', 'danger');
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
    console.error('Report lost error:', error);
  }
}

// Handle report found item
async function handleReportFound(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('found-item-name').value,
    category: document.getElementById('found-category').value,
    description: document.getElementById('found-description').value,
    location: document.getElementById('found-location').value,
    date: document.getElementById('found-date').value,
    contact: document.getElementById('found-contact').value,
    type: 'found'
  };
  
  try {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      foundModal.style.display = 'none';
      foundForm.reset();
      showAlert('Found item reported successfully!', 'success');
      
      // Reload listings if we're in browse mode
      if (listingsContainer.style.display !== 'none') {
        loadListings();
      }
    } else {
      showAlert(data.message || 'Failed to report found item', 'danger');
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
    console.error('Report found error:', error);
  }
}

// Handle search
function handleSearch(e) {
  e.preventDefault();
  currentSearch = searchInput.value;
  loadListings();
}

// Load listings based on current filter and search
async function loadListings() {
  // Show search and filter options
  searchContainer.style.display = 'block';
  filterOptions.style.display = 'flex';
  
  // Show loading state
  listingsContainer.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>
  `;
  
  try {
    // Build query string
    const params = new URLSearchParams();
    if (currentFilter !== 'all') params.append('type', currentFilter);
    if (currentSearch) params.append('search', currentSearch);
    
    const response = await fetch(`${API_BASE}/items?${params}`);
    const data = await response.json();
    
    if (response.ok) {
      displayListings(data.data.items);
    } else {
      showAlert('Failed to load listings', 'danger');
      listingsContainer.innerHTML = '';
      noListings.style.display = 'block';
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
    console.error('Load listings error:', error);
    listingsContainer.innerHTML = '';
    noListings.style.display = 'block';
  }
}

// Display listings in the UI
function displayListings(items) {
  if (items.length === 0) {
    listingsContainer.innerHTML = '';
    noListings.style.display = 'block';
    return;
  }
  
  noListings.style.display = 'none';
  listingsContainer.innerHTML = '';
  
  items.forEach(item => {
    const listingCard = document.createElement('div');
    listingCard.className = 'listing-card';
    
    const date = new Date(item.date).toLocaleDateString();
    const reportedDate = new Date(item.createdAt).toLocaleDateString();
    
    listingCard.innerHTML = `
      <div class="card-header">
        <h4>${item.name}</h4>
        <span class="status-${item.type}">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
      </div>
      <div class="card-body">
        <p>${item.description}</p>
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Location:</strong> ${item.location}</p>
        <p><strong>Date:</strong> ${date}</p>
      </div>
      <div class="card-footer">
        <span>Reported by: ${item.reportedBy.name}</span>
        <span>${reportedDate}</span>
      </div>
    `;
    
    listingsContainer.appendChild(listingCard);
  });
}

// Load admin dashboard
async function loadAdminDashboard() {
  adminPanel.style.display = 'block';
  userInterface.style.display = 'none';
  
  try {
    // Load stats
    const statsResponse = await fetch(`${API_BASE}/items/stats/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      updateAdminStats(statsData.data);
    }
    
    // Load items for table
    const itemsResponse = await fetch(`${API_BASE}/items`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json();
      populateAdminTable(itemsData.data.items);
    }
  } catch (error) {
    showAlert('Failed to load admin dashboard', 'danger');
    console.error('Admin dashboard error:', error);
  }
}

// Update admin stats
function updateAdminStats(stats) {
  const statCards = adminStats.querySelectorAll('.stat-card');
  statCards[0].querySelector('.stat-number').textContent = stats.totalItems;
  statCards[1].querySelector('.stat-number').textContent = stats.lostItems;
  statCards[2].querySelector('.stat-number').textContent = stats.foundItems;
  statCards[3].querySelector('.stat-number').textContent = stats.resolvedCases;
}

// Populate admin table
function populateAdminTable(items) {
  adminTableBody.innerHTML = '';
  
  items.forEach(item => {
    const row = document.createElement('tr');
    
    const date = new Date(item.date).toLocaleDateString();
    const statusClass = item.status === 'resolved' ? 'status-resolved' : 'active';
    
    row.innerHTML = `
      <td>${item.name}</td>
      <td><span class="status-${item.type}">${item.type}</span></td>
      <td>${date}</td>
      <td>${item.status}</td>
      <td class="action-buttons">
        <button class="action-btn btn-edit"><i class="fas fa-edit"></i></button>
        <button class="action-btn btn-delete"><i class="fas fa-trash"></i></button>
        <button class="action-btn btn-resolve"><i class="fas fa-check"></i></button>
      </td>
    `;
    
    adminTableBody.appendChild(row);
  });
}

// Show alert message
function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  alertContainer.appendChild(alert);
  
  // Remove alert after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
