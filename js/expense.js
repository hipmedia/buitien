const expenseModule = {
    data: [],
    filteredData: [],

    init: function(data) {
        this.data = [...data];
        this.setupEvents();
        this.applyFilters();
    },

    setupEvents: function() {
        document.getElementById('exp-search').oninput = () => this.applyFilters();
        document.getElementById('exp-filter-month').onchange = () => this.applyFilters();
        document.getElementById('exp-btn-clear').onclick = () => {
            document.getElementById('exp-search').value = '';
            document.getElementById('exp-filter-month').value = '';
            this.applyFilters();
        };
    },

    applyFilters: function() {
        const search = document.getElementById('exp-search').value.toLowerCase();
        const monthVal = document.getElementById('exp-filter-month').value;

        this.filteredData = this.data.filter(item => {
            const matchSearch = !search || 
                item.NguoiChi.toLowerCase().includes(search) || 
                item.HangMuc.toLowerCase().includes(search) ||
                (item.GhiChu && item.GhiChu.toLowerCase().includes(search));

            let matchMonth = true;
            if (monthVal) {
                const dateObj = new Date(item.Ngay);
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                matchMonth = `${yyyy}-${mm}` === monthVal;
            }
            return matchSearch && matchMonth;
        });

        this.filteredData.sort((a, b) => new Date(b.Ngay) - new Date(a.Ngay));
        this.renderTable();
    },

    renderTable: function() {
        const tbody = document.getElementById('expense-table-body');
        tbody.innerHTML = '';

        this.filteredData.forEach(item => {
            const formattedDate = new Date(item.Ngay).toLocaleDateString('vi-VN');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td class="fw-bold">${item.NguoiChi}</td>
                <td><span class="badge bg-secondary">${item.HangMuc}</span></td>
                <td class="fw-bold text-end text-danger">-${formatCurrency(item.SoTien)}</td>
                <td class="text-wrap" style="max-width: 200px;"><small class="text-muted">${item.GhiChu || ''}</small></td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="expenseModule.openEditModal(${item.ID})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="expenseModule.deleteItem(${item.ID})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openAddModal: function() {
        document.getElementById('expenseModalLabel').innerText = "Ghi chép khoản chi mới";
        document.getElementById('expense-form').reset();
        document.getElementById('exp-form-id').value = '';
        document.getElementById('exp-form-date').valueAsDate = new Date();
        expenseModalInstance.show();
    },

    openEditModal: function(id) {
        const item = this.data.find(x => x.ID === id);
        if (!item) return;
        document.getElementById('expenseModalLabel').innerText = "Sửa khoản chi";
        document.getElementById('exp-form-id').value = item.ID;
        
        const dateObj = new Date(item.Ngay);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        
        document.getElementById('exp-form-date').value = `${yyyy}-${mm}-${dd}`;
        document.getElementById('exp-form-person').value = item.NguoiChi;
        document.getElementById('exp-form-category').value = item.HangMuc;
        document.getElementById('exp-form-amount').value = item.SoTien;
        document.getElementById('exp-form-notes').value = item.GhiChu || '';

        expenseModalInstance.show();
    },

    deleteItem: async function(id) {
        const result = await Swal.fire({
            title: 'Xóa khoản chi?', text: "Dữ liệu không thể khôi phục!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
        });
        if (!result.isConfirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`${CONFIG.API_URL}?action=deleteExpense`, { method: 'POST', body: JSON.stringify({ ID: id }) });
            const resData = await res.json();
            showLoading(false);
            if (resData.status === 'success') {
                Swal.fire({ icon: 'success', title: 'Đã xóa', timer: 1000, showConfirmButton: false });
                fetchData();
            } else { Swal.fire({ icon: 'error', title: 'Lỗi', text: resData.message }); }
        } catch (error) {
            showLoading(false); Swal.fire({ icon: 'error', title: 'Lỗi mạng', text: 'Không kết nối được server' });
        }
    }
};