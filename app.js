/**
 * Jerusalem Shelter Locator Application
 * Finds the nearest emergency shelters based on user location
 */

class ShelterLocator {
    constructor() {
        this.shelters = [];
        this.userLocation = null;
        this.map = null;
        this.mapFull = null;
        this.markers = [];
        this.markersFull = [];
        this.userMarker = null;
        this.userMarkerFull = null;
        this.currentTab = 'overview'; // 'overview', 'map', 'list'
        this.initializeElements();
        this.bindEvents();
        this.loadShelterData();
    }

    initializeElements() {
        // Get DOM elements
        this.elements = {
            useCurrentLocationBtn: document.getElementById('useCurrentLocationBtn'),
            addressInput: document.getElementById('addressInput'),
            searchAddressBtn: document.getElementById('searchAddressBtn'),
            locationStatus: document.getElementById('locationStatus'),
            currentLocationText: document.getElementById('currentLocationText'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            resultsSection: document.getElementById('resultsSection'),
            sheltersList: document.getElementById('sheltersList'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            retryButton: document.getElementById('retryButton'),
            // Tab elements
            overviewTab: document.getElementById('overviewTab'),
            mapTab: document.getElementById('mapTab'),
            listTab: document.getElementById('listTab'),
            linksTab: document.getElementById('linksTab'),
            overviewContent: document.getElementById('overviewContent'),
            mapContent: document.getElementById('mapContent'),
            listContent: document.getElementById('listContent'),
            linksContent: document.getElementById('linksContent'),
            sheltersListFull: document.getElementById('sheltersListFull'),
            exportPdfBtn: document.getElementById('exportPdfBtn'),
            printContainer: document.getElementById('printContainer')
        };
    }

    bindEvents() {
        // Add both click and touch events for better mobile support
        this.elements.useCurrentLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        this.elements.useCurrentLocationBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.getCurrentLocation();
        });
        
        this.elements.searchAddressBtn.addEventListener('click', () => this.searchAddress());
        this.elements.searchAddressBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.searchAddress();
        });
        
        this.elements.addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchAddress();
            }
        });
        
        this.elements.retryButton.addEventListener('click', () => this.hideError());
        this.elements.retryButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.hideError();
        });
        
        // Tab event listeners with touch support
        this.elements.overviewTab.addEventListener('click', () => this.switchTab('overview'));
        this.elements.overviewTab.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.switchTab('overview');
        });
        
        this.elements.mapTab.addEventListener('click', () => this.switchTab('map'));
        this.elements.mapTab.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.switchTab('map');
        });
        
        this.elements.listTab.addEventListener('click', () => this.switchTab('list'));
        this.elements.listTab.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.switchTab('list');
        });
        
        this.elements.linksTab.addEventListener('click', () => this.switchTab('links'));
        this.elements.linksTab.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.switchTab('links');
        });
        
        this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPdf());
        this.elements.exportPdfBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.exportToPdf();
        });
        
        // Add window resize handler for mobile orientation changes
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    async loadShelterData() {
        try {
            const response = await fetch('data/shelters.json');
            if (!response.ok) {
                throw new Error('Failed to load shelter data');
            }
            
            const data = await response.json();
            this.shelters = data.features.map(feature => ({
                id: feature.properties.shelter_no || 'Unknown',
                address: feature.properties.address_label || 'Address not available',
                operator: feature.properties.operator || 'Unknown operator',
                capacity: feature.properties.capacity || 'Unknown',
                area: feature.properties.area || 'Unknown',
                type: feature.properties.type || 'Shelter',
                neighborhood: feature.properties['﻿neighborhood'] || feature.properties.neighborhood || 'Unknown',
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                wazeLink: feature.properties.waze_link || '',
                googleMapsLink: feature.properties.google_maps_link || ''
            }));
            
            console.log(`Loaded ${this.shelters.length} shelters`);
        } catch (error) {
            console.error('Error loading shelter data:', error);
            this.showError('Failed to load shelter data. Please refresh the page and try again.');
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser. Please enter your address manually.');
            return;
        }

        this.showLoading();
        this.elements.useCurrentLocationBtn.disabled = true;

        // Mobile-friendly geolocation options
        const options = {
            enableHighAccuracy: false, // Use false for better mobile performance
            timeout: 15000, // Longer timeout for mobile networks
            maximumAge: 600000 // 10 minutes cache for mobile
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                // Check if location is in Jerusalem area (rough bounds)
                if (this.isLocationInJerusalem(position.coords.latitude, position.coords.longitude)) {
                    this.reverseGeocode(this.userLocation.latitude, this.userLocation.longitude)
                        .then(address => {
                            this.showLocationStatus(address || 'Current location');
                            this.findNearestShelters();
                        })
                        .catch(() => {
                            this.showLocationStatus('Current location');
                            this.findNearestShelters();
                        });
                } else {
                    this.hideLoading();
                    this.elements.useCurrentLocationBtn.disabled = false;
                    this.showError('Your location appears to be outside Jerusalem. Please enter a Jerusalem address manually.');
                }
            },
            (error) => {
                this.hideLoading();
                this.elements.useCurrentLocationBtn.disabled = false;
                
                let errorMessage = 'Unable to get your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Please allow location access in your browser settings and try again, or enter your address manually.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable. Please try entering your address manually.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out. Please try again or enter your address manually.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred. Please try entering your address manually.';
                        break;
                }
                this.showError(errorMessage);
            },
            options
        );
    }

    async searchAddress() {
        const address = this.elements.addressInput.value.trim();
        if (!address) {
            this.showError('Please enter an address.');
            return;
        }

        this.showLoading();
        this.elements.searchAddressBtn.disabled = true;

        try {
            const coordinates = await this.geocodeAddress(address);
            if (coordinates) {
                this.userLocation = coordinates;
                this.showLocationStatus(address);
                this.findNearestShelters();
            } else {
                this.showError('Address not found. Please try a different address in Jerusalem.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            this.showError('Unable to find the address. Please try again.');
        } finally {
            this.elements.searchAddressBtn.disabled = false;
        }
    }

    async geocodeAddress(address) {
        // Using a simple geocoding approach with Nominatim (OpenStreetMap)
        try {
            const query = encodeURIComponent(`${address}, Jerusalem, Israel`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=3&countrycodes=il`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Jerusalem-Shelter-Locator/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                // Find the best match (preferably one that contains 'Jerusalem')
                let bestMatch = data[0];
                for (let result of data) {
                    if (result.display_name && result.display_name.toLowerCase().includes('jerusalem')) {
                        bestMatch = result;
                        break;
                    }
                }
                
                const coords = {
                    latitude: parseFloat(bestMatch.lat),
                    longitude: parseFloat(bestMatch.lon)
                };
                
                // Verify the coordinates are in Jerusalem area
                if (this.isLocationInJerusalem(coords.latitude, coords.longitude)) {
                    return coords;
                } else {
                    throw new Error('Address not found in Jerusalem area');
                }
            }
            return null;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Geocoding request timed out');
            } else {
                console.error('Geocoding error:', error);
            }
            return null;
        }
    }

    async reverseGeocode(latitude, longitude) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Jerusalem-Shelter-Locator/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.display_name) {
                return data.display_name;
            }
            return null;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Reverse geocoding request timed out');
            } else {
                console.error('Reverse geocoding error:', error);
            }
            return null;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two points
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }

    formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        }
        return `${distance.toFixed(2)} km`;
    }

    calculateWalkingTime(distance) {
        // Average walking speed: 5 km/h
        const walkingSpeedKmh = 5;
        const timeHours = distance / walkingSpeedKmh;
        const timeMinutes = Math.round(timeHours * 60);
        
        if (timeMinutes < 1) {
            return "< 1 min";
        }
        return `${timeMinutes} min`;
    }

    calculateRunningTime(distance) {
        // Average running speed: 10 km/h
        const runningSpeedKmh = 10;
        const timeHours = distance / runningSpeedKmh;
        const timeMinutes = Math.round(timeHours * 60);
        
        if (timeMinutes < 1) {
            return "< 1 min";
        }
        return `${timeMinutes} min`;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    isLocationInJerusalem(latitude, longitude) {
        // Jerusalem rough bounding box
        const jerusalemBounds = {
            north: 31.8500,
            south: 31.7000,
            east: 35.3000,
            west: 35.1500
        };
        
        return latitude >= jerusalemBounds.south && 
               latitude <= jerusalemBounds.north && 
               longitude >= jerusalemBounds.west && 
               longitude <= jerusalemBounds.east;
    }

    handleResize() {
        // Handle window resize and orientation changes
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
        
        if (this.mapFull) {
            setTimeout(() => {
                this.mapFull.invalidateSize();
            }, 100);
        }
    }

    findNearestShelters() {
        if (!this.userLocation || this.shelters.length === 0) {
            this.showError('Unable to find shelters. Please try again.');
            return;
        }

        // Calculate distances and sort by nearest
        const sheltersWithDistance = this.shelters.map(shelter => ({
            ...shelter,
            distance: this.calculateDistance(
                this.userLocation.latitude,
                this.userLocation.longitude,
                shelter.latitude,
                shelter.longitude
            )
        })).sort((a, b) => a.distance - b.distance);

        // Get the 10 nearest shelters
        const nearestShelters = sheltersWithDistance.slice(0, 10);
        
        this.hideLoading();
        this.displayShelters(nearestShelters);
    }

    displayShelters(shelters) {
        // Store shelters for PDF export
        this.nearestShelters = shelters;
        
        // Initialize maps if not already done
        if (!this.map) {
            this.initializeMap();
        }
        
        // Clear existing markers
        this.clearMarkers();
        
        // Add user location marker
        if (this.userLocation) {
            this.addUserMarker();
        }
        
        // Add shelter markers to map
        this.addShelterMarkers(shelters);
        
        // Populate list views
        this.populateListView(shelters);
        this.populateFullListView(shelters);
        
        // Show results section
        this.elements.resultsSection.classList.remove('hidden');
        
        // Set initial tab to overview
        this.switchTab('overview');
        
        // Scroll to results with mobile-friendly behavior
        setTimeout(() => {
            this.elements.resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    initializeMap() {
        // Initialize Leaflet map centered on Jerusalem
        this.map = L.map('map').setView([31.7683, 35.2137], 12);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    clearMarkers() {
        // Remove all existing markers
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
        
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
            this.userMarker = null;
        }
    }

    addUserMarker() {
        if (!this.userLocation || !this.map) return;
        
        // Create custom icon for user location
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        this.userMarker = L.marker([this.userLocation.latitude, this.userLocation.longitude], {
            icon: userIcon
        }).addTo(this.map)
          .bindPopup('<strong>Your Location</strong>')
          .openPopup();
    }

    addShelterMarkers(shelters) {
        if (!this.map) return;
        
        const bounds = [];
        
        shelters.forEach((shelter, index) => {
            // Create custom icon for shelters
            const shelterIcon = L.divIcon({
                className: 'shelter-marker',
                html: `<div style="background: #48bb78; color: white; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker([shelter.latitude, shelter.longitude], {
                icon: shelterIcon
            }).addTo(this.map);
            
            // Create popup content
            const popupContent = `
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #2d3748;">#${index + 1} - Shelter ${shelter.id}</h4>
                    <p style="margin: 0 0 5px 0; font-weight: 600;">${shelter.address}</p>
                    <p style="margin: 0 0 5px 0; font-size: 0.9em; color: #718096;">${shelter.operator}</p>
                    <div style="display: flex; gap: 15px; margin: 8px 0;">
                        <span style="font-size: 0.8em;"><strong>Distance:</strong> ${shelter.distance.toFixed(2)} km</span>
                        <span style="font-size: 0.8em;"><strong>Capacity:</strong> ${shelter.capacity}</span>
                    </div>
                    <a href="${this.createDirectionsUrl(shelter)}" target="_blank" 
                       style="display: inline-block; background: #48bb78; color: white; padding: 5px 10px; 
                              text-decoration: none; border-radius: 5px; font-size: 0.8em; margin-top: 5px;">
                        Get Directions
                    </a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            this.markers.push(marker);
            bounds.push([shelter.latitude, shelter.longitude]);
        });
        
        // Add user location to bounds if available
        if (this.userLocation) {
            bounds.push([this.userLocation.latitude, this.userLocation.longitude]);
        }
        
        // Fit map to show all markers
        if (bounds.length > 0) {
            this.map.fitBounds(bounds, { padding: [20, 20] });
        }
    }

    populateListView(shelters) {
        this.elements.sheltersList.innerHTML = '';
        
        shelters.forEach((shelter, index) => {
            const shelterCardHTML = this.createShelterCard(shelter, index + 1);
            this.elements.sheltersList.innerHTML += shelterCardHTML;
        });
    }

    populateFullListView(shelters) {
        this.elements.sheltersListFull.innerHTML = '';
        
        shelters.forEach((shelter, index) => {
            const shelterCardHTML = this.createShelterCard(shelter, index + 1);
            this.elements.sheltersListFull.innerHTML += shelterCardHTML;
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Activate selected tab
        this.elements[`${tabName}Tab`].classList.add('active');
        this.elements[`${tabName}Content`].classList.add('active');
        
        // Handle map initialization and resizing
        if (tabName === 'map') {
            if (!this.mapFull) {
                this.initializeFullMap();
            }
            setTimeout(() => {
                if (this.mapFull) {
                    this.mapFull.invalidateSize();
                }
            }, 100);
        } else if (tabName === 'overview') {
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        }
    }

    initializeFullMap() {
        // Initialize full-screen map
        this.mapFull = L.map('mapFull').setView([31.7683, 35.2137], 12);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.mapFull);
        
        // Copy markers from main map to full map
        this.copyMarkersToFullMap();
    }

    copyMarkersToFullMap() {
        if (!this.mapFull) return;
        
        // Clear existing markers on full map
        this.markersFull.forEach(marker => {
            this.mapFull.removeLayer(marker);
        });
        this.markersFull = [];
        
        if (this.userMarkerFull) {
            this.mapFull.removeLayer(this.userMarkerFull);
            this.userMarkerFull = null;
        }
        
        // Add user marker to full map
        if (this.userLocation) {
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: '<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            this.userMarkerFull = L.marker([this.userLocation.latitude, this.userLocation.longitude], {
                icon: userIcon
            }).addTo(this.mapFull)
              .bindPopup('<strong>Your Location</strong>');
        }
        
        // Copy shelter markers to full map
        this.markers.forEach((marker, index) => {
            const latLng = marker.getLatLng();
            const popup = marker.getPopup();
            
            const shelterIcon = L.divIcon({
                className: 'shelter-marker',
                html: `<div style="background: #48bb78; color: white; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const fullMarker = L.marker(latLng, { icon: shelterIcon })
                .addTo(this.mapFull)
                .bindPopup(popup.getContent());
            
            this.markersFull.push(fullMarker);
        });
        
        // Fit bounds to show all markers
        const bounds = [];
        if (this.userLocation) {
            bounds.push([this.userLocation.latitude, this.userLocation.longitude]);
        }
        this.markersFull.forEach(marker => {
            bounds.push(marker.getLatLng());
        });
        
        if (bounds.length > 0) {
            this.mapFull.fitBounds(bounds, { padding: [20, 20] });
        }
    }

    createShelterCard(shelter, rank) {
        const walkingTime = this.calculateWalkingTime(shelter.distance);
        const runningTime = this.calculateRunningTime(shelter.distance);
        
        return `
            <div class="shelter-card">
                <div class="shelter-header">
                    <div class="shelter-rank">${rank}</div>
                    <div class="shelter-info">
                        <h3 class="shelter-address">${shelter.address}</h3>
                        <div class="shelter-tags">
                            <span class="tag shelter-id">Shelter ${shelter.id}</span>
                        </div>
                    </div>
                </div>
                
                <div class="shelter-distance-info">
                    <div class="distance-main">
                        <span class="distance-value">${this.formatDistance(shelter.distance)}</span>
                    </div>
                    <div class="time-estimates">
                        <div class="time-item">
                            <span class="time-label">Walking:</span>
                            <span class="time-value">${walkingTime}</span>
                        </div>
                        <div class="time-item">
                            <span class="time-label">Running:</span>
                            <span class="time-value">${runningTime}</span>
                        </div>
                    </div>
                </div>
                
                <div class="more-info-section">
                    <button class="more-info-toggle" onclick="this.parentElement.classList.toggle('expanded')">
                        <span class="toggle-text">More Info</span>
                        <span class="toggle-arrow">▼</span>
                    </button>
                    <div class="more-info-content">
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Capacity:</span>
                                <span class="info-value">${shelter.capacity || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Area:</span>
                                <span class="info-value">${shelter.area || 'N/A'} m²</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Neighborhood:</span>
                                <span class="info-value">${shelter.neighborhood || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Operator:</span>
                                <span class="info-value">${shelter.operator || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="shelter-actions">
                    <a href="${this.createDirectionsUrl(shelter)}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="btn btn-primary directions-btn">
                        Get Directions
                    </a>
                </div>
            </div>
        `;
    }

    createDirectionsUrl(shelter) {
        if (!this.userLocation) {
            // Fallback to the original Google Maps link if no user location
            return shelter.googleMapsLink || `https://www.google.com/maps/search/${encodeURIComponent(shelter.address)}`;
        }
        
        // Create directions URL from user location to shelter
        const origin = `${this.userLocation.latitude},${this.userLocation.longitude}`;
        const destination = `${shelter.latitude},${shelter.longitude}`;
        
        return `https://www.google.com/maps/dir/${origin}/${destination}`;
    }

    showLoading() {
        this.hideError();
        this.elements.loadingIndicator.classList.remove('hidden');
        this.elements.resultsSection.classList.add('hidden');
    }

    hideLoading() {
        this.elements.loadingIndicator.classList.add('hidden');
        this.elements.useCurrentLocationBtn.disabled = false;
        this.elements.searchAddressBtn.disabled = false;
    }

    showLocationStatus(locationText) {
        this.elements.locationStatus.classList.remove('hidden');
        this.elements.currentLocationText.textContent = locationText;
    }

    showError(message) {
        this.hideLoading();
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
        
        // Scroll to error message
        this.elements.errorMessage.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }

    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }

    exportToPdf() {
        if (!this.nearestShelters || this.nearestShelters.length === 0) {
            this.showError('No shelter data available to export. Please search for shelters first.');
            return;
        }

        // Generate PDF content
        const printContent = this.generatePrintContent();
        this.elements.printContainer.innerHTML = printContent;

        // Trigger print dialog
        window.print();
    }

    generatePrintContent() {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const userLocationText = this.elements.currentLocationText.textContent || 'Location not specified';

        let sheltersHtml = '';
        this.nearestShelters.forEach((shelter, index) => {
            const walkingTime = this.calculateWalkingTime(shelter.distance);
            const runningTime = this.calculateRunningTime(shelter.distance);
            
            sheltersHtml += `
                <div class="print-shelter">
                    <div class="print-shelter-header">
                        <div class="print-shelter-rank">${index + 1}</div>
                        <div class="print-shelter-address">${shelter.address}</div>
                        <div class="print-shelter-distance">${this.formatDistance(shelter.distance)}</div>
                    </div>
                    <div class="print-shelter-details">
                        <div class="print-detail-item">
                            <span class="print-detail-label">Walking Time:</span> ${walkingTime}
                        </div>
                        <div class="print-detail-item">
                            <span class="print-detail-label">Running Time:</span> ${runningTime}
                        </div>
                        <div class="print-detail-item">
                            <span class="print-detail-label">Capacity:</span> ${shelter.capacity || 'N/A'}
                        </div>
                        <div class="print-detail-item">
                            <span class="print-detail-label">Area:</span> ${shelter.area || 'N/A'} m²
                        </div>
                        <div class="print-detail-item">
                            <span class="print-detail-label">Neighborhood:</span> ${shelter.neighborhood || 'N/A'}
                        </div>
                        <div class="print-detail-item">
                            <span class="print-detail-label">Operator:</span> ${shelter.operator || 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        });

        return `
            <div class="print-header">
                <h1>Jerusalem Emergency Shelters</h1>
                <p class="print-subtitle">Nearest Shelters to Your Location</p>
            </div>
            
            <div class="print-info">
                <div class="print-info-item">
                    <span class="print-detail-label">Your Location:</span><br>
                    ${userLocationText}
                </div>
                <div class="print-info-item">
                    <span class="print-detail-label">Generated:</span><br>
                    ${currentDate}
                </div>
            </div>
            
            ${sheltersHtml}
            
            <div class="print-emergency-contacts">
                <div class="print-emergency-title">Emergency Contacts</div>
                <div class="print-contacts-grid">
                    <div class="print-contact-item">
                        <span class="print-contact-number">100</span>
                        <span class="print-contact-service">Police</span>
                    </div>
                    <div class="print-contact-item">
                        <span class="print-contact-number">101</span>
                        <span class="print-contact-service">Ambulance</span>
                    </div>
                    <div class="print-contact-item">
                        <span class="print-contact-number">102</span>
                        <span class="print-contact-service">Fire Department</span>
                    </div>
                    <div class="print-contact-item">
                        <span class="print-contact-number">104</span>
                        <span class="print-contact-service">Municipal Hotline</span>
                    </div>
                </div>
            </div>
            
            <div class="print-footer">
                <p><strong>Important:</strong> This information is not a substitute for official emergency information. Always consult official government sources and emergency services for the most current information.</p>
                <p>Data source: Jerusalem Municipality | Generated by Jerusalem Shelter Locator</p>
            </div>
        `;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShelterLocator();
});
