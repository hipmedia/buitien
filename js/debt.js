const debtModule = {
    init: function(data) {
        // Lọc TẤT CẢ các lịch chưa hoàn thành và chưa hủy 
        const debtList = data.filter(item => {
            return item.TrangThai !== 'Đã hoàn thành' && item.TrangThai !== 'Đã hủy';
        });
        
        // Tự động bọc wrapper table-responsive nếu chưa có để cuộn ngang trên điện thoại
        const tbody = document.getElementById('debt-table-body');
        if (tbody) {
            const table = tbody.closest('table');
            if (table && !table.parentElement.classList.contains('table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        }
        
        this.renderTable(debtList);
    },

    renderTable: function(items) {
        const tbody = document.getElementById('debt-table-body');
        tbody.innerHTML = '';
        let totalDebt = 0;

        items.sort((a,b) => new Date(b.Ngay) - new Date(a.Ngay));

        items.forEach(item => {
            let conNo = Number(item.GiaTri) - Number(item.DaThu || 0);
            if (conNo < 0) conNo = 0;
            
            totalDebt += conNo;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-nowrap align-middle">${new Date(item.Ngay).toLocaleDateString('vi-VN')}</td>
                <td class="fw-bold align-middle">${item.KhachHang}</td>
                <td class="align-middle"><a href="tel:${item.SoDienThoai}" class="text-decoration-none text-dark">${item.SoDienThoai}</a></td>
                <td class="align-middle"><span class="badge bg-secondary">${item.DichVu}</span></td>
                <td class="text-end fw-bold align-middle">${formatCurrency(item.GiaTri)}</td>
                <td class="text-end text-success align-middle">${formatCurrency(item.DaThu || 0)}</td>
                <td class="text-end fw-bold text-danger align-middle">${formatCurrency(conNo)}</td>
                <td class="text-center align-middle">
                    <button class="btn btn-sm btn-success" onclick="debtModule.quickPay(${item.ID}, ${conNo})">Thu tiền</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('total-debt-amount').innerText = formatCurrency(totalDebt);
    },

    quickPay: async function(id, conNo) {
        const { value: amount } = await Swal.fire({
            title: 'Thu tiền & Hoàn thành lịch',
            text: 'Nhập số tiền khách thanh toán. Lịch này sẽ tự động chuyển sang trạng thái "Đã hoàn thành".',
            input: 'number',
            inputValue: conNo,
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Lưu xác nhận',
            cancelButtonText: 'Hủy'
        });

        if (amount !== undefined && amount !== null && amount !== '') {
            const item = appData.find(x => x.ID === id);
            item.DaThu = Number(item.DaThu || 0) + Number(amount);
            
            // TỰ ĐỘNG CHUYỂN TRẠNG THÁI VỀ ĐÃ HOÀN THÀNH
            item.TrangThai = 'Đã hoàn thành';
            
            showLoading(true);
            try {
                await fetch(`${CONFIG.API_URL}?action=updateSchedule`, {
                    method: 'POST',
                    body: JSON.stringify(item)
                });
                fetchData();
            } catch(e) {
                Swal.fire('Lỗi', 'Không thể cập nhật dữ liệu. Vui lòng kiểm tra mạng!', 'error');
                showLoading(false);
            }
        }
    }
};