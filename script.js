// API Base URL
const API_BASE = 'https://tripsplit-h198.onrender.com/api';
let currentTripId = null;

// Helper: fetch with error handling
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    alert("Error: " + err.message);
    throw err;
  }
}

// ---------------- TRIPS ----------------

async function loadTrips() {
  const trips = await apiFetch(`${API_BASE}/trips`);
  renderTripList(trips);
}

function renderTripList(trips) {
  const grid = document.getElementById("tripsGrid");
  if (!grid) return;

  if (trips.length === 0) {
    grid.innerHTML = `<div class="empty-message">No trips yet</div>`;
    return;
  }

  grid.innerHTML = trips.map(trip => `
    <div class="trip-card">
      <h3>${trip.name}</h3>
      <p>${trip.members?.length || 0} members • ${trip.expenses?.length || 0} expenses</p>

      <button onclick="openTripDetail('${trip._id}')">View</button>
      <button onclick="deleteTrip('${trip._id}')">Delete</button>
    </div>
  `).join('');
}

// ---------------- TRIP DETAILS ----------------

async function openTripDetail(tripId) {

  currentTripId = tripId;

  const trip = await apiFetch(`${API_BASE}/trips/${tripId}`);

  document.getElementById("tripListView").style.display = "none";
  document.getElementById("tripDetailView").style.display = "block";

  document.getElementById("detailTripName").innerText = trip.name;

  renderMembers(trip);
  renderExpenses(trip);
  renderSettlement(trip);
}

// ---------------- CREATE TRIP ----------------

async function createNewTrip() {

  const name = prompt("Trip name");

  if (!name) return;

  await apiFetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  loadTrips();
}

// ---------------- DELETE TRIP ----------------

async function deleteTrip(id) {

  if (!confirm("Delete trip?")) return;

  await apiFetch(`${API_BASE}/trips/${id}`, {
    method: "DELETE"
  });

  loadTrips();
}

// ---------------- MEMBERS ----------------

async function addMember() {

  const name = document.getElementById("memberNameInput").value;

  if (!name) return;

  await apiFetch(`${API_BASE}/trips/${currentTripId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  const trip = await apiFetch(`${API_BASE}/trips/${currentTripId}`);

  renderMembers(trip);
}

// ---------------- EXPENSES ----------------

async function addExpense() {

  const name = document.getElementById("expenseName").value;
  const amount = document.getElementById("expenseAmount").value;

  if (!name || !amount) return;

  await apiFetch(`${API_BASE}/trips/${currentTripId}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      amount: parseFloat(amount)
    })
  });

  const trip = await apiFetch(`${API_BASE}/trips/${currentTripId}`);

  renderExpenses(trip);
}

// ---------------- SETTLEMENT ----------------

function renderSettlement(trip) {

  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);

  const share = total / (trip.members.length || 1);

  const container = document.getElementById("settlementContainer");

  container.innerHTML = `
  <p>Total: ₹${total.toFixed(2)}</p>
  <p>Each pays: ₹${share.toFixed(2)}</p>
  `;
}

// ---------------- INIT ----------------

document.getElementById("newTripBtn")?.addEventListener("click", createNewTrip);

loadTrips();