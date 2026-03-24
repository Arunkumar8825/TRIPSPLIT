// API Base URL
const API_BASE ='https://tripsplit1.onrender.com/api';
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

// --------------------- TRIP LIST -------------------------
async function loadTrips() {
  const trips = await apiFetch(`${API_BASE}/trips`);
  renderTripList(trips);
}

function renderTripList(trips) {
  const grid = document.getElementById("tripsGrid");
  if (!grid) return;
  if (trips.length === 0) {
    grid.innerHTML = `<div class="empty-message">✨ No trips yet. Click "New Trip" to start!</div>`;
    return;
  }
  grid.innerHTML = trips.map(trip => `
    <div class="trip-card" data-trip-id="${trip._id}">
      <h3><i class="fas fa-location-dot"></i> ${escapeHtml(trip.name)}</h3>
      <p><i class="fas fa-calendar-alt"></i> ${trip.date || 'No date'} &nbsp;|&nbsp; <i class="fas fa-user-friends"></i> ${trip.members?.length || 0} members · ${trip.expenses?.length || 0} expenses · 📸 ${trip.photos?.length || 0} photos</p>
      <div class="trip-actions">
        <button class="view-trip-btn btn-icon" data-id="${trip._id}"><i class="fas fa-eye"></i> View</button>
        <button class="delete-trip-btn btn-icon" data-id="${trip._id}"><i class="fas fa-trash-alt"></i> Delete</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.view-trip-btn').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openTripDetail(btn.dataset.id);
  }));
  document.querySelectorAll('.delete-trip-btn').forEach(btn => btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm("Delete trip?")) {
      await apiFetch(`${API_BASE}/trips/${btn.dataset.id}`, { method: 'DELETE' });
      loadTrips();
      if (currentTripId === btn.dataset.id) showTripListView();
    }
  }));
  document.querySelectorAll('.trip-card').forEach(card => card.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') openTripDetail(card.dataset.tripId);
  }));
}

// --------------------- TRIP DETAIL -------------------------
async function openTripDetail(tripId) {
  currentTripId = tripId;
  const trip = await apiFetch(`${API_BASE}/trips/${tripId}`);
  document.getElementById("detailTripName").innerText = trip.name;
  document.getElementById("tripDateDisplay").innerText = trip.date || 'Not set';
  document.getElementById("tripListView").style.display = "none";
  document.getElementById("tripDetailView").style.display = "block";
  refreshDetailUI(trip);
}

function showTripListView() {
  currentTripId = null;
  document.getElementById("tripListView").style.display = "block";
  document.getElementById("tripDetailView").style.display = "none";
  loadTrips();
}

async function refreshDetailUI(trip) {
  if (!trip) trip = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
  renderMembers(trip);
  renderExpenses(trip);
  renderSettlement(trip);
  renderPhotos(trip);
  updateExpensePaidByDropdown(trip);
}

function renderMembers(trip) {
  const container = document.getElementById("membersListContainer");
  if (!trip.members?.length) {
    container.innerHTML = `<div class="empty-message">No members yet.</div>`;
    return;
  }
  container.innerHTML = trip.members.map(m => `
    <div class="member-chip">
      ${escapeHtml(m.name)}
      <i class="fas fa-times-circle" data-member-id="${m.id}" data-action="remove"></i>
    </div>
  `).join('');
  document.querySelectorAll('#membersListContainer i[data-action="remove"]').forEach(icon => {
    icon.addEventListener('click', async () => {
      if (confirm("Remove member? Expenses paid by them will also be deleted.")) {
        await apiFetch(`${API_BASE}/trips/${currentTripId}/members/${icon.dataset.memberId}`, { method: 'DELETE' });
        const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
        refreshDetailUI(updated);
      }
    });
  });
}

function updateExpensePaidByDropdown(trip) {
  const select = document.getElementById("expensePaidBy");
  if (!trip.members?.length) {
    select.innerHTML = '<option disabled>-- Add members first --</option>';
    select.disabled = true;
  } else {
    select.disabled = false;
    select.innerHTML = trip.members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
    select.value = trip.members[0].id;
  }
}

function renderExpenses(trip) {
  const tbody = document.getElementById("expenseListBody");
  if (!trip.expenses?.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No expenses yet.</td></tr>';
    return;
  }
  tbody.innerHTML = trip.expenses.map(exp => {
    const payer = trip.members.find(m => m.id === exp.paidById);
    return `
      <tr>
        <td><strong>${escapeHtml(exp.name)}</strong></td>
        <td>${escapeHtml(payer?.name || '?')}</td>
        <td>₹${exp.amount.toFixed(2)}</td>
        <td><button class="delete-expense-btn" data-expense-id="${exp.id}"><i class="fas fa-trash-alt"></i> Delete</button></td>
      </tr>
    `;
  }).join('');
  document.querySelectorAll('.delete-expense-btn').forEach(btn => btn.addEventListener('click', async () => {
    await apiFetch(`${API_BASE}/trips/${currentTripId}/expenses/${btn.dataset.expenseId}`, { method: 'DELETE' });
    const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
    refreshDetailUI(updated);
  }));
}

function getTransactions(trip) {
  const totalExpense = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const eachShare = totalExpense / (trip.members.length || 1);
  const paidMap = new Map();
  trip.members.forEach(m => paidMap.set(m.id, 0));
  trip.expenses.forEach(exp => paidMap.set(exp.paidById, paidMap.get(exp.paidById) + exp.amount));
  const paidSummary = trip.members.map(m => ({ name: m.name, net: paidMap.get(m.id) - eachShare }));
  let receivers = paidSummary.filter(p => p.net > 0).sort((a,b) => b.net - a.net);
  let payers = paidSummary.filter(p => p.net < 0).sort((a,b) => a.net - b.net);
  let transactions = [];
  let i = 0, j = 0;
  while (i < receivers.length && j < payers.length) {
    let amount = Math.min(receivers[i].net, -payers[j].net);
    if (amount > 0.01) transactions.push({ fromName: payers[j].name, toName: receivers[i].name, amount: amount });
    receivers[i].net -= amount;
    payers[j].net += amount;
    if (receivers[i].net < 0.01) i++;
    if (payers[j].net > -0.01) j++;
  }
  return transactions;
}

function renderSettlement(trip) {
  const container = document.getElementById("settlementContainer");
  if (!trip.members?.length) {
    container.innerHTML = `<div class="settlement-summary-box">Add members to see settlement.</div>`;
    return;
  }
  const totalExpense = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const eachShare = totalExpense / trip.members.length;
  const paidMap = new Map();
  trip.members.forEach(m => paidMap.set(m.id, 0));
  trip.expenses.forEach(exp => paidMap.set(exp.paidById, paidMap.get(exp.paidById) + exp.amount));
  const paidSummary = trip.members.map(m => ({ name: m.name, paid: paidMap.get(m.id) }));
  const transactions = getTransactions(trip);
  let html = `<div class="settlement-summary-box">
    <div><strong>💰 Total Expense:</strong> ₹${totalExpense.toFixed(2)}</div>
    <div><strong>👥 Each Person Pays:</strong> ₹${eachShare.toFixed(2)}</div>`;
  if (trip.date) html += `<div><strong>📅 Trip Date:</strong> ${trip.date}</div>`;
  html += `<hr><div><strong>📋 Paid Summary</strong></div>
    <div class="paid-summary-grid">`;
  paidSummary.forEach(p => { html += `<div class="paid-badge">${escapeHtml(p.name)} ₹${p.paid.toFixed(2)}</div>`; });
  html += `</div><hr><div><strong>🔄 Who Owes Whom</strong></div>`;
  if (!transactions.length) html += `<div class="empty-message">✨ All settled up!</div>`;
  else {
    transactions.forEach(tx => {
      html += `<div class="transaction-item">
        <span><i class="fas fa-exchange-alt"></i> ${escapeHtml(tx.fromName)} pays ${escapeHtml(tx.toName)}</span>
        <span class="transaction-amount">₹${tx.amount.toFixed(2)}</span>
      </div>`;
    });
  }
  html += `</div>`;
  container.innerHTML = html;
}

function renderPhotos(trip) {
  const gallery = document.getElementById("photoGallery");
  const photos = trip.photos || [];
  if (!photos.length) {
    gallery.innerHTML = `<div class="empty-message">📷 No photos yet.</div>`;
    return;
  }
  gallery.innerHTML = photos.map(photo => `
    <div class="photo-card" data-photo-id="${photo.id}">
      <img src="${photo.base64}">
      <div class="photo-delete" data-photo-id="${photo.id}"><i class="fas fa-trash-alt"></i></div>
    </div>
  `).join('');
  document.querySelectorAll('.photo-delete').forEach(btn => btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await apiFetch(`${API_BASE}/trips/${currentTripId}/photos/${btn.dataset.photoId}`, { method: 'DELETE' });
    const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
    refreshDetailUI(updated);
  }));
}

async function addMultiplePhotosToCurrentTrip(files) {
  if (files.length > 50) { alert("Max 50 images at once."); return; }
  const overlay = document.createElement('div');
  overlay.className = 'progress-overlay';
  overlay.innerHTML = `<div><i class="fas fa-spinner fa-pulse"></i> Uploading ${files.length} photos...</div>`;
  document.body.appendChild(overlay);
  let success = 0;
  for (let f of files) {
    if (!f.type.startsWith("image/")) continue;
    try {
      const base64 = await fileToBase64(f);
      await apiFetch(`${API_BASE}/trips/${currentTripId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64 })
      });
      success++;
    } catch(e) { console.error(e); }
  }
  overlay.remove();
  alert(`${success} photo(s) added.`);
  const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
  refreshDetailUI(updated);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePhotoUpload() {
  const files = document.getElementById("photoInput").files;
  if (!files.length) { alert("Select images"); return; }
  await addMultiplePhotosToCurrentTrip(Array.from(files));
  document.getElementById("photoInput").value = "";
}

// --------------------- CRUD actions (API calls) -------------------------
async function createNewTrip() {
  let tripName = prompt("Enter trip name:", "New Adventure");
  if (!tripName?.trim()) return;
  tripName = tripName.trim();
  let tripDate = prompt("Enter trip date (YYYY-MM-DD) or leave blank for today:", new Date().toISOString().split('T')[0]);
  if (tripDate && !/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    alert("Invalid date format. Using today.");
    tripDate = new Date().toISOString().split('T')[0];
  } else if (!tripDate) tripDate = new Date().toISOString().split('T')[0];
  const newTrip = await apiFetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: tripName, date: tripDate })
  });
  await openTripDetail(newTrip._id);
  loadTrips();
}

async function addMemberToCurrentTrip() {
  const name = document.getElementById("memberNameInput").value.trim();
  if (!name) { alert("Enter member name"); return; }
  await apiFetch(`${API_BASE}/trips/${currentTripId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  document.getElementById("memberNameInput").value = "";
  const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
  refreshDetailUI(updated);
}

async function addExpenseToCurrentTrip() {
  const name = document.getElementById("expenseName").value.trim();
  const paidById = parseInt(document.getElementById("expensePaidBy").value);
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  if (!name) { alert("Expense name required"); return; }
  if (isNaN(amount) || amount <= 0) { alert("Valid amount > 0"); return; }
  await apiFetch(`${API_BASE}/trips/${currentTripId}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, paidById, amount })
  });
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
  const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
  refreshDetailUI(updated);
}

async function editTripDate() {
  const newDate = prompt("Enter trip date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
  if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    await apiFetch(`${API_BASE}/trips/${currentTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate })
    });
    const updated = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
    document.getElementById("tripDateDisplay").innerText = updated.date;
    refreshDetailUI(updated);
  } else if (newDate) alert("Invalid date format. Use YYYY-MM-DD.");
}

// Export/Import using API data
async function exportAllData() {
  const trips = await apiFetch(`${API_BASE}/trips`);
  const data = { trips };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tripdata_${new Date().toISOString().slice(0,19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportCurrentTrip() {
  if (!currentTripId) return;
  const trip = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
  const data = { type: 'single_trip', trip };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.getElementById('importFileInput');
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.type === 'single_trip' && imported.trip) {
          const tripData = imported.trip;
          delete tripData._id;
          tripData.members = tripData.members || [];
          tripData.expenses = tripData.expenses || [];
          tripData.photos = tripData.photos || [];
          await apiFetch(`${API_BASE}/trips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tripData.name, date: tripData.date, members: tripData.members, expenses: tripData.expenses, photos: tripData.photos })
          });
          alert(`Trip "${tripData.name}" imported successfully!`);
          loadTrips();
        } else if (imported.trips) {
          for (const t of imported.trips) {
            delete t._id;
            t.members = t.members || [];
            t.expenses = t.expenses || [];
            t.photos = t.photos || [];
            await apiFetch(`${API_BASE}/trips`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: t.name, date: t.date, members: t.members, expenses: t.expenses, photos: t.photos })
            });
          }
          alert("All trips imported!");
          loadTrips();
        } else {
          alert("Invalid file format.");
        }
      } catch(err) { alert("Error parsing file: " + err.message); }
    };
    reader.readAsText(file);
    input.value = '';
  };
  input.click();
}

function shareSettlementOnWhatsApp() {
  (async () => {
    const trip = await apiFetch(`${API_BASE}/trips/${currentTripId}`);
    const totalExpense = trip.expenses.reduce((s, e) => s + e.amount, 0);
    const eachShare = totalExpense / (trip.members.length || 1);
    let message = `🏝️ *${trip.name}* - Expense Summary\n📅 ${trip.date || 'No date'}\n💰 Total: ₹${totalExpense.toFixed(2)}\n👥 Each pays: ₹${eachShare.toFixed(2)}\n\n📋 Paid:\n`;
    const paidMap = new Map();
    trip.members.forEach(m => paidMap.set(m.id, 0));
    trip.expenses.forEach(exp => paidMap.set(exp.paidById, paidMap.get(exp.paidById) + exp.amount));
    trip.members.forEach(m => { message += `• ${m.name}: ₹${paidMap.get(m.id).toFixed(2)}\n`; });
    message += `\n🔄 Settlement:\n`;
    const transactions = getTransactions(trip);
    if (transactions.length) {
      transactions.forEach(tx => { message += `${tx.fromName} pays ${tx.toName} ₹${tx.amount.toFixed(2)}\n`; });
    } else message += "✨ All settled up!";
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  })();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function bindEvents() {
  document.getElementById("newTripBtn")?.addEventListener("click", createNewTrip);
  document.getElementById("backToTripsBtn")?.addEventListener("click", showTripListView);
  document.getElementById("addMemberBtn")?.addEventListener("click", addMemberToCurrentTrip);
  document.getElementById("addExpenseBtn")?.addEventListener("click", addExpenseToCurrentTrip);
  document.getElementById("uploadPhotoBtn")?.addEventListener("click", handlePhotoUpload);
  document.getElementById("shareWhatsappBtn")?.addEventListener("click", shareSettlementOnWhatsApp);
  document.getElementById("editTripDateBtn")?.addEventListener("click", editTripDate);
  document.getElementById("exportAllBtn")?.addEventListener("click", exportAllData);
  document.getElementById("importBtn")?.addEventListener("click", importData);
  document.getElementById("exportTripBtn")?.addEventListener("click", exportCurrentTrip);
  document.getElementById("memberNameInput")?.addEventListener("keypress", (e) => { if (e.key === "Enter") addMemberToCurrentTrip(); });
  document.getElementById("expenseAmount")?.addEventListener("keypress", (e) => { if (e.key === "Enter") addExpenseToCurrentTrip(); });
}

// Initialize
bindEvents();
loadTrips();
showTripListView();