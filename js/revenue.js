const revenueModule = {
    init: function(data) {
        this.calculateRevenue(data);
    },

    calculateRevenue: function(data) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday).getTime();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let dayRev = 0, weekRev = 0, monthRev = 0, yearRev = 0;
        const completedSchedules = [];

        data.forEach(item => {
            if (item.TrangThai !== 'Đã hoàn thành') return;
            const itemDate = new Date(item.Ngay);
            const itemTime = itemDate.getTime();
            const val = Number(item.GiaTri || 0);

            completedSchedules.push(item);
            if (itemTime >= startOfToday) dayRev += val;
            if (itemTime >= startOfWeek) weekRev += val;
            if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) monthRev += val;
            if (itemDate.getFullYear() === currentYear) yearRev += val;
        });

        document.getElementById('rev-day').innerText = formatCurrency(dayRev);
        document.getElementById('rev-week').innerText = formatCurrency(weekRev);
        document.getElementById('rev-month').innerText = formatCurrency(monthRev);
        document.getElementById('rev-year').innerText = formatCurrency(yearRev);

        this.renderTable(completedSchedules);
    },

    renderTable: function(items) {
        const tbody = document.getElementById('revenue-table-body');
        tbody.innerHTML = '';
        items.sort((a,b) => new Date(b.Ngay) - new Date(a.Ngay));

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.ID}</td>
                <td>${new Date(item.Ngay).toLocaleDateString('vi-VN')}</td>
                <td>${item.KhachHang}</td>
                <td><span class="badge bg-secondary">${item.DichVu}</span></td>
                <td class="text-end fw-bold text-success">${formatCurrency(item.GiaTri)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};