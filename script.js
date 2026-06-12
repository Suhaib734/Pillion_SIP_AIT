/* --- 1. AUTHENTICATION LOGIC --- */
function sendOtp() {
    const mobile = document.getElementById('mobileInput').value;
    if(mobile.length !== 10) return alert("Please enter valid mobile number");

    // Call Backend
    fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('step-mobile').style.display = 'none';
        document.getElementById('step-otp').style.display = 'block';
        document.getElementById('otp1').focus();
    });
}

function verifyOtp() {
    // Simply verify and log user in
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').classList.add('active');
    
    // Initialize Map immediately
    initMap();
}

/* --- 2. MAP LOGIC --- */
let map, userMarker, carMarker;

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([12.9716, 77.5946], 14);
    
    // Using a Clean, Light Map Style (CartoDB Positron) - Very Professional
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    userMarker = L.marker([12.9716, 77.5946]).addTo(map).bindPopup("Current Location").openPopup();
}

/* --- 3. SEARCH & RESULTS LOGIC --- */
function searchRides() {
    const dest = document.getElementById('destInput').value;
    if(!dest) return alert("Please enter destination");

    document.getElementById('panel-search').classList.remove('active');
    document.getElementById('panel-rides').classList.add('active');
    
    // Zoom map out to show route
    map.setZoom(13);

    renderRides();
}

function renderRides() {
    const list = document.getElementById('rides-list');
    
    // HARDCODED DATA FOR PERFECT DEMO
    // Shows Comparison (Uber, Ola, Rapido), Vehicle Types, and Multi-Modal
    const rides = [
        {
            provider: 'Rapido',
            type: 'Bike',
            price: 65,
            time: '12 min',
            logo: 'https://upload.wikimedia.org/wikipedia/en/2/23/Rapido_logo.png', // Rapido Logo
            isBest: true,
            hasWaitSave: true
        },
        {
            provider: 'Namma Yatri',
            type: 'Auto',
            price: 110,
            time: '15 min',
            logo: 'https://nammayatri.in/logos/nammaYatri.png', // Namma Yatri
            hasWaitSave: false
        },
        {
            provider: 'Pillion Public',
            type: 'Multi-Modal',
            price: 45,
            time: '35 min',
            logo: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png', // Generic Public Transport
            specialHtml: `
                <div class="multi-modal-path">
                    <i class="fa-solid fa-motorcycle"></i> Rapido (5m) 
                    <i class="fa-solid fa-arrow-right path-icon"></i> 
                    <i class="fa-solid fa-train-subway"></i> Metro (20m) 
                    <i class="fa-solid fa-arrow-right path-icon"></i> 
                    <i class="fa-solid fa-person-walking"></i> Walk (10m)
                </div>
            `,
            hasWaitSave: false
        },
        {
            provider: 'Uber',
            type: 'Go (AC)',
            price: 220,
            time: '18 min',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
            hasWaitSave: true
        },
        {
            provider: 'Ola',
            type: 'Prime SUV',
            price: 350,
            time: '20 min',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Ola_Cabs_logo.svg/2560px-Ola_Cabs_logo.svg.png',
            hasWaitSave: false
        }
    ];

    let html = '';
    rides.forEach((ride, index) => {
        let waitSaveHtml = '';
        
        // WAIT & SAVE LOGIC
        if(ride.hasWaitSave) {
            const saveAmount = Math.floor(ride.price * 0.15); // 15% savings
            waitSaveHtml = `
                <div class="wait-save-area">
                    <span style="font-size:0.8rem; color:#6B7280;">High Demand</span>
                    <button class="wait-btn" onclick="applyWaitSave(this, ${ride.price}, ${saveAmount})">
                        Wait 5m, Save ₹${saveAmount}
                    </button>
                </div>
            `;
        }

        html += `
            <div class="ride-card ${ride.isBest ? 'recommended' : ''}" onclick="selectRide(${index})">
                <div class="ride-main">
                    <div style="display:flex; align-items:center;">
                        <img src="${ride.logo}" class="provider-logo">
                        <div>
                            <div class="ride-title">
                                ${ride.provider} ${ride.type} 
                                ${ride.type === 'Bike' ? '<span style="font-size:0.7rem; background:#10B981; color:white; padding:2px 6px; border-radius:10px;">FASTEST</span>' : ''}
                            </div>
                            <div class="ride-meta">
                                <span><i class="fa-regular fa-clock"></i> ${ride.time}</span>
                                <span>• 4 min away</span>
                            </div>
                        </div>
                    </div>
                    <div class="ride-price">
                        <span class="price-tag">₹${ride.price}</span>
                        <span class="old-price"></span>
                    </div>
                </div>
                
                ${ride.specialHtml ? ride.specialHtml : ''}
                ${waitSaveHtml}
            </div>
        `;
    });

    list.innerHTML = html;
}

// Function to handle Wait & Save Click
window.applyWaitSave = function(btn, originalPrice, saveAmount) {
    event.stopPropagation(); // Don't trigger card click
    const card = btn.closest('.ride-card');
    const priceTag = card.querySelector('.price-tag');
    const oldPriceTag = card.querySelector('.old-price');
    
    // Update Price Visuals
    oldPriceTag.innerText = '₹' + originalPrice;
    oldPriceTag.style.display = 'block';
    priceTag.innerText = '₹' + (originalPrice - saveAmount);
    priceTag.style.color = '#10B981'; // Green
    
    btn.innerText = "Applied!";
    btn.style.background = "#10B981";
    btn.style.color = "white";
    btn.disabled = true;
};

/* --- 4. BOOKING & ANIMATION --- */
function selectRide(index) {
    document.getElementById('panel-rides').classList.remove('active');
    document.getElementById('panel-driver').classList.add('active');
    
    startDriverAnimation();
}

function startDriverAnimation() {
    // 10 Second Animation Logic
    const duration = 10000; // 10 seconds
    const intervalTime = 100; // Update every 0.1s
    const totalSteps = duration / intervalTime;
    
    // Path: From simulated driver location to user
    const startLat = 12.9750;
    const startLng = 77.5980;
    const endLat = 12.9716;
    const endLng = 77.5946;
    
    const carIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png', // Top-down car
        iconSize: [30, 60]
    });
    
    if(carMarker) map.removeLayer(carMarker);
    carMarker = L.marker([startLat, startLng], {icon: carIcon}).addTo(map);
    
    let step = 0;
    const timer = setInterval(() => {
        step++;
        
        // Linear Interpolation (Lerp)
        const currentLat = startLat + (endLat - startLat) * (step / totalSteps);
        const currentLng = startLng + (endLng - startLng) * (step / totalSteps);
        
        carMarker.setLatLng([currentLat, currentLng]);
        
        // Update Time Text
        const remainingSeconds = Math.ceil(10 - (step * intervalTime / 1000));
        document.getElementById('arrival-time').innerText = remainingSeconds > 0 ? remainingSeconds + " sec" : "0";

        if(step >= totalSteps) {
            clearInterval(timer);
            document.getElementById('arrival-time').innerText = "HERE";
            alert("Your Ride has Arrived!");
        }
    }, intervalTime);
}