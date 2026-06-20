const dashboardModule = {
    init: function(data, expData) {
        this.renderCards(data, expData);
        this.renderCharts(data);
    },

    renderCards: function(data, expData) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        let revMonth = 0; let revYear = 0;
        let expMonth = 0; let expYear = 0;
        let pending = 0; let done = 0; let cancel = 0;

        data.forEach(item => {
            const date = new Date(item.Ngay);
            const itemMonth = date.getMonth() + 1;
            const itemYear = date.getFullYear();

            if (item.TrangThai === 'Đã hoàn thành') {
                if (itemYear === currentYear) {
                    revYear += Number(item.GiaTri || 0);
                    if (itemMonth === currentMonth) {
                        revMonth += Number(item.GiaTri || 0);
                    }
                }
            }
            if (item.TrangThai === 'Chờ xác nhận' || item.TrangThai === 'Chưa thanh toán') pending++;
            else if (item.TrangThai === 'Đã hoàn thành') done++;
            else if (item.TrangThai === 'Đã hủy') cancel++;
        });

        expData.forEach(item => {
            const date = new Date(item.Ngay);
            const itemMonth = date.getMonth() + 1;
            const itemYear = date.getFullYear();
            if (itemYear === currentYear) {
                expYear += Number(item.SoTien || 0);
                if (itemMonth === currentMonth) {
                    expMonth += Number(item.SoTien || 0);
                }
            }
        });

        const profitMonth = revMonth - expMonth;
        const profitYear = revYear - expYear;

        document.getElementById('db-rev-month').innerText = formatCurrency(revMonth);
        document.getElementById('db-exp-month').innerText = formatCurrency(expMonth);
        const profitMonthEl = document.getElementById('db-profit-month');
        profitMonthEl.innerText = formatCurrency(profitMonth);
        const cardProfitMonth = document.getElementById('card-profit-month');
        if (profitMonth < 0) cardProfitMonth.classList.replace('bg-success', 'bg-secondary');
        else cardProfitMonth.classList.replace('bg-secondary', 'bg-success');

        document.getElementById('db-rev-year').innerText = formatCurrency(revYear);
        document.getElementById('db-exp-year').innerText = formatCurrency(expYear);
        const profitYearEl = document.getElementById('db-profit-year');
        profitYearEl.innerText = formatCurrency(profitYear);
        const cardProfitYear = document.getElementById('card-profit-year');
        if (profitYear < 0) cardProfitYear.classList.replace('bg-success', 'bg-secondary');
        else cardProfitYear.classList.replace('bg-secondary', 'bg-success');

        document.getElementById('db-status-pending').innerText = pending;
        document.getElementById('db-status-done').innerText = done;
        document.getElementById('db-status-cancel').innerText = cancel;
    },

    renderCharts: function(data) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const monthlyData = Array(12).fill(0);
        const serviceMap = {};

        data.forEach(item => {
            const date = new Date(item.Ngay);
            if (date.getFullYear() === currentYear && item.TrangThai === 'Đã hoàn thành') {
                monthlyData[date.getMonth()] += Number(item.GiaTri || 0);
                const svc = item.DichVu || 'Khác';
                serviceMap[svc] = (serviceMap[svc] || 0) + Number(item.GiaTri || 0);
            }
        });

        chartModule.createBarChart('chart-db-month', 
            ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'], 
            monthlyData, 'Doanh thu'
        );

        chartModule.createPieChart('chart-db-service', Object.keys(serviceMap), Object.values(serviceMap));
    }
};