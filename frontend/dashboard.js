document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and load data
  fetch('../backend/check_session.php')
    .then(response => response.json())
    .then(data => {
      if (!data.authenticated) {
        // Redirect to login if not authenticated
        window.location.href = './login.html';
        return;
      }
      
      // Set global data variables
      window.clientsData = data.clients;
      
      // Add frontend IDs - simple countdown system
      // Backend orders by id DESC (newest first), so index 0 = newest client
      window.clientsData.forEach((client, index) => {
        // Frontend ID: newest client gets highest number (200), oldest gets lowest (1)
        client.frontend_id = window.clientsData.length - index;
        client.original_order = index; // Store original order for sorting
      });
      
      window.ageGroupsData = data.ageGroups;
      window.genderCountData = data.genderCount;
      window.locationCountData = data.locationCount;
      window.visaTypeCountData = data.visaTypeCount;
      
      // Update UI elements
      document.getElementById('totalClients').textContent = data.totalClients;
      document.getElementById('profileName').textContent = data.admin;
      
      // Initialize filteredClients first
      filteredClients = [...window.clientsData];
      
      // No default sort state - just show data as received (200, 199, 198...)
      // Data comes sorted from backend, but don't mark any column as "sorted"

      console.log('Initial client data loaded:', data.clients.length, 'clients');
      
      // Initialize the dashboard
      initializeDashboard();
      
      // Initialize section navigation and splitter
      initializeSectionNavigation();
      initializeSplitter();
    })
    .catch(error => {
      console.error('Error checking session:', error);
      window.location.href = './login.html';
    });

  // Global variables
  let filteredClients = [];
  let currentPage = 1;
  let clientsPerPage = 10;
  let sortColumn = '';
  let sortDirection = 'asc';
  let selectedClients = [];

  // Section Navigation System
  let currentActiveSection = 'dashboard'; // Track current section
  
  function initializeSectionNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const actionBtns = document.querySelectorAll('.action-btn[data-section]');
    const sections = document.querySelectorAll('.content-section');
    
    // Function to ensure active state persists
    function ensureActiveState(targetSection) {
      setTimeout(() => {
        const activeMenuItem = document.querySelector(`.menu-item[data-section="${targetSection}"]`);
        if (activeMenuItem && !activeMenuItem.classList.contains('active')) {
          console.log('Ensuring active state for:', targetSection);
          menuItems.forEach(menu => menu.classList.remove('active'));
          activeMenuItem.classList.add('active');
        }
      }, 100);
    }
    
    // Handle sidebar menu clicks
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = item.getAttribute('data-section');
        console.log('Sidebar menu clicked:', targetSection);
        console.log('Item clicked:', item);
        currentActiveSection = targetSection; // Update current section
        
        // Update active menu item FIRST
        menuItems.forEach(menu => {
          menu.classList.remove('active');
          console.log('Removed active from:', menu.getAttribute('data-section'));
        });
        item.classList.add('active');
        console.log('Added active to:', targetSection);
        console.log('Item now has active class:', item.classList.contains('active'));
        
        // Show section AFTER updating active states
        showSection(targetSection);
        
        // Ensure active state persists after any DOM operations
        ensureActiveState(targetSection);
      });
    });
    
    // Handle quick action button clicks
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = btn.getAttribute('data-section');
        currentActiveSection = targetSection; // Update current section
        
        // Update active menu item FIRST
        menuItems.forEach(menu => menu.classList.remove('active'));
        const correspondingMenuItem = document.querySelector(`.menu-item[data-section="${targetSection}"]`);
        if (correspondingMenuItem) {
          correspondingMenuItem.classList.add('active');
          console.log('Action button - Added active to:', targetSection);
          console.log('Action button - Item now has active class:', correspondingMenuItem.classList.contains('active'));
        }
        
        // Show section AFTER updating active states
        showSection(targetSection);
        
        // Ensure active state persists after any DOM operations
        ensureActiveState(targetSection);
      });
    });
    
    // Add click handler for quick add client button
    const addClientQuick = document.getElementById('addClientQuick');
    if (addClientQuick) {
      addClientQuick.addEventListener('click', () => {
        document.getElementById('addClientModal').classList.add('active');
      });
    }
    
    function showSection(sectionId) {
      console.log('showSection called with:', sectionId);
      
      // Hide all sections
      sections.forEach(section => {
        section.classList.remove('active');
        console.log('Removed active from section:', section.id);
      });
      
      // Show target section
      const targetSection = document.getElementById(`${sectionId}-section`);
      console.log('Target section found:', targetSection ? targetSection.id : 'NOT FOUND');
      
      if (targetSection) {
        targetSection.classList.add('active');
        console.log('Added active to section:', targetSection.id);
        
        // Update dashboard statistics when showing dashboard
        if (sectionId === 'dashboard') {
          updateDashboardStats();
        }
        
        // Initialize charts when showing analytics
        if (sectionId === 'analytics') {
          setTimeout(() => {
            initializeCharts();
          }, 100);
        }
        
        // Reload recent clients when showing recent clients
        if (sectionId === 'recent-clients') {
          populateRecentClientsTable();
        }
        
        // Reload all clients when showing all clients
        if (sectionId === 'all-clients') {
          filterClients();
          displayClients();
          // Ensure sidebar stays highlighted after DOM operations
          setTimeout(() => {
            const activeMenuItem = document.querySelector(`.menu-item[data-section="all-clients"]`);
            if (activeMenuItem && !activeMenuItem.classList.contains('active')) {
              console.log('Re-applying active class after all-clients operations');
              const menuItems = document.querySelectorAll('.menu-item[data-section]');
              menuItems.forEach(menu => menu.classList.remove('active'));
              activeMenuItem.classList.add('active');
            }
          }, 150);
        }
      } else {
        console.error('Section not found:', `${sectionId}-section`);
      }
    }
    
    // Initialize with dashboard section
    showSection('dashboard');
  }
  
  // Dashboard Splitter Functionality
  function initializeSplitter() {
    const splitterHandle = document.getElementById('splitterHandle');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    const splitterContainer = document.querySelector('.dashboard-splitter');
    
    if (!splitterHandle || !leftPanel || !rightPanel) return;
    
    let isDragging = false;
    let startX = 0;
    let startLeftWidth = 0;
    
    splitterHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startLeftWidth = leftPanel.offsetWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      // Add overlay to prevent iframe interference
      const overlay = document.createElement('div');
      overlay.id = 'splitter-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'ew-resize';
      document.body.appendChild(overlay);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const containerWidth = splitterContainer.offsetWidth;
      const newLeftWidth = startLeftWidth + deltaX;
      const minWidth = 200;
      const maxWidth = containerWidth - 200;
      
      if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
        const leftPercent = (newLeftWidth / containerWidth) * 100;
        const rightPercent = 100 - leftPercent;
        
        leftPanel.style.flex = `0 0 ${leftPercent}%`;
        rightPanel.style.flex = `0 0 ${rightPercent}%`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Remove overlay
        const overlay = document.getElementById('splitter-overlay');
        if (overlay) {
          overlay.remove();
        }
      }
    });
  }
  
  // Dashboard Statistics Update
  function updateDashboardStats() {
    if (!window.clientsData) return;
    
    const totalClients = window.clientsData.length;
    const recentClients = window.clientsData.slice(0, 10).length; // Last 10 clients
    const uniqueVisaTypes = [...new Set(window.clientsData.map(client => client.type))].length;
    const uniqueLocations = [...new Set(window.clientsData.map(client => client.location))].length;
    
    // Update statistics
    document.getElementById('totalClients').textContent = totalClients;
    
    const recentClientsEl = document.getElementById('recentClients');
    if (recentClientsEl) {
      recentClientsEl.textContent = recentClients;
    }
    
    const visaTypesEl = document.getElementById('visaTypes');
    if (visaTypesEl) {
      visaTypesEl.textContent = uniqueVisaTypes;
    }
    
    const locationsEl = document.getElementById('locations');
    if (locationsEl) {
      locationsEl.textContent = uniqueLocations;
    }
  }



  // Global functions (moved outside initializeDashboard for accessibility)
  function updateClientsCount() {
    document.getElementById('clientsCount').textContent = `${filteredClients.length} clients`;
    // Also update the total clients count in the statistics card
    document.getElementById('totalClients').textContent = window.clientsData.length;
  }

  // Populate recent clients table
  function populateRecentClientsTable() {
    const tableBody = document.getElementById('clientsTableBody');
    if (!tableBody || !window.clientsData) return;
    
    tableBody.innerHTML = '';
    window.clientsData.slice(0, 5).forEach(client => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${client.name || 'N/A'}</td>
        <td>${client.age || 'N/A'}</td>
        <td>${client.gender || 'N/A'}</td>
        <td>${client.location || 'N/A'}</td>
        <td>${client.type || 'N/A'}</td>
        <td>${client.arrival_date ? new Date(client.arrival_date).toLocaleDateString() : 'N/A'}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Populate location filter
  function populateLocationFilter() {
    const locationFilter = document.getElementById('filterLocation');
    const currentClients = window.clientsData || [];
    const uniqueLocations = [...new Set(currentClients.map(client => client.location).filter(location => location))];
    uniqueLocations.sort();
    
    // Clear existing options except the first one
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    
    uniqueLocations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }

  // Filter clients
  function filterClients() {
    const searchTerm = document.getElementById('searchClients').value.toLowerCase();
    const genderFilter = document.getElementById('filterGender').value;
    const locationFilter = document.getElementById('filterLocation').value;
    const categoryFilter = document.getElementById('filterCategory').value;

    // Use window.clientsData to get the most up-to-date data
    const currentClients = window.clientsData || [];
    filteredClients = currentClients.filter(client => {
      const matchesSearch = !searchTerm || 
        (client.name && client.name.toLowerCase().includes(searchTerm)) ||
        (client.location && client.location.toLowerCase().includes(searchTerm)) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm));
      
      const matchesGender = !genderFilter || client.gender === genderFilter;
      const matchesLocation = !locationFilter || client.location === locationFilter;
      const matchesCategory = !categoryFilter || client.type === categoryFilter;

      return matchesSearch && matchesGender && matchesLocation && matchesCategory;
    });

    currentPage = 1;
    updateClientsCount();
    displayClients();
    updatePagination();
  }

  // Calculate display IDs for current view
  function calculateDisplayIds() {
    // Always use the frontend_id (which is already calculated as 200, 199, 198... or sorted)
    filteredClients.forEach((client, index) => {
      client.display_id = client.frontend_id;
    });
  }

  // Display clients based on pagination
  function displayClients() {
    // Calculate display IDs for current filtered/sorted view
    calculateDisplayIds();
    
    const tableBody = document.getElementById('allClientsTableBody');
    
    if (clientsPerPage === 'all') {
      const clientsToShow = filteredClients;
      renderClientsTable(clientsToShow, tableBody);
    } else {
      const itemsPerPage = parseInt(clientsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const clientsToShow = filteredClients.slice(startIndex, endIndex);
      renderClientsTable(clientsToShow, tableBody);
    }
  }

  // Helper function to render clients table
  function renderClientsTable(clientsToShow, tableBody) {

    tableBody.innerHTML = '';
    clientsToShow.forEach((client, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="form-check-input client-checkbox" value="${client.id}" data-client-id="${client.id}">
        </td>
        <td>${client.display_id}</td>
        <td>${client.name || 'N/A'}</td>
        <td>${client.age || 'N/A'}</td>
        <td>${client.gender || 'N/A'}</td>
        <td>${client.location || 'N/A'}</td>
        <td>${client.type || 'N/A'}</td>
        <td>${client.phone || 'N/A'}</td>
        <td>${client.arrival_date ? new Date(client.arrival_date).toLocaleDateString() : 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewClient(${client.id})" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning" onclick="editClient(${client.id})" title="Edit Client">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // Update selection state after rendering
    if (selectedClients.length > 0) {
      updateSelectedClients();
    }
  }

  function initializeDashboard() {
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');

  // Toggle profile dropdown
  profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
  });

  // Close profile dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove('active');
    }
  });

  // Handle profile menu items specifically
  const profileMenuItems = document.querySelectorAll('.profile-menu-item');
  profileMenuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      const text = this.textContent.trim();
      
      if (text === 'Profile Settings') {
        e.preventDefault();
        openProfileSettingsModal();
      } else if (text === 'Notifications') {
        e.preventDefault();
        toggleNotificationDropdown();
      }
      
      // Close dropdown for all items
      profileDropdown.classList.remove('active');
    });
  });

  // Notification system setup
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  // Toggle notification dropdown
  notificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleNotificationDropdown();
  });

  // Mark all notifications as read
  markAllReadBtn.addEventListener('click', function() {
    markAllNotificationsAsRead();
  });

  // Close notification dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
      notificationDropdown.classList.remove('active');
    }
  });

  // Load notifications on page load
  loadNotifications();
  
  // Refresh notifications every 30 seconds
  setInterval(loadNotifications, 30000);

  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  // Load saved theme or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
  
  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeIcon.className = 'fas fa-moon';
      themeToggle.title = 'Dark Mode (Click to switch to Light Mode)';
    } else {
      themeIcon.className = 'fas fa-sun';
      themeToggle.title = 'Light Mode (Click to switch to Dark Mode)';
    }
  }


  


  // Get data from global variables
  const clients = window.clientsData || [];
  const ageGroups = window.ageGroupsData || {};
  const genderCount = window.genderCountData || {};
  const locationCount = window.locationCountData || {};
  const visaTypeCount = window.visaTypeCountData || {};

  // Chart references
  window.ageChart = null;
  window.genderChart = null;
  window.visaTypeChart = null;

  // Initialize charts function
  function initializeCharts() {
    // Destroy existing charts if they exist
    if (window.ageChart) window.ageChart.destroy();
    if (window.genderChart) window.genderChart.destroy();
    if (window.visaTypeChart) window.visaTypeChart.destroy();

    // Recalculate data for charts from current client data
    const currentAgeGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0
    };
    const currentGenderCount = { 'Male': 0, 'Female': 0, 'Other': 0 };
    const currentVisaTypeCount = {};

    window.clientsData.forEach(client => {
      // Age grouping
      const age = client.age;
      if (age >= 18 && age <= 25) currentAgeGroups['18-25']++;
      else if (age >= 26 && age <= 35) currentAgeGroups['26-35']++;
      else if (age >= 36 && age <= 45) currentAgeGroups['36-45']++;
      else if (age >= 46 && age <= 55) currentAgeGroups['46-55']++;
      else currentAgeGroups['56+']++;

      // Gender count
      if (currentGenderCount[client.gender] !== undefined) {
        currentGenderCount[client.gender]++;
      }

      // Visa type count
      if (!currentVisaTypeCount[client.type]) {
        currentVisaTypeCount[client.type] = 0;
      }
      currentVisaTypeCount[client.type]++;
    });

  // Create Age Distribution Chart
  const ageCtx = document.getElementById('ageChart').getContext('2d');
    window.ageChart = new Chart(ageCtx, {
    type: 'doughnut',
    data: {
        labels: Object.keys(currentAgeGroups),
      datasets: [{
          data: Object.values(currentAgeGroups),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ],
        borderWidth: 2,
        borderColor: '#fff',
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      }
    },
    plugins: []
  });

  // Create Gender Distribution Chart
  const genderCtx = document.getElementById('genderChart').getContext('2d');
    window.genderChart = new Chart(genderCtx, {
    type: 'doughnut',
    data: {
        labels: Object.keys(currentGenderCount),
      datasets: [{
          data: Object.values(currentGenderCount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderWidth: 2,
        borderColor: '#fff',
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      }
    },
    plugins: []
  });

  // Create Visa Type Distribution Chart
  const visaTypeCtx = document.getElementById('visaTypeChart').getContext('2d');
    window.visaTypeChart = new Chart(visaTypeCtx, {
    type: 'doughnut',
    data: {
        labels: Object.keys(currentVisaTypeCount),
      datasets: [{
          data: Object.values(currentVisaTypeCount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF5722',
          '#607D8B'
        ],
        borderWidth: 2,
        borderColor: '#fff',
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      }
    },
    plugins: []
  });
  }

  // Enhanced dashboard refresh function
  async function refreshDashboard() {
    try {
      console.log('Starting dashboard refresh...');
      
      // Show loading state
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-content">
          <i class="fas fa-sync-alt fa-spin"></i>
          <p>Updating dashboard...</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);

      // Fetch fresh data
      const response = await fetch('../backend/check_session.php');
      const data = await response.json();

      if (data.authenticated && data.clients) {
        console.log('Fresh data received:', data.clients.length, 'clients');
        
        // Update global data
        window.clientsData = data.clients;
        
        // Add frontend IDs - simple countdown system
        // Backend orders by id DESC (newest first), so index 0 = newest client
        window.clientsData.forEach((client, index) => {
          // Frontend ID: newest client gets highest number (200), oldest gets lowest (1)
          client.frontend_id = window.clientsData.length - index;
          client.original_order = index; // Store original order for sorting
        });
        
        window.totalClients = data.totalClients;
        window.ageGroups = data.ageGroups;
        window.genderCounts = data.genderCounts;
        window.locationCounts = data.locationCounts;
        window.visaTypeCounts = data.visaTypeCounts;

        // Update filteredClients to reflect new data
        filteredClients = [...window.clientsData];

        // Update total clients count
        updateClientsCount();
        
        // Refresh display
        displayClients();
        updatePagination();

        // Refresh charts
        initializeCharts();

        // Reset ALL form elements and selections
        const searchInput = document.getElementById('searchClients');
        const genderFilter = document.getElementById('filterGender');
        const locationFilter = document.getElementById('filterLocation');
        const categoryFilter = document.getElementById('filterCategory');
        const selectAllCheckbox = document.getElementById('selectAll');
        
        if (searchInput) searchInput.value = '';
        if (genderFilter) genderFilter.value = '';
        if (locationFilter) locationFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        
        // Reset pagination and selection
        currentPage = 1;
        selectedClients = [];

        // Clear ALL selection checkboxes
        if (selectAllCheckbox) {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = false;
        }
        
        // Clear individual client checkboxes
        const clientCheckboxes = document.querySelectorAll('.client-checkbox');
        clientCheckboxes.forEach(checkbox => {
          checkbox.checked = false;
        });

        // Repopulate location filter with fresh data
        populateLocationFilter();

        // Refresh the table display
        filterClients();

        // Update selection UI
        updateSelectedClients();
        
        console.log('Dashboard refresh completed successfully');
      } else {
        console.error('Failed to fetch dashboard data or not authenticated');
        throw new Error('Authentication failed or no data received');
      }

      // Remove loading overlay
      setTimeout(() => {
        if (document.body.contains(loadingOverlay)) {
          document.body.removeChild(loadingOverlay);
        }
      }, 300);

    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      
      // Remove loading overlay if it exists
      const overlay = document.querySelector('.loading-overlay');
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      
      // Re-throw the error so the caller can handle it
      throw error;
    }
  }

  // Initialize charts on first load
  initializeCharts();

  // Client Management Variables (filteredClients already declared globally)
  currentPage = 1;
  clientsPerPage = 10;
  sortColumn = '';             // No column selected initially
  sortDirection = 'asc';       // Default direction for when user clicks

  // Update clients count
  function updateClientsCount() {
    document.getElementById('clientsCount').textContent = `${filteredClients.length} clients`;
    // Also update the total clients count in the statistics card
    document.getElementById('totalClients').textContent = window.clientsData.length;
  }

  // Populate location filter
  function populateLocationFilter() {
    const locationFilter = document.getElementById('filterLocation');
    const currentClients = window.clientsData || [];
    const uniqueLocations = [...new Set(currentClients.map(client => client.location).filter(location => location))];
    uniqueLocations.sort();
    
    // Clear existing options except the first one
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    
    uniqueLocations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }

  // Sort clients
  function sortClients(column) {
    // Toggle direction if same column, otherwise set to ascending
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }

    // Update sort icons
    document.querySelectorAll('.sortable').forEach(th => {
      th.classList.remove('asc', 'desc');
    });
    
    const currentHeader = document.querySelector(`[data-column="${column}"]`);
    currentHeader.classList.add(sortDirection);

    // Sort the filtered clients array
    filteredClients.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle different data types
      if (column === 'age' || column === 'frontend_id') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (column === 'arrival_date') {
        aVal = new Date(aVal || '1970-01-01');
        bVal = new Date(bVal || '1970-01-01');
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });



    // Reset to first page and redisplay
    currentPage = 1;
    displayClients();
    updatePagination();
  }

  // Update pagination
  function updatePagination() {
    const paginationNav = document.querySelector('#paginationNav .pagination');
    
    if (clientsPerPage === 'all') {
      paginationNav.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(filteredClients.length / parseInt(clientsPerPage));
    
    if (totalPages <= 1) {
      paginationNav.innerHTML = '';
      return;
    }

    paginationNav.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-link';
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) changePage(currentPage - 1);
    });
    prevLi.appendChild(prevBtn);
    paginationNav.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-link';
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', (e) => {
          e.preventDefault();
          changePage(i);
        });
        pageLi.appendChild(pageBtn);
        paginationNav.appendChild(pageLi);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        const ellipsisLi = document.createElement('li');
        ellipsisLi.className = 'page-item disabled';
        const ellipsisSpan = document.createElement('span');
        ellipsisSpan.className = 'page-link';
        ellipsisSpan.textContent = '...';
        ellipsisLi.appendChild(ellipsisSpan);
        paginationNav.appendChild(ellipsisLi);
      }
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-link';
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) changePage(currentPage + 1);
    });
    nextLi.appendChild(nextBtn);
    paginationNav.appendChild(nextLi);
  }

  // Change page
  function changePage(page) {
    const totalPages = Math.ceil(filteredClients.length / parseInt(clientsPerPage));
    
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      currentPage = page;
      
      // Smooth scroll to All Clients section header
      const allClientsSection = document.getElementById('all-clients-section');
      if (allClientsSection) {
        allClientsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      
      // Add loading effect
      const tableBody = document.getElementById('allClientsTableBody');
      tableBody.style.opacity = '0.5';
      
      // Small delay for visual feedback
      setTimeout(() => {
        displayClients();
        updatePagination();
        tableBody.style.opacity = '1';
      }, 100);
    }
  }

  // View client function
  window.viewClient = function(clientId) {
    const client = clients.find(c => c.id == clientId);
    if (client) {
      showClientModal(client);
    }
  };

  // Show client details modal
  function showClientModal(client) {
    const modal = document.getElementById('clientModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    // Set modal title
    modalTitle.textContent = `${client.name} - Client Details`;

    // Create client details HTML
    const details = [
      { icon: 'fas fa-id-card', label: 'Client ID', value: client.id },
      { icon: 'fas fa-user', label: 'Full Name', value: client.name },
      { icon: 'fas fa-birthday-cake', label: 'Age', value: client.age },
      { icon: 'fas fa-calendar-alt', label: 'Date of Birth', value: client.dob ? new Date(client.dob).toLocaleDateString() : null },
      { icon: 'fas fa-venus-mars', label: 'Gender', value: client.gender },
      { icon: 'fas fa-map-marker-alt', label: 'Location', value: client.location },
      { icon: 'fas fa-passport', label: 'Visa Type', value: client.type },
      { icon: 'fas fa-phone', label: 'Phone Number', value: client.phone },
      { icon: 'fas fa-plane-departure', label: 'Myanmar Departure Date', value: client.arrival_date ? new Date(client.arrival_date).toLocaleDateString() : null },
      { icon: 'fas fa-plane-arrival', label: 'US Arrival Date', value: client.us_arrival_date ? new Date(client.us_arrival_date).toLocaleDateString() : null },
      { icon: 'fas fa-calendar-times', label: 'Visa Expiry', value: client.visa_expiry_date ? new Date(client.visa_expiry_date).toLocaleDateString() : null },
      { icon: 'fas fa-sticky-note', label: 'Notes', value: client.note }
    ];

    // Generate HTML for client details
    modalBody.innerHTML = details.map(detail => {
      const value = detail.value || 'Not provided';
      const isEmpty = !detail.value;
      return `
        <div class="client-detail">
          <div class="detail-icon">
            <i class="${detail.icon}"></i>
          </div>
          <div class="detail-content">
            <div class="detail-label">${detail.label}</div>
            <div class="detail-value ${isEmpty ? 'empty' : ''}">${value}</div>
          </div>
        </div>
      `;
    }).join('');

    // Show modal
    modal.classList.add('active');
  }

  // Close modal function
  function closeClientModal() {
    const modal = document.getElementById('clientModal');
    modal.classList.remove('active');
  }

  // Edit client function
  window.editClient = function(clientId) {
    const client = window.clientsData.find(c => c.id == clientId);
    if (client) {
      openEditClientModal(client);
    } else {
      showErrorModal('Client Not Found', 'Could not find client data for editing.');
    }
  };

  // Open edit client modal and populate with current data
  function openEditClientModal(client) {
    const modal = document.getElementById('editClientModal');
    const form = document.getElementById('editClientForm');
    const closeBtn = document.getElementById('editClientModalClose');
    const cancelBtn = document.getElementById('editClientCancel');
    const saveBtn = document.getElementById('editClientSave');
    
    // Populate form fields with current client data
    document.getElementById('editClientId').value = client.id;
    document.getElementById('editClientName').value = client.name || '';
    document.getElementById('editClientAge').value = client.age || '';
    document.getElementById('editClientGender').value = client.gender || '';
    document.getElementById('editClientDob').value = client.dob || '';
    document.getElementById('editClientLocation').value = client.location || '';
    document.getElementById('editClientVisaType').value = client.type || '';
    document.getElementById('editClientPhone').value = client.phone || '';
    document.getElementById('editClientArrivalDate').value = client.arrival_date || '';
    document.getElementById('editClientUsArrivalDate').value = client.us_arrival_date || '';
    document.getElementById('editClientVisaExpiry').value = client.visa_expiry_date || '';
    document.getElementById('editClientNote').value = client.note || '';
    
    // Clear any previous validation styling
    clearEditFormValidation();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => {
      document.getElementById('editClientName').focus();
    }, 300);
    
    // Close handlers
    closeBtn.onclick = () => hideEditClientModal();
    cancelBtn.onclick = () => hideEditClientModal();
    
    // Save button handler - show confirmation modal
    saveBtn.onclick = () => {
      if (validateEditForm()) {
        showSaveConfirmationModal();
      }
    };
    
    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        hideEditClientModal();
      }
    };
  }

  function hideEditClientModal() {
    const modal = document.getElementById('editClientModal');
    modal.style.display = 'none';
  }

  function clearEditFormValidation() {
    const formGroups = document.querySelectorAll('#editClientForm .form-group');
    formGroups.forEach(group => {
      group.classList.remove('error', 'success');
      const errorMsg = group.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.remove();
      }
    });
  }

  function validateEditForm() {
    let isValid = true;
    const requiredFields = [
      { id: 'editClientName', name: 'Full Name' },
      { id: 'editClientAge', name: 'Age' },
      { id: 'editClientGender', name: 'Gender' },
      { id: 'editClientLocation', name: 'Location' },
      { id: 'editClientVisaType', name: 'Visa Type' }
    ];

    clearEditFormValidation();

    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      const formGroup = input.closest('.form-group');
      const value = input.value.trim();

      if (!value) {
        showEditFieldError(formGroup, `${field.name} is required`);
        isValid = false;
      } else {
        formGroup.classList.add('success');
      }
    });

    // Additional validations
    const age = document.getElementById('editClientAge').value;
    if (age && (age < 1 || age > 120)) {
      const formGroup = document.getElementById('editClientAge').closest('.form-group');
      showEditFieldError(formGroup, 'Age must be between 1 and 120');
      isValid = false;
    }

    const phone = document.getElementById('editClientPhone').value;
    if (phone && !isValidPhone(phone)) {
      const formGroup = document.getElementById('editClientPhone').closest('.form-group');
      showEditFieldError(formGroup, 'Please enter a valid phone number');
      isValid = false;
    }

    return isValid;
  }

  function showEditFieldError(formGroup, message) {
    formGroup.classList.add('error');
    formGroup.classList.remove('success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorDiv);
  }

  // Show save confirmation modal
  function showSaveConfirmationModal() {
    const modal = document.getElementById('saveConfirmationModal');
    const cancelBtn = document.getElementById('saveConfirmationCancel');
    const okayBtn = document.getElementById('saveConfirmationOkay');
    
    modal.style.display = 'flex';
    
    // Handle cancel
    cancelBtn.onclick = function() {
      hideSaveConfirmationModal();
    };
    
    // Handle okay - proceed with save
    okayBtn.onclick = function() {
      hideSaveConfirmationModal();
      performClientUpdate();
    };
    
    // Close on overlay click
    modal.onclick = function(e) {
      if (e.target === modal) {
        hideSaveConfirmationModal();
      }
    };
  }

  function hideSaveConfirmationModal() {
    const modal = document.getElementById('saveConfirmationModal');
    modal.style.display = 'none';
  }

  // Perform the actual client update
  async function performClientUpdate() {
    try {
      const form = document.getElementById('editClientForm');
      const formData = new FormData(form);
      const clientData = Object.fromEntries(formData.entries());
      
      console.log('Updating client with data:', clientData);
      
      // Show loading state on save button
      const saveBtn = document.getElementById('editClientSave');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
      saveBtn.disabled = true;
      
      const response = await fetch('../backend/edit_client.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('Parsed result:', result);

      if (result.success) {
        hideEditClientModal();
        
        // Update the client in global data
        const clientIndex = window.clientsData.findIndex(c => c.id == clientData.id);
        if (clientIndex !== -1) {
          // Preserve the frontend_id and original_order
          const updatedClient = result.client;
          updatedClient.frontend_id = window.clientsData[clientIndex].frontend_id;
          updatedClient.original_order = window.clientsData[clientIndex].original_order;
          window.clientsData[clientIndex] = updatedClient;
        }
        
        // Refresh only the affected client row (selective refresh)
        refreshClientRow(clientData.id, result.client);
        
        // Show success message
        showSuccessModal(`Client "${clientData.name}" updated successfully!`);
        
      } else {
        console.error('Update client failed:', result.message);
        showErrorModal('Update Failed', result.message);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      showErrorModal('Network Error', `Unable to update client. Please try again. Error: ${error.message}`);
    } finally {
      // Restore button state
      const saveBtn = document.getElementById('editClientSave');
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Edit';
        saveBtn.disabled = false;
      }
    }
  }

  // Selective refresh - update only the specific client row
  function refreshClientRow(clientId, updatedClient) {
    try {
      // Find the table row for this client
      const clientCheckbox = document.querySelector(`input[data-client-id="${clientId}"]`);
      if (!clientCheckbox) {
        console.log('Client row not found, performing full refresh');
        filterClients(); // Fallback to full table refresh
        return;
      }
      
      const row = clientCheckbox.closest('tr');
      if (!row) {
        console.log('Table row not found, performing full refresh');
        filterClients(); // Fallback to full table refresh
        return;
      }
      
      // Get the frontend_id from the global data
      const clientInData = window.clientsData.find(c => c.id == clientId);
      const displayId = clientInData ? clientInData.frontend_id : clientId;
      
      // Update the row content
      row.innerHTML = `
        <td>
          <input type="checkbox" class="form-check-input client-checkbox" value="${updatedClient.id}" data-client-id="${updatedClient.id}">
        </td>
        <td>${displayId}</td>
        <td>${updatedClient.name || 'N/A'}</td>
        <td>${updatedClient.age || 'N/A'}</td>
        <td>${updatedClient.gender || 'N/A'}</td>
        <td>${updatedClient.location || 'N/A'}</td>
        <td>${updatedClient.type || 'N/A'}</td>
        <td>${updatedClient.phone || 'N/A'}</td>
        <td>${updatedClient.arrival_date ? new Date(updatedClient.arrival_date).toLocaleDateString() : 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewClient(${updatedClient.id})" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning" onclick="editClient(${updatedClient.id})" title="Edit Client">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      
      // Add a brief highlight effect to show the row was updated
      row.style.backgroundColor = '#d4edda';
      setTimeout(() => {
        row.style.backgroundColor = '';
      }, 2000);
      
      console.log('Client row updated successfully');
      
    } catch (error) {
      console.error('Error refreshing client row:', error);
      // Fallback to full table refresh
      filterClients();
    }
  }

  // Event listeners
  document.getElementById('clientsPerPage').addEventListener('change', function() {
    clientsPerPage = this.value; // Keep as string to handle 'all' option
    currentPage = 1;
    displayClients();
    updatePagination();
  });

  document.getElementById('searchClients').addEventListener('input', filterClients);
  document.getElementById('filterGender').addEventListener('change', filterClients);
  document.getElementById('filterLocation').addEventListener('change', filterClients);
  document.getElementById('filterCategory').addEventListener('change', filterClients);

  document.getElementById('resetFilters').addEventListener('click', function() {
    document.getElementById('searchClients').value = '';
    document.getElementById('filterGender').value = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('filterCategory').value = '';
    filterClients();
  });

  // Initialize recent clients table on first load
  populateRecentClientsTable();

  // Add sorting event listeners
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', function() {
      const column = this.getAttribute('data-column');
      sortClients(column);
    });
  });

  // Modal event listeners
  document.getElementById('modalClose').addEventListener('click', closeClientModal);
  document.getElementById('modalOkBtn').addEventListener('click', closeClientModal);
  document.getElementById('clientModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeClientModal();
    }
  });

  // Initialize client management
  populateLocationFilter();
  updateClientsCount();
  displayClients();
  updatePagination();
  setupSelectionHandlers();
  
  // Don't show any column as selected by default
  // The ID sorting works correctly (200, 199, 198...) but visually looks unselected
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });
  // Profile Settings Functions
  async function openProfileSettingsModal() {
    try {
      // Fetch current profile data
      const response = await fetch('../backend/get_profile.php');
      const result = await response.json();
      
      if (result.success) {
        const modal = document.getElementById('profileSettingsModal');
        const form = document.getElementById('profileSettingsForm');
        const closeBtn = document.getElementById('profileSettingsModalClose');
        const cancelBtn = document.getElementById('profileSettingsCancel');
        const saveBtn = document.getElementById('profileSettingsSave');
        
        // Populate form with current admin name
        document.getElementById('adminName').value = result.admin.username || '';
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Clear any previous validation styling
        clearProfileFormValidation();
        
        // Show modal
        modal.style.display = 'flex';
        
        // Focus on admin name field
        setTimeout(() => {
          document.getElementById('adminName').focus();
        }, 300);
        
        // Close handlers
        closeBtn.onclick = () => hideProfileSettingsModal();
        cancelBtn.onclick = () => hideProfileSettingsModal();
        
        // Save button handler
        saveBtn.onclick = () => {
          if (validateProfileForm()) {
            showProfileSaveConfirmationModal();
          }
        };
        
        // Close on overlay click
        modal.onclick = (e) => {
          if (e.target === modal) {
            hideProfileSettingsModal();
          }
        };
        
      } else {
        showErrorModal('Profile Error', 'Could not load profile data');
      }
    } catch (error) {
      console.error('Error opening profile settings:', error);
      showErrorModal('Network Error', 'Unable to load profile settings');
    }
  }

  function hideProfileSettingsModal() {
    const modal = document.getElementById('profileSettingsModal');
    modal.style.display = 'none';
  }

  function clearProfileFormValidation() {
    const formGroups = document.querySelectorAll('#profileSettingsForm .form-group');
    formGroups.forEach(group => {
      group.classList.remove('error', 'success');
      const errorMsg = group.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.remove();
      }
    });
  }

  function validateProfileForm() {
    let isValid = true;
    clearProfileFormValidation();
    
    const adminName = document.getElementById('adminName').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate admin name
    if (!adminName) {
      showProfileFieldError(document.getElementById('adminName').closest('.form-group'), 'Admin name is required');
      isValid = false;
    } else if (adminName.length < 2) {
      showProfileFieldError(document.getElementById('adminName').closest('.form-group'), 'Admin name must be at least 2 characters long');
      isValid = false;
    } else {
      document.getElementById('adminName').closest('.form-group').classList.add('success');
    }
    
    // Validate password fields (only if user is trying to change password)
    const isChangingPassword = currentPassword || newPassword || confirmPassword;
    
    if (isChangingPassword) {
      if (!currentPassword) {
        showProfileFieldError(document.getElementById('currentPassword').closest('.form-group'), 'Current password is required');
        isValid = false;
      } else {
        document.getElementById('currentPassword').closest('.form-group').classList.add('success');
      }
      
      if (!newPassword) {
        showProfileFieldError(document.getElementById('newPassword').closest('.form-group'), 'New password is required');
        isValid = false;
      } else if (newPassword.length < 6) {
        showProfileFieldError(document.getElementById('newPassword').closest('.form-group'), 'New password must be at least 6 characters long');
        isValid = false;
      } else {
        document.getElementById('newPassword').closest('.form-group').classList.add('success');
      }
      
      if (!confirmPassword) {
        showProfileFieldError(document.getElementById('confirmPassword').closest('.form-group'), 'Please confirm new password');
        isValid = false;
      } else if (newPassword !== confirmPassword) {
        showProfileFieldError(document.getElementById('confirmPassword').closest('.form-group'), 'Passwords do not match');
        isValid = false;
      } else {
        document.getElementById('confirmPassword').closest('.form-group').classList.add('success');
      }
    }
    
    return isValid;
  }

  function showProfileFieldError(formGroup, message) {
    formGroup.classList.add('error');
    formGroup.classList.remove('success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorDiv);
  }

  function showProfileSaveConfirmationModal() {
    const modal = document.getElementById('profileSaveConfirmationModal');
    const cancelBtn = document.getElementById('profileSaveConfirmationCancel');
    const okayBtn = document.getElementById('profileSaveConfirmationOkay');
    
    modal.style.display = 'flex';
    
    // Handle cancel
    cancelBtn.onclick = function() {
      hideProfileSaveConfirmationModal();
    };
    
    // Handle okay - proceed with save
    okayBtn.onclick = function() {
      hideProfileSaveConfirmationModal();
      performProfileUpdate();
    };
    
    // Close on overlay click
    modal.onclick = function(e) {
      if (e.target === modal) {
        hideProfileSaveConfirmationModal();
      }
    };
  }

  function hideProfileSaveConfirmationModal() {
    const modal = document.getElementById('profileSaveConfirmationModal');
    modal.style.display = 'none';
  }

  async function performProfileUpdate() {
    try {
      const form = document.getElementById('profileSettingsForm');
      const formData = new FormData(form);
      const profileData = Object.fromEntries(formData.entries());
      
      // Only include password fields if they have values
      const updateData = {
        name: profileData.name
      };
      
      if (profileData.current_password) {
        updateData.current_password = profileData.current_password;
        updateData.new_password = profileData.new_password;
        updateData.confirm_password = profileData.confirm_password;
      }
      
      console.log('Updating profile with data:', updateData);
      
      // Show loading state on save button
      const saveBtn = document.getElementById('profileSettingsSave');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
      saveBtn.disabled = true;
      
      const response = await fetch('../backend/update_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('Parsed result:', result);

      if (result.success) {
        hideProfileSettingsModal();
        
        // Show success message and auto-logout
        let message = 'Profile updated successfully! Redirecting to login...';
        
        showSuccessModal(message, function() {
          // Auto-logout and redirect after success modal is closed
          performAutoLogout();
        });
        
        // Also auto-logout after 2 seconds even if user doesn't click the modal
        setTimeout(() => {
          performAutoLogout();
        }, 2000);
        
      } else {
        console.error('Update profile failed:', result.message);
        showErrorModal('Update Failed', result.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorModal('Network Error', `Unable to update profile. Please try again. Error: ${error.message}`);
    } finally {
      // Restore button state
      const saveBtn = document.getElementById('profileSettingsSave');
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Changes';
        saveBtn.disabled = false;
      }
    }
  }

  // Notification system functions
  async function loadNotifications() {
    try {
      const response = await fetch('../backend/get_notifications.php');
      const result = await response.json();
      
      if (result.success) {
        window.notificationsData = result.notifications;
        updateNotificationBadge(result.unreadCount);
        renderNotifications(result.notifications);
      } else {
        console.error('Failed to load notifications:', result.message);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('active');
    
    // Close profile dropdown if open
    const profileDropdown = document.getElementById('profileDropdown');
    profileDropdown.classList.remove('active');
  }

  function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications</p>
        </div>
      `;
      return;
    }

    notificationList.innerHTML = notifications.map(notification => `
      <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
           data-notification-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-icon ${notification.type}">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
          </div>
          <div class="notification-text">
            <h6 class="notification-title">${notification.title}</h6>
            <p class="notification-message">${notification.message}</p>
            <small class="notification-time">${formatNotificationTime(notification.created_at)}</small>
          </div>
          ${!notification.is_read ? `
            <button class="mark-read-btn" onclick="markNotificationAsRead(${notification.id})">
              <i class="fas fa-check"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'error': return 'fa-times-circle';
      default: return 'fa-info-circle';
    }
  }

  function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Global function for marking single notification as read
  window.markNotificationAsRead = async function(notificationId) {
    try {
      const response = await fetch('../backend/mark_notification_read.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: notificationId })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the notification in our data
        if (window.notificationsData) {
          const notification = window.notificationsData.find(n => n.id == notificationId);
          if (notification) {
            notification.is_read = 1;
            notification.read_at = new Date().toISOString();
          }
        }
        
        // Update the UI
        updateNotificationBadge(result.unreadCount);
        const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationElement) {
          notificationElement.classList.remove('unread');
          notificationElement.classList.add('read');
          const markReadBtn = notificationElement.querySelector('.mark-read-btn');
          if (markReadBtn) {
            markReadBtn.remove();
          }
        }
      } else {
        console.error('Failed to mark notification as read:', result.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  async function markAllNotificationsAsRead() {
    try {
      const response = await fetch('../backend/mark_all_notifications_read.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Update all notifications in our data
        if (window.notificationsData) {
          window.notificationsData.forEach(notification => {
            notification.is_read = 1;
            notification.read_at = new Date().toISOString();
          });
        }
        
        // Update the UI
        updateNotificationBadge(0);
        const notificationItems = document.querySelectorAll('.notification-item');
        notificationItems.forEach(item => {
          item.classList.remove('unread');
          item.classList.add('read');
          const markReadBtn = item.querySelector('.mark-read-btn');
          if (markReadBtn) {
            markReadBtn.remove();
          }
        });
        
        showSuccessModal(`${result.markedCount} notifications marked as read!`);
      } else {
        console.error('Failed to mark all notifications as read:', result.message);
        showErrorModal('Error', 'Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showErrorModal('Network Error', 'Unable to mark notifications as read');
    }
  }

  // Auto-logout function for profile updates
  async function performAutoLogout() {
    try {
      console.log('Performing auto-logout after profile update...');
      
      // Clear any local session data
      if (window.clientsData) {
        window.clientsData = null;
      }
      
      // Call the logout endpoint to clear server-side session
      await fetch('../backend/logout.php', {
        method: 'GET',
        credentials: 'include' // Include cookies
      });
      
      // Clear all cookies by setting them to expire
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Additional cookie clearing for common PHP session cookies
      document.cookie = 'PHPSESSID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      console.log('Logout completed, redirecting to login...');
      
      // Small delay to ensure logout is processed
      setTimeout(() => {
        window.location.href = './login.html';
      }, 500);
      
    } catch (error) {
      console.error('Error during auto-logout:', error);
      // Fallback: still redirect even if logout call fails
      window.location.href = './login.html';
    }
  }

  } // End of initializeDashboard function

  // Selection handling functions  
  function setupSelectionHandlers() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const dynamicActionBtn = document.getElementById('dynamicActionBtn');

    // Handle select all checkbox
    selectAllCheckbox.addEventListener('change', function() {
      const clientCheckboxes = document.querySelectorAll('.client-checkbox');
      clientCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
      updateSelectedClients();
    });

    // Handle individual client selection change
    document.addEventListener('change', function(e) {
      if (e.target.classList.contains('client-checkbox')) {
        updateSelectedClients();
      }
    });

      // Dynamic action button click - handles both add and delete based on current state
  dynamicActionBtn.addEventListener('click', function() {
    const selectedClients = document.querySelectorAll('.client-checkbox:checked');
    if (selectedClients.length > 0) {
      deleteSelectedClients();
    } else {
    openAddClientModal();
    }
  });

  // Initialize add client modal handlers
  initializeAddClientModal();
  
  // Initialize hamburger button functionality
  initializeHamburgerButton();
}

  function updateSelectedClients() {
    const clientCheckboxes = document.querySelectorAll('.client-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAll');
    const dynamicActionBtn = document.getElementById('dynamicActionBtn');
    
    selectedClients = Array.from(clientCheckboxes).map(cb => cb.getAttribute('data-client-id'));
    
    // Update select all checkbox state
    const totalCheckboxes = document.querySelectorAll('.client-checkbox').length;
    if (selectedClients.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (selectedClients.length === totalCheckboxes) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }

    // Update dynamic button based on selection state
    if (selectedClients.length > 0) {
      // Change to delete mode
      dynamicActionBtn.className = 'btn btn-danger w-100';
      dynamicActionBtn.innerHTML = `<i class="fas fa-trash-alt me-1"></i>Delete Selected (${selectedClients.length})`;
    } else {
      // Change to add mode
      dynamicActionBtn.className = 'btn btn-success w-100';
      dynamicActionBtn.innerHTML = '<i class="fas fa-user-plus me-1"></i>Add Client';
    }
  }

  function initializeHamburgerButton() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (hamburgerBtn && sidebar) {
      hamburgerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle sidebar
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
        
        console.log('Hamburger clicked - Sidebar active:', sidebar.classList.contains('active'));
      });
      
      // Close sidebar when clicking overlay
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
          sidebar.classList.remove('active');
          sidebarOverlay.classList.remove('active');
          document.body.classList.remove('sidebar-open');
        });
      }
      
      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
          if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
          }
        }
      });
    }
  }

  function initializeAddClientModal() {
    const modal = document.getElementById('addClientModal');
    const form = document.getElementById('addClientForm');
    const closeBtn = document.getElementById('addClientModalClose');
    const cancelBtn = document.getElementById('addClientCancel');
    
    // Set up event listeners once
    closeBtn.addEventListener('click', hideAddClientModal);
    cancelBtn.addEventListener('click', hideAddClientModal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideAddClientModal();
      }
    });
    
    // Form submission
    form.addEventListener('submit', handleAddClientSubmit);
  }

  function openAddClientModal() {
    const modal = document.getElementById('addClientModal');
    const form = document.getElementById('addClientForm');
    
    // Reset form
    form.reset();
    clearFormValidation();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => {
      document.getElementById('clientName').focus();
    }, 300);
  }

  function hideAddClientModal() {
    const modal = document.getElementById('addClientModal');
    modal.style.display = 'none';
  }

  function clearFormValidation() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
      group.classList.remove('error', 'success');
      const errorMsg = group.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.remove();
      }
    });
  }

  function validateForm() {
    let isValid = true;
    const requiredFields = [
      { id: 'clientName', name: 'Full Name' },
      { id: 'clientAge', name: 'Age' },
      { id: 'clientGender', name: 'Gender' },
      { id: 'clientLocation', name: 'Location' },
      { id: 'clientVisaType', name: 'Visa Type' }
    ];

    clearFormValidation();

    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      const formGroup = input.closest('.form-group');
      const value = input.value.trim();

      if (!value) {
        showFieldError(formGroup, `${field.name} is required`);
        isValid = false;
      } else {
        formGroup.classList.add('success');
      }
    });

    // Additional validations
    const age = document.getElementById('clientAge').value;
    if (age && (age < 1 || age > 120)) {
      const formGroup = document.getElementById('clientAge').closest('.form-group');
      showFieldError(formGroup, 'Age must be between 1 and 120');
      isValid = false;
    }

    const phone = document.getElementById('clientPhone').value;
    if (phone && !isValidPhone(phone)) {
      const formGroup = document.getElementById('clientPhone').closest('.form-group');
      showFieldError(formGroup, 'Please enter a valid phone number');
      isValid = false;
    }

    return isValid;
  }

  function showFieldError(formGroup, message) {
    formGroup.classList.add('error');
    formGroup.classList.remove('success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorDiv);
  }

  function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  async function handleAddClientSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    
    // Debug: Log the data being sent
    console.log('Form data being sent:', clientData);
    
    // Show loading state
    const submitBtn = document.querySelector('.btn-add-client');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';
    submitBtn.disabled = true;

    try {
      console.log('Sending request to add_client.php...');
      const response = await fetch('../backend/add_client.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('Parsed result:', result);

      if (result.success) {
        hideAddClientModal();
        
        // Show success modal with refresh callback
        showSuccessModal(`Client "${clientData.name}" added successfully!`, function() {
          // Simple page reload to ensure everything refreshes properly
          console.log('Add client success modal closed - reloading page for complete refresh...');
          window.location.reload();
        });
      } else {
        console.error('Add client failed:', result.message);
        showErrorModal('Add Client Failed', result.message);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      showErrorModal('Network Error', `Unable to add client. Please try again. Error: ${error.message}`);
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }



  function deleteSelectedClients() {
    if (selectedClients.length === 0) return;

    // Show beautiful confirmation modal
    showConfirmationModal(selectedClients.length);
  }

  // Modal functions
  function showConfirmationModal(titleOrCount, message = null, details = null, customAction = null) {
    const modal = document.getElementById('confirmationModal');
    const titleEl = document.getElementById('confirmationTitle');
    const messageEl = document.getElementById('confirmationMessage');
    const detailsEl = document.querySelector('.confirmation-details');
    const confirmBtn = document.getElementById('confirmationConfirm');
    const cancelBtn = document.getElementById('confirmationCancel');
    
    // Handle both old and new calling patterns
    if (typeof titleOrCount === 'number') {
      // Old pattern: showConfirmationModal(count)
      titleEl.textContent = 'Confirm Deletion';
      messageEl.textContent = `Are you sure you want to delete ${titleOrCount} client(s)?`;
      detailsEl.innerHTML = '<i class="fas fa-info-circle"></i> This action cannot be undone.';
      customAction = performDeletion;
    } else {
      // New pattern: showConfirmationModal(title, message, details, action)
      titleEl.textContent = titleOrCount;
      messageEl.textContent = message;
      if (details) {
        detailsEl.innerHTML = `<i class="fas fa-info-circle"></i> ${details}`;
      } else {
        detailsEl.innerHTML = '<i class="fas fa-info-circle"></i> This action cannot be undone.';
      }
    }
    
    modal.style.display = 'flex';
    
    // Handle confirmation
    confirmBtn.onclick = function() {
      hideConfirmationModal();
      if (customAction) {
        customAction();
      }
    };
    
    // Handle cancel
    cancelBtn.onclick = function() {
      hideConfirmationModal();
    };
    
    // Close on overlay click
    modal.onclick = function(e) {
      if (e.target === modal) {
        hideConfirmationModal();
      }
    };
  }

  function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
  }

  function showSuccessModal(message, onCloseCallback = null) {
    const modal = document.getElementById('successModal');
    const messageEl = document.getElementById('successMessage');
    const okBtn = document.getElementById('successOk');
    
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    // Handle OK button
    okBtn.onclick = function() {
      hideSuccessModal();
      // Execute callback after modal is hidden
      if (onCloseCallback && typeof onCloseCallback === 'function') {
        setTimeout(() => {
          onCloseCallback();
        }, 100); // Small delay to ensure modal is hidden first
      }
    };
    
    // Close on overlay click
    modal.onclick = function(e) {
      if (e.target === modal) {
        hideSuccessModal();
        // Execute callback after modal is hidden
        if (onCloseCallback && typeof onCloseCallback === 'function') {
          setTimeout(() => {
            onCloseCallback();
          }, 100);
        }
      }
    };
    
    // No auto-close - user must click "Got it" to close
  }

  function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
  }

  function showErrorModal(title, message, details = null, showRetry = false) {
    const modal = document.getElementById('errorModal');
    const titleEl = document.getElementById('errorTitle');
    const messageEl = document.getElementById('errorMessage');
    const detailsEl = document.getElementById('errorDetails');
    const detailsContentEl = document.getElementById('errorDetailsContent');
    const retryBtn = document.getElementById('errorRetry');
    const okBtn = document.getElementById('errorOk');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Show/hide technical details
    if (details) {
      detailsContentEl.textContent = details;
      detailsEl.style.display = 'block';
    } else {
      detailsEl.style.display = 'none';
    }
    
    // Show/hide retry button
    if (showRetry) {
      retryBtn.style.display = 'inline-block';
      retryBtn.onclick = function() {
        hideErrorModal();
        // Retry the deletion
        performDeletion();
      };
    } else {
      retryBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
    
    // Handle OK button
    okBtn.onclick = function() {
      hideErrorModal();
    };
    
    // Close on overlay click
    modal.onclick = function(e) {
      if (e.target === modal) {
        hideErrorModal();
      }
    };
  }

  function hideErrorModal() {
    const modal = document.getElementById('errorModal');
    modal.style.display = 'none';
  }

  async function performDeletion() {
    let operationCompleted = false;
    
    try {
      // Ensure client IDs are properly formatted as integers
      const clientIdsToDelete = selectedClients.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      
      if (clientIdsToDelete.length === 0) {
        showErrorModal('Invalid Selection', 'No valid client IDs selected for deletion.');
        return;
      }

      console.log('Starting deletion process...');
      console.log('Selected clients:', selectedClients);
      console.log('Client IDs to delete:', clientIdsToDelete);

      console.log('Making API call to delete_clients.php...');
      
      const response = await fetch('../backend/delete_clients.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientIds: clientIdsToDelete
        })
      });

      console.log('Response received:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (!response.ok) {
        console.error('HTTP error response:', responseText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed result:', result);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (result.success) {
        operationCompleted = true;
        console.log('Deletion successful!', result);
        
        // Immediately clear selections and update UI
        selectedClients = [];
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = false;
        }
        
        // Clear individual client checkboxes
        const clientCheckboxes = document.querySelectorAll('.client-checkbox');
        clientCheckboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
        
        // Update button visibility immediately
        updateSelectedClients();
        
        // Show success modal with refresh callback
        showSuccessModal(`${result.deletedCount} client(s) deleted successfully!`, function() {
          // Simple page reload to ensure everything refreshes properly
          console.log('Success modal closed - reloading page for complete refresh...');
          window.location.reload();
        });
        
      } else {
        showErrorModal('Delete Failed', result.message, result.error_details);
      }
    } catch (error) {
      // Only show error if operation didn't complete successfully
      if (!operationCompleted) {
        console.error('Error deleting clients:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          selectedClients: selectedClients
        });
        showErrorModal('Network Error', 'Unable to connect to the server. Please check your connection and try again.', `Error: ${error.message}\n\nSelected clients: ${selectedClients.join(', ')}`);
      } else {
        console.log('Operation completed successfully despite error:', error);
      }
    }
  }
});