const rows = [
  { bus: 'BUS-01', plate: '10-1234', route: 'R1', status: 'ON', lastSeen: '10 sec ago' },
  { bus: 'BUS-02', plate: '20-5678', route: 'R2', status: 'OFF', lastSeen: '5 min ago' },
  { bus: 'BUS-03', plate: '30-9012', route: 'R1', status: 'MAINTENANCE', lastSeen: '1 hour ago' },
];

const tbody = document.getElementById('bus-table');
rows.forEach((row) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${row.bus}</td>
    <td>${row.plate}</td>
    <td>${row.route}</td>
    <td>${row.status}</td>
    <td>${row.lastSeen}</td>
  `;
  tbody.appendChild(tr);
});
