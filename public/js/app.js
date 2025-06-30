// Global app state
const AppState = {
    user: null,
    token: localStorage.getItem('token'),
    buildings: [],
    rooms: [],
    currentSection: 'home'
};

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    AppState.currentSection = sectionId;
    
    // Load section-specific data
    if (sectionId === 'facilities') {
        loadBuildings();
    } else if (sectionId === 'booking') {
        loadBuildingsForBooking();
        setDefaultBookingTime();
    } else if (sectionId === 'navigation') {
        initInteractiveMap();
    }
}

function showError(message) {
    alert('Error: ' + message); // In a real app, use a toast notification
}

function showSuccess(message) {
    alert('Success: ' + message); // In a real app, use a toast notification
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (AppState.token) {
        config.headers.Authorization = `Bearer ${AppState.token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication Functions
async function login(email, password) {
    try {
        showLoading();
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        AppState.token = response.data.token;
        AppState.user = response.data.user;
        localStorage.setItem('token', AppState.token);
        
        updateAuthUI();
        closeModal('loginModal');
        showSuccess('Login successful!');
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function register(userData) {
    try {
        showLoading();
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        AppState.token = response.data.token;
        AppState.user = response.data.user;
        localStorage.setItem('token', AppState.token);
        
        updateAuthUI();
        closeModal('registerModal');
        showSuccess('Registration successful!');
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function logout() {
    AppState.token = null;
    AppState.user = null;
    localStorage.removeItem('token');
    updateAuthUI();
    showSuccess('Logged out successfully!');
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (AppState.user) {
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');
        userName.textContent = `${AppState.user.firstName} ${AppState.user.lastName}`;
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

// Buildings and Facilities Functions
async function loadBuildings() {
    try {
        showLoading();
        const response = await apiCall('/buildings');
        AppState.buildings = response.data;
        displayBuildings(AppState.buildings);
    } catch (error) {
        showError('Failed to load buildings: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadBuildingsForBooking() {
    try {
        const response = await apiCall('/buildings');
        AppState.buildings = response.data;
        
        const buildingSelect = document.getElementById('buildingSelect');
        buildingSelect.innerHTML = '<option value="">All Buildings</option>';
        
        AppState.buildings.forEach(building => {
            const option = document.createElement('option');
            option.value = building.buildingId;
            option.textContent = `${building.name} (${building.code})`;
            buildingSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load buildings for booking:', error);
    }
}

function displayBuildings(buildings) {
    const facilitiesList = document.getElementById('facilitiesList');
    
    if (buildings.length === 0) {
        facilitiesList.innerHTML = `
            <div class="facilities-placeholder">
                <i class="fas fa-university"></i>
                <p>No buildings found</p>
            </div>
        `;
        return;
    }
    
    facilitiesList.innerHTML = buildings.map(building => `
        <div class="building-card">
            <div class="building-header">
                <div class="building-name">${building.name}</div>
                <div class="building-code">${building.code}</div>
            </div>
            <div class="building-details">
                <div class="room-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${building.address || 'Address not available'}</span>
                </div>
                <div class="room-detail">
                    <i class="fas fa-building"></i>
                    <span>${building.floors} floor${building.floors !== 1 ? 's' : ''}</span>
                </div>
                <div class="room-detail">
                    <i class="fas fa-wheelchair"></i>
                    <span>${building.isAccessible ? 'Accessible' : 'Not accessible'}</span>
                </div>
            </div>
            ${building.description ? `<p class="mt-3">${building.description}</p>` : ''}
        </div>
    `).join('');
}

// Booking Functions
function setDefaultBookingTime() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const nextHour = currentHour + 1;
    
    // Set tomorrow's date if current time is late in the day
    const targetDate = nextHour >= 23 ? 
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        today;
    
    document.getElementById('bookingDate').value = targetDate;
    document.getElementById('startTime').value = `${Math.min(nextHour, 23).toString().padStart(2, '0')}:00`;
    document.getElementById('endTime').value = `${Math.min(nextHour + 1, 23).toString().padStart(2, '0')}:00`;
    
    console.log('Default booking time set:', {
        date: targetDate,
        startTime: `${Math.min(nextHour, 23).toString().padStart(2, '0')}:00`,
        endTime: `${Math.min(nextHour + 1, 23).toString().padStart(2, '0')}:00`
    });
}

async function searchAvailableRooms() {
    console.log('searchAvailableRooms function called!');
    // Note: Search works without login for demo purposes
    
    const facilityType = document.getElementById('facilityType').value;
    const buildingId = document.getElementById('buildingSelect').value;
    const capacity = document.getElementById('capacity').value;
    const date = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    console.log('Search form values:', { facilityType, buildingId, capacity, date, startTime, endTime });
    
    if (!date || !startTime || !endTime) {
        showError('Please fill in all required fields (Date, Start Time, and End Time)');
        return;
    }
    
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    
    if (startDateTime >= endDateTime) {
        showError('End time must be after start time');
        return;
    }
    
    try {
        showLoading();
        
        const params = new URLSearchParams({
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString()
        });
        
        if (facilityType) params.append('type', facilityType);
        if (buildingId) params.append('buildingId', buildingId);
        if (capacity) params.append('minCapacity', capacity);
        
        const url = `/rooms/available?${params}`;
        console.log('Making API call to:', url);
        
        const response = await apiCall(url);
        console.log('API response:', response);
        displayAvailableRooms(response.data, startDateTime, endDateTime);
        
    } catch (error) {
        showError('Failed to search for available rooms: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayAvailableRooms(rooms, startTime, endTime) {
    const availableRooms = document.getElementById('availableRooms');
    
    if (rooms.length === 0) {
        availableRooms.innerHTML = `
            <div class="rooms-placeholder">
                <i class="fas fa-calendar-times"></i>
                <p>No available rooms found for the selected criteria</p>
            </div>
        `;
        return;
    }
    
    const roomsHTML = rooms.map(room => `
        <div class="room-card" data-room-id="${room.roomId}" data-start-time="${startTime.toISOString()}" data-end-time="${endTime.toISOString()}" style="cursor: pointer; user-select: none;">
            <div class="room-header">
                <div class="room-title">${room.buildingName} - ${room.roomNumber}</div>
                <div class="room-type">${room.type.replace('_', ' ')}</div>
            </div>
            <div class="room-details">
                <div class="room-detail">
                    <i class="fas fa-users"></i>
                    <span>Capacity: ${room.capacity}</span>
                </div>
                <div class="room-detail">
                    <i class="fas fa-layer-group"></i>
                    <span>Floor: ${room.floor}</span>
                </div>
                <div class="room-detail">
                    <i class="fas fa-wheelchair"></i>
                    <span>${room.isAccessible ? 'Accessible' : 'Not accessible'}</span>
                </div>
                ${room.equipmentCount > 0 ? `
                <div class="room-detail">
                    <i class="fas fa-tools"></i>
                    <span>${room.equipmentCount} equipment items</span>
                </div>
                ` : ''}
            </div>
            ${room.description ? `<p class="mt-3">${room.description}</p>` : ''}
        </div>
    `).join('');
    
    availableRooms.innerHTML = roomsHTML;
    
    // Add click event listeners to all room cards
    document.querySelectorAll('.room-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const roomId = this.dataset.roomId;
            const startTimeStr = this.dataset.startTime;
            const endTimeStr = this.dataset.endTime;
            
            console.log('Room card clicked via event listener:', { roomId, startTimeStr, endTimeStr });
            
            if (roomId && startTimeStr && endTimeStr) {
                openBookingModal(roomId, startTimeStr, endTimeStr);
            } else {
                console.error('Missing room data:', { roomId, startTimeStr, endTimeStr });
            }
        });
    });
}

function openBookingModal(roomId, startTime, endTime) {
    console.log('openBookingModal called with:', { roomId, startTime, endTime });
    console.log('Current user:', AppState.user);
    
    if (!AppState.user) {
        console.log('No user logged in, showing login modal');
        showError('Please login to book a room');
        showModal('loginModal');
        return;
    }
    
    // Find room data from the last search results or get from current page
    let room = null;
    
    // Try to find room from available rooms displayed on the page
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        if (card.onclick && card.onclick.toString().includes(roomId)) {
            const roomTitle = card.querySelector('.room-title')?.textContent || '';
            const roomType = card.querySelector('.room-type')?.textContent || '';
            const capacity = card.querySelector('.room-detail span')?.textContent || '';
            
            // Parse the room data from the card
            const [buildingName, roomNumber] = roomTitle.split(' - ');
            room = {
                roomId,
                buildingName: buildingName || '',
                roomNumber: roomNumber || '',
                type: roomType || '',
                capacity: capacity.replace('Capacity: ', '') || ''
            };
        }
    });
    
    // Fallback if room not found in cards
    if (!room) {
        room = {
            roomId,
            buildingName: 'Building',
            roomNumber: 'Room',
            type: 'Room',
            capacity: ''
        };
    }
    
    const bookingDetails = document.getElementById('bookingDetails');
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / (1000 * 60 * 60 * 100)) / 100; // More precise duration
    
    bookingDetails.innerHTML = `
        <div class="booking-summary">
            <h4>Booking Summary</h4>
            <div class="booking-info">
                <div><strong>Room:</strong> ${room.buildingName} - ${room.roomNumber}</div>
                <div><strong>Type:</strong> ${room.type.replace('_', ' ')}</div>
                ${room.capacity ? `<div><strong>Capacity:</strong> ${room.capacity}</div>` : ''}
                <div><strong>Date:</strong> ${start.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <div><strong>Time:</strong> ${start.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                })} - ${end.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                })}</div>
                <div><strong>Duration:</strong> ${duration} hour${duration !== 1 ? 's' : ''}</div>
            </div>
        </div>
    `;
    
    // Store booking data for submission
    window.currentBooking = { roomId, startTime, endTime };
    showModal('bookingModal');
}

async function submitBooking() {
    if (!window.currentBooking) {
        showError('No booking data found');
        return;
    }
    
    const purpose = document.getElementById('bookingPurpose').value.trim();
    const notes = document.getElementById('bookingNotes').value.trim();
    
    if (!purpose) {
        showError('Please provide a purpose for your booking');
        return;
    }
    
    try {
        showLoading();
        
        const bookingData = {
            ...window.currentBooking,
            purpose,
            notes
        };
        
        const response = await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        
        closeModal('bookingModal');
        showSuccess('Booking created successfully!');
        
        // Clear form
        document.getElementById('bookingForm').reset();
        window.currentBooking = null;
        
        // Refresh available rooms
        searchAvailableRooms();
        
    } catch (error) {
        showError('Failed to create booking: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Navigation Functions
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                document.getElementById('fromLocation').value = `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
            },
            (error) => {
                showError('Unable to get your location: ' + error.message);
            }
        );
    } else {
        showError('Geolocation is not supported by this browser');
    }
}

async function searchBuildings() {
    const searchTerm = document.getElementById('toLocation').value.trim();
    
    if (!searchTerm) {
        showError('Please enter a destination');
        return;
    }
    
    try {
        const response = await apiCall(`/buildings/search?q=${encodeURIComponent(searchTerm)}`);
        
        if (response.data.length === 0) {
            showError('No buildings found matching your search');
            return;
        }
        
        // For demo purposes, just set the first result
        const building = response.data[0];
        document.getElementById('toLocation').value = `${building.name} (${building.code})`;
        
    } catch (error) {
        showError('Failed to search buildings: ' + error.message);
    }
}

function getDirections() {
    const fromLocation = document.getElementById('fromLocation').value.trim();
    const toLocation = document.getElementById('toLocation').value.trim();
    const accessibleRoute = document.getElementById('accessibleRoute').checked;
    const indoorRoute = document.getElementById('indoorRoute').checked;
    
    if (!fromLocation || !toLocation) {
        showError('Please enter both starting location and destination');
        return;
    }
    
    // For demo purposes, show mock directions
    const directionsPanel = document.getElementById('directionsPanel');
    const directionsList = document.getElementById('directionsList');
    
    const mockDirections = [
        { icon: 'fas fa-walking', text: 'Head north on Main Campus Road', distance: '200m' },
        { icon: 'fas fa-arrow-right', text: 'Turn right at Science Building', distance: '150m' },
        { icon: 'fas fa-door-open', text: 'Enter through main entrance', distance: '50m' },
        { icon: 'fas fa-arrow-up', text: 'Take elevator to floor 3', distance: '30m' },
        { icon: 'fas fa-map-marker-alt', text: 'Arrive at destination', distance: '0m' }
    ];
    
    directionsList.innerHTML = mockDirections.map(direction => `
        <div class="direction-step">
            <i class="${direction.icon}"></i>
            <div>
                <div>${direction.text}</div>
                <small class="text-muted">${direction.distance}</small>
            </div>
        </div>
    `).join('');
    
    directionsPanel.classList.remove('hidden');
    
    showSuccess('Directions calculated! Check the map for details.');
}

async function searchFacilities() {
    const searchTerm = document.getElementById('facilitiesSearch').value.trim();
    
    if (!searchTerm) {
        loadBuildings();
        return;
    }
    
    try {
        showLoading();
        const response = await apiCall(`/buildings/search?q=${encodeURIComponent(searchTerm)}`);
        displayBuildings(response.data);
    } catch (error) {
        showError('Failed to search facilities: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', () => showModal('loginModal'));
    document.getElementById('registerBtn').addEventListener('click', () => showModal('registerModal'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };
        await register(userData);
    });
    
    // Booking form
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitBooking();
    });
    
    // Modal close events
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Initialize auth state
    if (AppState.token) {
        // Verify token and load user data
        apiCall('/auth/profile')
            .then(response => {
                AppState.user = response.data.user;
                updateAuthUI();
            })
            .catch(() => {
                // Token is invalid, clear it
                logout();
            });
    }
    
    updateAuthUI();
});

// Interactive Map Functionality
let mapBuildings = [];
let selectedFromBuilding = null;
let selectedToBuilding = null;
let currentRoute = null;

async function initInteractiveMap() {
    try {
        showLoading();
        await loadMapBuildings();
        populateNavigationSelects();
        renderMapBuildings();
        hideLoading();
    } catch (error) {
        console.error('Failed to initialize map:', error);
        showError('Failed to load campus map');
        hideLoading();
    }
}

async function loadMapBuildings() {
    try {
        const response = await apiCall('/navigation/buildings');
        mapBuildings = response.data;
    } catch (error) {
        console.error('Failed to load buildings:', error);
        throw error;
    }
}

function populateNavigationSelects() {
    // Update the from/to inputs to be selects for better UX
    const fromInput = document.getElementById('fromLocation');
    const toInput = document.getElementById('toLocation');
    
    if (fromInput && toInput) {
        // Convert text inputs to selects
        const fromSelect = document.createElement('select');
        fromSelect.id = 'fromLocation';
        fromSelect.innerHTML = '<option value="">Select starting location</option>';
        
        const toSelect = document.createElement('select');
        toSelect.id = 'toLocation';
        toSelect.innerHTML = '<option value="">Select destination</option>';
        
        mapBuildings.forEach(building => {
            const option1 = new Option(`${building.name} (${building.code})`, building.code);
            const option2 = new Option(`${building.name} (${building.code})`, building.code);
            fromSelect.appendChild(option1);
            toSelect.appendChild(option2);
        });
        
        fromInput.parentNode.replaceChild(fromSelect, fromInput);
        toInput.parentNode.replaceChild(toSelect, toInput);
        
        // Add event listeners
        fromSelect.addEventListener('change', (e) => {
            selectedFromBuilding = e.target.value;
            updateMapSelection();
        });
        
        toSelect.addEventListener('change', (e) => {
            selectedToBuilding = e.target.value;
            updateMapSelection();
        });
    }
}

function renderMapBuildings() {
    const mapContainer = document.getElementById('interactiveMap');
    if (!mapContainer) return;
    
    // Clear existing buildings and paths
    mapContainer.querySelectorAll('.building, .path').forEach(el => el.remove());
    
    if (mapBuildings.length === 0) return;
    
    // Calculate map bounds
    const minLat = Math.min(...mapBuildings.map(b => b.coordinates.lat));
    const maxLat = Math.max(...mapBuildings.map(b => b.coordinates.lat));
    const minLng = Math.min(...mapBuildings.map(b => b.coordinates.lng));
    const maxLng = Math.max(...mapBuildings.map(b => b.coordinates.lng));
    
    const mapRect = mapContainer.getBoundingClientRect();
    
    mapBuildings.forEach(building => {
        const buildingElement = document.createElement('div');
        buildingElement.className = 'building';
        buildingElement.textContent = building.code;
        buildingElement.title = building.name;
        buildingElement.dataset.code = building.code;
        
        // Convert coordinates to map position
        const x = ((building.coordinates.lng - minLng) / (maxLng - minLng)) * (mapRect.width - 60) + 30;
        const y = ((maxLat - building.coordinates.lat) / (maxLat - minLat)) * (mapRect.height - 60) + 30;
        
        buildingElement.style.left = `${x}px`;
        buildingElement.style.top = `${y}px`;
        
        buildingElement.addEventListener('click', () => selectBuildingOnMap(building.code));
        
        mapContainer.appendChild(buildingElement);
    });
}

function selectBuildingOnMap(code) {
    if (!selectedFromBuilding) {
        selectedFromBuilding = code;
        document.getElementById('fromLocation').value = code;
    } else if (!selectedToBuilding && code !== selectedFromBuilding) {
        selectedToBuilding = code;
        document.getElementById('toLocation').value = code;
        getDirections();
    } else {
        // Reset selection
        selectedFromBuilding = code;
        selectedToBuilding = null;
        document.getElementById('fromLocation').value = code;
        document.getElementById('toLocation').value = '';
        clearRoute();
    }
    
    updateMapSelection();
}

function updateMapSelection() {
    const buildings = document.querySelectorAll('.building');
    buildings.forEach(building => {
        building.classList.remove('selected', 'from', 'to');
        
        if (building.dataset.code === selectedFromBuilding) {
            building.classList.add('from');
        }
        if (building.dataset.code === selectedToBuilding) {
            building.classList.add('to');
        }
    });
}

async function getDirections() {
    const fromSelect = document.getElementById('fromLocation');
    const toSelect = document.getElementById('toLocation');
    const accessibleRoute = document.getElementById('accessibleRoute').checked;
    
    const from = fromSelect.value;
    const to = toSelect.value;
    
    if (!from || !to) {
        showError('Please select both start and destination');
        return;
    }
    
    if (from === to) {
        showError('Start and destination cannot be the same');
        return;
    }
    
    try {
        showLoading();
        const response = await apiCall(`/navigation/directions?from=${from}&to=${to}&accessible=${accessibleRoute}`);
        
        if (response.success) {
            displayRoute(response.data);
            selectedFromBuilding = from;
            selectedToBuilding = to;
            updateMapSelection();
        } else {
            showError(response.error || 'Failed to get directions');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Failed to get directions:', error);
        showError('Failed to get directions');
        hideLoading();
    }
}

function displayRoute(routeData) {
    clearRoute();
    currentRoute = routeData;
    
    const mapContainer = document.getElementById('interactiveMap');
    const mapRect = mapContainer.getBoundingClientRect();
    
    // Calculate map bounds
    const minLat = Math.min(...mapBuildings.map(b => b.coordinates.lat));
    const maxLat = Math.max(...mapBuildings.map(b => b.coordinates.lat));
    const minLng = Math.min(...mapBuildings.map(b => b.coordinates.lng));
    const maxLng = Math.max(...mapBuildings.map(b => b.coordinates.lng));
    
    // Draw path between waypoints
    for (let i = 0; i < routeData.route.waypoints.length - 1; i++) {
        const start = routeData.route.waypoints[i];
        const end = routeData.route.waypoints[i + 1];
        
        const startX = ((start.lng - minLng) / (maxLng - minLng)) * (mapRect.width - 60) + 60;
        const startY = ((maxLat - start.lat) / (maxLat - minLat)) * (mapRect.height - 60) + 60;
        const endX = ((end.lng - minLng) / (maxLng - minLng)) * (mapRect.width - 60) + 60;
        const endY = ((maxLat - end.lat) / (maxLat - minLat)) * (mapRect.height - 60) + 60;
        
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        const path = document.createElement('div');
        path.className = 'path';
        path.style.left = `${startX}px`;
        path.style.top = `${startY}px`;
        path.style.width = `${distance}px`;
        path.style.transform = `rotate(${angle}deg)`;
        
        mapContainer.appendChild(path);
    }
    
    // Show route info
    const routeInfo = document.getElementById('routeInfo');
    document.getElementById('routeDistance').textContent = `Distance: ${routeData.route.distance}m`;
    document.getElementById('routeTime').textContent = `Est. time: ${routeData.route.estimatedTime} min`;
    document.getElementById('routeType').textContent = `Path type: ${routeData.route.pathType}`;
    routeInfo.classList.remove('hidden');
    
    // Show directions panel
    const directionsPanel = document.getElementById('directionsPanel');
    const directionsList = document.getElementById('directionsList');
    
    directionsList.innerHTML = `
        <div class="direction-step">
            <strong>From:</strong> ${routeData.from.name}
        </div>
        <div class="direction-step">
            <strong>To:</strong> ${routeData.to.name}
        </div>
        <div class="direction-step">
            <strong>Distance:</strong> ${routeData.route.distance} meters
        </div>
        <div class="direction-step">
            <strong>Estimated time:</strong> ${routeData.route.estimatedTime} minutes
        </div>
        <div class="direction-step">
            <strong>Path type:</strong> ${routeData.route.pathType}
        </div>
    `;
    
    directionsPanel.classList.remove('hidden');
}

function clearRoute() {
    document.querySelectorAll('.path').forEach(path => path.remove());
    document.getElementById('routeInfo').classList.add('hidden');
    document.getElementById('directionsPanel').classList.add('hidden');
    currentRoute = null;
}

// Handle window resize for map
window.addEventListener('resize', () => {
    if (AppState.currentSection === 'navigation' && mapBuildings.length > 0) {
        renderMapBuildings();
        if (currentRoute) {
            displayRoute(currentRoute);
        }
    }
});

// Make functions globally accessible for onclick handlers
window.searchAvailableRooms = searchAvailableRooms;
window.showSection = showSection;
window.openBookingModal = openBookingModal;
window.searchFacilities = searchFacilities;

// Add backup event listener for search button to ensure it works
setTimeout(() => {
    const searchButton = document.querySelector('button[onclick="searchAvailableRooms()"]');
    if (searchButton) {
        console.log('Adding backup event listener to search button');
        searchButton.addEventListener('click', function(e) {
            console.log('Search button clicked via backup event listener');
            if (typeof searchAvailableRooms === 'function') {
                searchAvailableRooms();
            } else {
                console.error('searchAvailableRooms function not found');
            }
        });
    } else {
        console.error('Search button not found');
    }
}, 1000);