const chartModule = {
    instances: {},
    destroyChart: function(id) {
        if (this.instances[id]) {
            this.instances[id].destroy();
            delete this.instances[id];
        }
    },
    createBarChart: function(canvasId, labels, data, datasetLabel) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: datasetLabel, data: data, backgroundColor: '#4299e1', borderWidth: 0, borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    },
    createPieChart: function(canvasId, labels, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        this.instances[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: ['#48bb78', '#38b2ac', '#4299e1', '#9f7aea', '#ed64a6', '#f6ad55', '#dc3545'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },
    createLineChart: function(canvasId, labels, data, datasetLabel) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: datasetLabel, data: data, borderColor: '#9f7aea', backgroundColor: 'rgba(159, 122, 234, 0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }
};

const statisticsModule = {
    init: function(data) {
        const now = new Date();
        const currentYear = now.getFullYear();

        const monthlyData = Array(12).fill(0);
        const yearlyMap = {};
        const serviceMap = {};
        const statusMap = { 'Chờ xác nhận': 0, 'Chưa thanh toán': 0, 'Đã cọc': 0, 'Đang xử lý': 0, 'Đã hoàn thành': 0, 'Đã hủy': 0 };

        data.forEach(item => {
            const date = new Date(item.Ngay);
            const yr = date.getFullYear();
            const val = Number(item.GiaTri || 0);
            
            if (statusMap[item.TrangThai] !== undefined) statusMap[item.TrangThai]++;

            if (item.TrangThai === 'Đã hoàn thành') {
                if (yr === currentYear) monthlyData[date.getMonth()] += val;
                yearlyMap[yr] = (yearlyMap[yr] || 0) + val;
                const svc = item.DichVu || 'Khác';
                serviceMap[svc] = (serviceMap[svc] || 0) + val;
            }
        });

        chartModule.createBarChart('chart-stat-month', ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'], monthlyData, `Doanh thu năm ${currentYear}`);
        chartModule.createLineChart('chart-stat-year', Object.keys(yearlyMap).sort(), Object.values(yearlyMap), 'Doanh thu qua các năm');
        chartModule.createPieChart('chart-stat-service', Object.keys(serviceMap), Object.values(serviceMap));
        chartModule.createPieChart('chart-stat-status', Object.keys(statusMap), Object.values(statusMap));
    }
};