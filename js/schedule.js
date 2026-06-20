const scheduleModule = {
    data: [],
    filteredData: [],
    currentSort: { column: 'ID', asc: true },
    viewMode: 'list',
    calendarDate: new Date(),

    init: function(data) {
        this.data = [...data];
        this.injectStyles();
        this.setupEvents();
        this.applyFilters();
    },

    setupEvents: function() {
        document.getElementById('sched-search').oninput = () => this.applyFilters();
        document.getElementById('sched-filter-status').onchange = () => this.applyFilters();
        document.getElementById('sched-filter-date').onchange = () => this.applyFilters();
        document.getElementById('sched-btn-clear').onclick = () => {
            document.getElementById('sched-search').value = '';
            document.getElementById('sched-filter-status').value = '';
            document.getElementById('sched-filter-date').value = '';
            this.applyFilters();
        };

        // Tự động thêm các nút chuyển đổi (List/Calendar) và wrapper responsive cho table
        const tbody = document.getElementById('schedule-table-body');
        if (tbody) {
            const table = tbody.closest('table');
            if (table) table.classList.add('table-hover', 'table-striped');
            if (table && !document.getElementById('schedule-view-controls')) {
                const controlsDiv = document.createElement('div');
                controlsDiv.id = 'schedule-view-controls';
                controlsDiv.className = 'd-flex justify-content-between align-items-center mb-3';
                controlsDiv.innerHTML = `
                    <div class="fw-bold text-primary" id="calendar-month-display" style="display:none; font-size:1.1rem;"></div>
                    <div class="btn-group shadow-sm ms-auto" role="group">
                        <button type="button" class="btn btn-outline-primary active" id="btn-view-list" onclick="scheduleModule.toggleView('list')"><i class="bi bi-list-task"></i> Danh sách</button>
                        <button type="button" class="btn btn-outline-primary" id="btn-view-calendar" onclick="scheduleModule.toggleView('calendar')"><i class="bi bi-calendar3"></i> Lịch</button>
                    </div>
                `;
                table.parentNode.insertBefore(controlsDiv, table);

                const tableContainer = document.createElement('div');
                tableContainer.id = 'schedule-table-container';
                tableContainer.className = 'table-responsive';
                table.parentNode.insertBefore(tableContainer, table);
                tableContainer.appendChild(table);

                const calContainer = document.createElement('div');
                calContainer.id = 'schedule-calendar-view';
                calContainer.className = 'd-none';
                tableContainer.parentNode.insertBefore(calContainer, tableContainer.nextSibling);
            }
        }
    },

    applyFilters: function() {
        const search = document.getElementById('sched-search').value.toLowerCase();
        const status = document.getElementById('sched-filter-status').value;
        const dateVal = document.getElementById('sched-filter-date').value;

        this.filteredData = this.data.filter(item => {
            const matchSearch = !search || 
                (item.KhachHang || '').toLowerCase().includes(search) || 
                String(item.SoDienThoai || '').includes(search) || 
                (item.DichVu || '').toLowerCase().includes(search) ||
                (item.NhanSu && item.NhanSu.toLowerCase().includes(search));

            const matchStatus = !status || item.TrangThai === status;
            
            let matchDate = true;
            // Chỉ lọc theo ngày khi ở chế độ xem danh sách, không áp dụng cho lịch
            if (dateVal && this.viewMode === 'list') {
                const d1 = new Date(item.Ngay).setHours(0,0,0,0);
                const d2 = new Date(dateVal).setHours(0,0,0,0);
                matchDate = d1 === d2;
            }

            return matchSearch && matchStatus && matchDate;
        });

        this.sort(this.currentSort.column, false);
    },

    sort: function(column, toggle = true) {
        if (toggle) {
            if (this.currentSort.column === column) {
                this.currentSort.asc = !this.currentSort.asc;
            } else {
                this.currentSort.column = column;
                this.currentSort.asc = true;
            }
        }
        this.filteredData.sort((a, b) => {
            let valA = a[column]; let valB = b[column];
            if (column === 'Ngay') { valA = new Date(valA); valB = new Date(valB); }
            if (valA < valB) return this.currentSort.asc ? -1 : 1;
            if (valA > valB) return this.currentSort.asc ? 1 : -1;
            return 0;
        });
        this.renderTable();
    },

    renderTable: function() {
        if (this.viewMode === 'calendar') {
            document.getElementById('schedule-table-container')?.classList.add('d-none');
            document.getElementById('schedule-calendar-view')?.classList.remove('d-none');
            if(document.getElementById('calendar-month-display')) document.getElementById('calendar-month-display').style.display = 'block';
            this.renderCalendar();
        } else {
            document.getElementById('schedule-table-container')?.classList.remove('d-none');
            document.getElementById('schedule-calendar-view')?.classList.add('d-none');
            if(document.getElementById('calendar-month-display')) document.getElementById('calendar-month-display').style.display = 'none';
            this.renderTableList();
        }
    },

    renderTableList: function() {
        const tbody = document.getElementById('schedule-table-body');
        tbody.innerHTML = '';

        this.filteredData.forEach(item => {
            const formattedDate = new Date(item.Ngay).toLocaleDateString('vi-VN');
            
            let conNo = (Number(item.GiaTri) - Number(item.DaThu || 0));
            if (item.TrangThai === 'Đã hoàn thành') {
                conNo = 0;
            }
            
            const noText = conNo > 0 ? formatCurrency(conNo) : '0đ';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-muted align-middle">#${item.ID}</td>
                <td class="text-nowrap align-middle"><i class="bi bi-calendar2-week text-secondary me-2"></i>${formattedDate}</td>
                <td class="fw-bold text-primary align-middle">${item.KhachHang}</td>
                <td class="align-middle"><a href="tel:${item.SoDienThoai}" class="text-decoration-none text-dark"><i class="bi bi-telephone text-muted me-1"></i>${item.SoDienThoai}</a></td>
                <td class="align-middle"><span class="badge border bg-light text-dark"><i class="bi bi-tag-fill text-secondary me-1"></i>${item.DichVu}</span></td>
                <td class="align-middle"><span class="small fw-medium text-info"><i class="bi bi-person-badge me-1"></i>${item.NhanSu || 'Chưa xếp'}</span></td>
                <td class="text-end fw-bold text-success align-middle">${formatCurrency(item.GiaTri)}</td>
                <td class="text-end fw-bold align-middle ${conNo > 0 ? 'text-danger' : 'text-muted'}">${noText}</td>
                <td class="text-center align-middle"><span class="badge ${getStatusBadgeClass(item.TrangThai)}">${item.TrangThai}</span></td>
                <td class="text-center text-nowrap align-middle">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Thao tác</button>
                        <ul class="dropdown-menu dropdown-menu-end shadow">
                            <li><a class="dropdown-item" href="#" onclick="scheduleModule.openEditModal(${item.ID})"><i class="bi bi-pencil me-2 text-primary"></i> Sửa lịch</a></li>
                            <li><a class="dropdown-item" href="#" onclick="scheduleModule.exportPDF(${item.ID}, 'Báo Giá')"><i class="bi bi-file-earmark-pdf me-2 text-warning"></i> Xuất Báo giá</a></li>
                            <li><a class="dropdown-item" href="#" onclick="scheduleModule.exportPDF(${item.ID}, 'Hóa Đơn')"><i class="bi bi-receipt me-2 text-success"></i> Xuất Hóa đơn</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="scheduleModule.deleteItem(${item.ID})"><i class="bi bi-trash me-2"></i> Xóa</a></li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    toggleView: function(mode) {
        this.viewMode = mode;
        document.getElementById('btn-view-list')?.classList.toggle('active', mode === 'list');
        document.getElementById('btn-view-calendar')?.classList.toggle('active', mode === 'calendar');
        // Lọc lại dữ liệu khi chuyển view để áp dụng đúng quy tắc (ví dụ: bỏ qua filter ngày ở view lịch)
        this.applyFilters();
    },

    prevMonth: function() {
        this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
        this.renderCalendar();
    },

    nextMonth: function() {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
        this.renderCalendar();
    },

    renderCalendar: function() {
        const calContainer = document.getElementById('schedule-calendar-view');
        const monthDisplay = document.getElementById('calendar-month-display');
        if (!calContainer) return;

        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();

        if (monthDisplay) {
            monthDisplay.innerHTML = `
                <button class="btn btn-sm btn-outline-secondary me-2" onclick="scheduleModule.prevMonth()"><i class="bi bi-chevron-left"></i></button>
                <span class="text-uppercase">Tháng ${month + 1} / ${year}</span>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="scheduleModule.nextMonth()"><i class="bi bi-chevron-right"></i></button>
            `;
        }

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startDay = firstDay === 0 ? 6 : firstDay - 1;

        let html = `<div class="calendar-grid">`;
        const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        daysOfWeek.forEach(d => {
            html += `<div class="text-center fw-bold small py-2 bg-light border rounded text-secondary">${d}</div>`;
        });

        for(let i=0; i<startDay; i++) {
            html += `<div class="calendar-cell bg-light opacity-50 border-0"></div>`;
        }

        for(let d=1; d<=daysInMonth; d++) {
            const dayItems = this.filteredData.filter(item => {
                if (!item.Ngay) return false;
                const itemD = new Date(item.Ngay);
                return itemD.getFullYear() === year && itemD.getMonth() === month && itemD.getDate() === d;
            });

            let itemsHtml = dayItems.map(item => `
                <div class="calendar-item badge ${getStatusBadgeClass(item.TrangThai)} w-100" onclick="scheduleModule.openEditModal(${item.ID})" title="${item.KhachHang} - ${item.DichVu}">
                    ${item.KhachHang} - ${item.DichVu}
                </div>
            `).join('');

            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
            const todayClass = isToday ? 'today' : '';

            html += `
                <div class="calendar-cell ${todayClass}">
                    <div class="calendar-cell-header ${isToday ? 'text-primary' : ''}">${d}</div>
                    <div class="calendar-cell-content">${itemsHtml}</div>
                </div>
            `;
        }
        html += `</div>`;
        calContainer.innerHTML = html;
    },

    injectStyles: function() {
        if (document.getElementById('schedule-custom-styles')) return;
        const style = document.createElement('style');
        style.id = 'schedule-custom-styles';
        style.innerHTML = `
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
            .calendar-cell { min-height: 100px; overflow: hidden; display: flex; flex-direction: column; background: #fff; border: 1px solid #dee2e6; border-radius: 6px; padding: 4px; }
            .calendar-cell.today { background-color: rgba(13, 202, 240, 0.05); border: 2px solid #0dcaf0; }
            .calendar-cell-header { text-align: right; font-weight: bold; font-size: 0.85rem; margin-bottom: 4px; color: #495057; }
            .calendar-cell-content { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; }
            .calendar-item { font-size: 0.75rem; cursor: pointer; text-align: left; padding: 4px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: opacity 0.2s;}
            .calendar-item:hover { opacity: 0.8; }
            @media (max-width: 768px) {
                .calendar-grid { gap: 2px; }
                .calendar-cell { min-height: 80px; padding: 2px; border-radius: 4px; }
                .calendar-item { font-size: 0.65rem; padding: 2px 4px; }
            }
        `;
        document.head.appendChild(style);
    },

    openAddModal: function() {
        document.getElementById('scheduleModalLabel').innerText = "Thêm lịch mới";
        document.getElementById('schedule-form').reset();
        document.getElementById('form-id').value = '';
        document.getElementById('form-debt-display').innerText = '0đ';
        scheduleModalInstance.show();
    },

    openEditModal: function(id) {
        const item = this.data.find(x => x.ID === id);
        if (!item) return;
        document.getElementById('scheduleModalLabel').innerText = "Cập nhật lịch làm việc";
        document.getElementById('form-id').value = item.ID;
        
        const dateObj = new Date(item.Ngay);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        
        document.getElementById('form-date').value = `${yyyy}-${mm}-${dd}`;
        document.getElementById('form-customer').value = item.KhachHang;
        document.getElementById('form-phone').value = item.SoDienThoai;
        document.getElementById('form-service').value = item.DichVu;
        document.getElementById('form-crew').value = item.NhanSu || '';
        document.getElementById('form-value').value = item.GiaTri;
        document.getElementById('form-paid').value = item.DaThu || 0;
        document.getElementById('form-status').value = item.TrangThai;
        document.getElementById('form-notes').value = item.GhiChu || '';

        calculateDebt();
        scheduleModalInstance.show();
    },

    deleteItem: async function(id) {
        const result = await Swal.fire({
            title: 'Xác nhận xóa', text: 'Dữ liệu không thể khôi phục.', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy'
        });
        if (!result.isConfirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`${CONFIG.API_URL}?action=deleteSchedule`, { method: 'POST', body: JSON.stringify({ ID: id }) });
            const resData = await res.json();
            showLoading(false);
            if (resData.status === 'success') {
                Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1500, showConfirmButton: false });
                fetchData();
            } else { Swal.fire({ icon: 'error', title: 'Lỗi', text: resData.message }); }
        } catch (error) {
            showLoading(false); Swal.fire({ icon: 'error', title: 'Lỗi mạng' });
        }
    },

    exportPDF: function(id, type) {
        const item = this.data.find(x => x.ID === id);
        if(!item) return;
        
        this.currentExportFilename = `${type === 'Báo Giá' ? 'BaoGia' : 'HoaDon'}_${item.KhachHang}.pdf`;

        document.getElementById('pdf-doc-title').innerText = type.toUpperCase();
        document.getElementById('pdf-date').innerText = new Date().toLocaleDateString('vi-VN');
        document.getElementById('pdf-id').innerText = item.ID;
        document.getElementById('pdf-customer').innerText = item.KhachHang;
        document.getElementById('pdf-phone').innerText = item.SoDienThoai;
        document.getElementById('pdf-service').innerText = item.DichVu;
        document.getElementById('pdf-total').innerText = formatCurrency(item.GiaTri);
        document.getElementById('pdf-total-summary').innerText = formatCurrency(item.GiaTri);
        
        let debt = Number(item.GiaTri) - Number(item.DaThu || 0);
        if(item.TrangThai === 'Đã hoàn thành') debt = 0;
        
        if(type === 'Báo Giá') {
            document.getElementById('pdf-paid-row').style.display = 'none';
            document.getElementById('pdf-debt-row').style.display = 'none';
        } else {
            document.getElementById('pdf-paid-row').style.display = 'table-row';
            document.getElementById('pdf-debt-row').style.display = 'table-row';
            document.getElementById('pdf-paid').innerText = formatCurrency(item.DaThu || 0);
            document.getElementById('pdf-debt').innerText = formatCurrency(debt < 0 ? 0 : debt);
        }

        const pdfModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('pdfPreviewModal'));
        pdfModal.show();
    },

    executeExportPDF: function() {
        // Bỏ focus các thành phần đang edit (nếu có) để khi chụp PDF không bị dính viền outline
        if (document.activeElement) {
            document.activeElement.blur();
        }

        const element = document.getElementById('pdf-template');
        const opt = {
            margin:       0,
            filename:     this.currentExportFilename || 'Tai_Lieu.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            const modalIns = bootstrap.Modal.getInstance(document.getElementById('pdfPreviewModal'));
            if (modalIns) modalIns.hide();
        });
    }
};