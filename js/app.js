let appData = [];
let expenseData = [];
let scheduleModalInstance;
let expenseModalInstance;

document.addEventListener("DOMContentLoaded", () => {
    scheduleModalInstance = new bootstrap.Modal(document.getElementById('scheduleModal'));
    expenseModalInstance = new bootstrap.Modal(document.getElementById('expenseModal'));
    initApp();
});

function initApp() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    document.getElementById('sidebarCollapse').addEventListener('click', () => {
        sidebar.classList.toggle('active');
        if(window.innerWidth <= 768) overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    setInterval(() => {
        const now = new Date();
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.innerText = now.toLocaleString('vi-VN');
    }, 1000);

    document.querySelectorAll('#sidebar ul.components li a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('#sidebar ul.components li').forEach(li => li.classList.remove('active'));
            this.parentElement.classList.add('active');
            switchSection(this.getAttribute('data-section'));
            if(window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });

    document.getElementById('schedule-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);

    fetchData();
}

function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    const sectionEl = document.getElementById(`section-${sectionId}`);
    if(sectionEl) sectionEl.classList.remove('d-none');
    
    const titles = {
        'dashboard': 'Dashboard',
        'schedule': 'Quản lý lịch làm việc',
        'debt': 'Quản lý công nợ',
        'revenue': 'Quản lý doanh thu',
        'expense': 'Quản lý chi phí',
        'customer': 'Danh sách khách hàng',
        'statistics': 'Thống kê phân tích'
    };
    document.getElementById('current-section-title').innerText = titles[sectionId] || 'Hệ thống';
    renderSection(sectionId);
}

async function fetchData() {
    showLoading(true);
    try {
        const [resSched, resExp] = await Promise.all([
            fetch(`${CONFIG.API_URL}?action=getSchedules`),
            fetch(`${CONFIG.API_URL}?action=getExpenses`)
        ]);
        
        const resultSched = await resSched.json();
        const resultExp = await resExp.json();

        if (resultSched.status === 'success' && resultExp.status === 'success') {
            appData = resultSched.data;
            expenseData = resultExp.data;
            
            const activeLink = document.querySelector('#sidebar ul.components li.active a');
            const currentSection = activeLink ? activeLink.getAttribute('data-section') : 'dashboard';
            renderSection(currentSection);
        } else {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Lỗi lấy dữ liệu từ hệ thống.' });
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Mất kết nối', text: 'Không thể kết nối đến API Server.' });
    } finally {
        showLoading(false);
    }
}

function renderSection(sectionId) {
    switch (sectionId) {
        case 'dashboard': dashboardModule.init(appData, expenseData); break;
        case 'schedule': scheduleModule.init(appData); break;
        case 'debt': debtModule.init(appData); break;
        case 'revenue': revenueModule.init(appData); break;
        case 'expense': expenseModule.init(expenseData); break;
        case 'customer': customerModule.init(appData); break;
        case 'statistics': statisticsModule.init(appData); break;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-id').value;
    const data = {
        Ngay: document.getElementById('form-date').value,
        KhachHang: document.getElementById('form-customer').value,
        SoDienThoai: document.getElementById('form-phone').value,
        DichVu: document.getElementById('form-service').value,
        GiaTri: Number(document.getElementById('form-value').value),
        DaThu: Number(document.getElementById('form-paid').value || 0),
        TrangThai: document.getElementById('form-status').value,
        NhanSu: document.getElementById('form-crew').value,
        GhiChu: document.getElementById('form-notes').value
    };

    showLoading(true);
    scheduleModalInstance.hide();

    try {
        let response = await fetch(`${CONFIG.API_URL}?action=${id ? 'updateSchedule' : 'addSchedule'}`, {
            method: 'POST',
            body: JSON.stringify(id ? { ...data, ID: Number(id) } : data)
        });
        const resData = await response.json();
        showLoading(false);
        if(resData.status === 'success') {
            Swal.fire({icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false});
            fetchData();
        } else {
            Swal.fire({icon: 'error', title: 'Lỗi', text: resData.message});
            scheduleModalInstance.show();
        }
    } catch (error) {
        showLoading(false);
        Swal.fire({icon: 'error', title: 'Lỗi mạng'});
    }
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('exp-form-id').value;
    const data = {
        Ngay: document.getElementById('exp-form-date').value,
        NguoiChi: document.getElementById('exp-form-person').value,
        HangMuc: document.getElementById('exp-form-category').value,
        SoTien: Number(document.getElementById('exp-form-amount').value),
        GhiChu: document.getElementById('exp-form-notes').value
    };

    showLoading(true);
    expenseModalInstance.hide();

    try {
        let response = await fetch(`${CONFIG.API_URL}?action=${id ? 'updateExpense' : 'addExpense'}`, {
            method: 'POST',
            body: JSON.stringify(id ? { ...data, ID: Number(id) } : data)
        });
        const resData = await response.json();
        showLoading(false);
        if(resData.status === 'success') {
            Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            fetchData();
        } else {
            Swal.fire({ icon: 'error', title: 'Thất bại', text: resData.message });
            expenseModalInstance.show();
        }
    } catch (error) {
        showLoading(false);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Lỗi kết nối CSDL.' });
        expenseModalInstance.show();
    }
}

function showLoading(show) { document.getElementById('loading-overlay').classList.toggle('d-none', !show); }
function formatCurrency(val) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val); }

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Chờ xác nhận': return 'badge-pending';
        case 'Chưa thanh toán': return 'bg-danger';
        case 'Đã cọc': return 'badge-deposited';
        case 'Đang xử lý': return 'badge-processing';
        case 'Đã hoàn thành': return 'badge-completed';
        case 'Đã hủy': return 'badge-cancelled';
        default: return 'bg-secondary';
    }
}