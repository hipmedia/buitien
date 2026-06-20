const customerModule = {
    init: function(data) {
        const customers = {};

        data.forEach(item => {
            let rawPhone = item.SoDienThoai ? String(item.SoDienThoai) : '';
            let phone = rawPhone.replace(/\s+/g, '').replace(/^\+84/, '0').replace(/^'/, '');
            
            if (!phone) return; 

            if (!customers[phone]) {
                customers[phone] = { Name: item.KhachHang, Phone: phone, Count: 0, TotalSpend: 0 };
            } else {
                if (item.KhachHang) customers[phone].Name = item.KhachHang;
            }

            const status = item.TrangThai ? item.TrangThai.trim() : '';
            if (status && status !== 'Đã hủy') customers[phone].Count += 1;
            if (status === 'Đã hoàn thành') customers[phone].TotalSpend += Number(item.GiaTri || 0);
        });

        const validCustomers = Object.values(customers).filter(c => c.Count > 0);
        this.renderTable(validCustomers);
    },

    renderTable: function(customerList) {
        const tbody = document.getElementById('customer-table-body');
        tbody.innerHTML = '';
        customerList.sort((a, b) => {
            if (b.TotalSpend !== a.TotalSpend) return b.TotalSpend - a.TotalSpend;
            return b.Count - a.Count;
        });

        customerList.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${c.Name}</td>
                <td><a href="tel:${c.Phone}" class="text-decoration-none">${c.Phone}</a></td>
                <td class="text-center"><span class="badge bg-info text-dark rounded-pill px-3">${c.Count} lần</span></td>
                <td class="text-end fw-bold text-primary">${formatCurrency(c.TotalSpend)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};