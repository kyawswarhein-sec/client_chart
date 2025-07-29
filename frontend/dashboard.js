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
      window.ageGroupsData = data.ageGroups;
      window.genderCountData = data.genderCount;
      window.locationCountData = data.locationCount;
      window.visaTypeCountData = data.visaTypeCount;
      
      // Update UI elements
      document.getElementById('totalClients').textContent = data.totalClients;
      document.getElementById('profileName').textContent = data.admin;
      
      // Initialize the dashboard
      initializeDashboard();
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

  // Global functions (moved outside initializeDashboard for accessibility)
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

  // Display clients based on pagination
  function displayClients() {
    const tableBody = document.getElementById('allClientsTableBody');
    const startIndex = (currentPage - 1) * clientsPerPage;
    let endIndex;

    if (clientsPerPage === 'all') {
      endIndex = filteredClients.length;
    } else {
      endIndex = startIndex + parseInt(clientsPerPage);
    }

    const clientsToShow = filteredClients.slice(startIndex, endIndex);

    tableBody.innerHTML = '';
    clientsToShow.forEach(client => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="form-check-input client-checkbox" value="${client.id}" data-client-id="${client.id}">
        </td>
        <td>${client.id || 'N/A'}</td>
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
    if (typeof updateSelectedClients === 'function') {
      updateSelectedClients();
    }
  }

  function initializeDashboard() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.getElementById('mainContent');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
  
  // Toggle sidebar
  hamburgerBtn.addEventListener('click', function() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    mainContent.classList.toggle('sidebar-open');
  });
  
  // Close sidebar when clicking overlay
  sidebarOverlay.addEventListener('click', function() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    mainContent.classList.remove('sidebar-open');
  });
  
  // Close sidebar when clicking menu items (mobile)
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        mainContent.classList.remove('sidebar-open');
      }
    });
  });

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

  // Close profile dropdown when clicking on menu items
  const profileMenuItems = document.querySelectorAll('.profile-menu-item');
  profileMenuItems.forEach(item => {
    item.addEventListener('click', function() {
      profileDropdown.classList.remove('active');
    });
  });

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
        window.totalClients = data.totalClients;
        window.ageGroups = data.ageGroups;
        window.genderCounts = data.genderCounts;
        window.locationCounts = data.locationCounts;
        window.visaTypeCounts = data.visaTypeCounts;

        // Update filteredClients to reflect new data
        filteredClients = [...window.clientsData];

        // Update total clients count
        updateClientsCount();

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

  // Client Management Variables
  let filteredClients = [...clients];
  let currentPage = 1;
  let clientsPerPage = 10;
  let sortColumn = '';
  let sortDirection = 'asc';

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
      if (column === 'age' || column === 'id') {
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

  // Display clients based on pagination
  function displayClients() {
    const tableBody = document.getElementById('allClientsTableBody');
    const startIndex = (currentPage - 1) * clientsPerPage;
    let endIndex;

    if (clientsPerPage === 'all') {
      endIndex = filteredClients.length;
    } else {
      endIndex = startIndex + parseInt(clientsPerPage);
    }

    const clientsToShow = filteredClients.slice(startIndex, endIndex);

    tableBody.innerHTML = '';
    clientsToShow.forEach(client => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="form-check-input client-checkbox" value="${client.id}" data-client-id="${client.id}">
        </td>
        <td>${client.id || 'N/A'}</td>
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
    if (typeof updateSelectedClients === 'function') {
      updateSelectedClients();
    }
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
      
      // Smooth scroll to table
      document.getElementById('allClientsTableBody').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
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
      { icon: 'fas fa-plane-arrival', label: 'Arrival Date', value: client.arrival_date ? new Date(client.arrival_date).toLocaleDateString() : null },
      { icon: 'fas fa-plane-departure', label: 'US Arrival Date', value: client.us_arrival_date ? new Date(client.us_arrival_date).toLocaleDateString() : null },
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
    alert(`Edit functionality for client ID: ${clientId} - This would open an edit form.`);
  };

  // Event listeners
  document.getElementById('clientsPerPage').addEventListener('change', function() {
    clientsPerPage = this.value;
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

  // Populate recent clients table
  const tableBody = document.getElementById('clientsTableBody');
  clients.slice(0, 5).forEach(client => {
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
  } // End of initializeDashboard function

  // Selection handling functions  
  function setupSelectionHandlers() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const addClientBtn = document.getElementById('addClientBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

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

    // Add client button click
    addClientBtn.addEventListener('click', function() {
      openAddClientModal();
    });

    // Delete selected button click
    deleteSelectedBtn.addEventListener('click', function() {
      deleteSelectedClients();
    });
  }

  function updateSelectedClients() {
    const clientCheckboxes = document.querySelectorAll('.client-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAll');
    const addClientBtn = document.getElementById('addClientBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
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

    // Toggle button visibility
    if (selectedClients.length > 0) {
      addClientBtn.style.display = 'none';
      deleteSelectedBtn.style.display = 'inline-block';
      deleteSelectedBtn.innerHTML = `<i class="fas fa-trash-alt me-2"></i>Delete Selected (${selectedClients.length})`;
    } else {
      addClientBtn.style.display = 'inline-block';
      deleteSelectedBtn.style.display = 'none';
    }
  }

  function openAddClientModal() {
    const modal = document.getElementById('addClientModal');
    const form = document.getElementById('addClientForm');
    const closeBtn = document.getElementById('addClientModalClose');
    const cancelBtn = document.getElementById('addClientCancel');
    
    // Reset form
    form.reset();
    clearFormValidation();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => {
      document.getElementById('clientName').focus();
    }, 300);
    
    // Close handlers
    closeBtn.onclick = () => hideAddClientModal();
    cancelBtn.onclick = () => hideAddClientModal();
    
    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        hideAddClientModal();
      }
    };
    
    // Form submission
    form.onsubmit = handleAddClientSubmit;
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
    
    // Show loading state
    const submitBtn = document.querySelector('.btn-add-client');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('../backend/add_client.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();

      if (result.success) {
        hideAddClientModal();
        
        // Show success modal with refresh callback
        showSuccessModal(`Client "${clientData.name}" added successfully!`, function() {
          // Refresh dashboard when user clicks "Got it"
          refreshDashboard();
        });
      } else {
        showErrorModal('Add Client Failed', result.message);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      showErrorModal('Network Error', 'Unable to add client. Please try again.');
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
        
        // Show success modal with refresh callback
        showSuccessModal(`${result.deletedCount} client(s) deleted successfully!`, function() {
          // Refresh dashboard when user clicks "Got it"
          console.log('Starting dashboard refresh after successful deletion...');
          refreshDashboard().then(() => {
            console.log('Dashboard refresh completed successfully');
          }).catch(error => {
            console.error('Dashboard refresh failed:', error);
            // Fallback: reload the page if refresh fails
            location.reload();
          });
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