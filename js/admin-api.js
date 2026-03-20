// API для админ-панели (расширяет основной API)
const AdminAPI = {
    baseURL: 'http://localhost:8000',

    // Получить статистику
    async getStats() {
        try {
            const response = await fetch(`${this.baseURL}/admin/stats`);
            if (!response.ok) throw new Error('Ошибка загрузки статистики');
            return await response.json();
        } catch (error) {
            console.error('Stats Error:', error);
            // Фолбэк
            const services = await API.getServices();
            const masters = await API.getMasters();
            const bookings = await API.getUserBookings(0); // временно
            return {
                total_bookings: bookings.length,
                active_bookings: bookings.filter(b => b.status === 'active').length,
                active_services: services.length,
                active_masters: masters.length,
                monthly_revenue: 0
            };
        }
    },

    // Создать услугу
    async createService(service) {
        const response = await fetch(`${this.baseURL}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });
        if (!response.ok) throw new Error('Ошибка создания');
        return await response.json();
    },

    // Обновить услугу
    async updateService(id, service) {
        const response = await fetch(`${this.baseURL}/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });
        if (!response.ok) throw new Error('Ошибка обновления');
        return await response.json();
    },

    // Удалить услугу
    async deleteService(id, hard = false) {
        const response = await fetch(`${this.baseURL}/services/${id}?hard=${hard}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Ошибка удаления');
        return await response.json();
    },

    // Создать мастера
    async createMaster(master) {
        const response = await fetch(`${this.baseURL}/masters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(master)
        });
        if (!response.ok) throw new Error('Ошибка создания');
        return await response.json();
    },

    // Обновить мастера
    async updateMaster(id, master) {
        const response = await fetch(`${this.baseURL}/masters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(master)
        });
        if (!response.ok) throw new Error('Ошибка обновления');
        return await response.json();
    },

    // Удалить мастера
    async deleteMaster(id, hard = false) {
        const response = await fetch(`${this.baseURL}/masters/${id}?hard=${hard}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Ошибка удаления');
        return await response.json();
    },

    // Получить все записи (для админа)
    async getAllBookings() {
        // Временно используем getStats, но нужно добавить эндпоинт в бэкенд
        // Пока возвращаем пустой массив
        return [];
    },

    // Отменить запись (админ)
    async adminCancelBooking(bookingId) {
        return await API.cancelBooking(bookingId);
    }
};