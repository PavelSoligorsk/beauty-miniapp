// API для работы с бэкендом
const API = {
    baseURL: 'http://localhost:8000', // Замените на ваш URL после деплоя
    
    // Получить услуги
    async getServices() {
        try {
            const response = await fetch(`${this.baseURL}/services`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            const data = await response.json();
            // Бэкенд возвращает данные с полями id, name, price, duration
            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Фолбэк на тестовые данные
            return [
                { id: 1, name: '💇‍♀️ Стрижка женская', price: 2500, duration: 60 },
                { id: 2, name: '💇‍♂️ Стрижка мужская', price: 1500, duration: 30 },
                { id: 3, name: '🎨 Окрашивание', price: 4500, duration: 120 },
                { id: 4, name: '💅 Маникюр', price: 1800, duration: 60 }
            ];
        }
    },
    
    // Получить мастеров (с их услугами)
    async getMasters() {
        try {
            const response = await fetch(`${this.baseURL}/masters`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            const data = await response.json();
            // Бэкенд возвращает мастеров с полями id, name, specialty, services
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return [
                { id: 1, name: 'Анна', specialty: 'Женские стрижки, окрашивание', services: [] },
                { id: 2, name: 'Дмитрий', specialty: 'Мужские стрижки, барбер', services: [] },
                { id: 3, name: 'Елена', specialty: 'Маникюр, педикюр', services: [] },
                { id: 4, name: 'Мария', specialty: 'Уход за лицом, визаж', services: [] }
            ];
        }
    },
    
    // Получить свободные слоты
    async getSlots(date, masterId) {
        try {
            const response = await fetch(`${this.baseURL}/slots?date=${date}&master_id=${masterId}`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Генерируем тестовые слоты
            const slots = [];
            for (let hour = 10; hour < 20; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`);
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
            return slots;
        }
    },
    
    // Создать запись
    async createBooking(booking) {
        try {
            const response = await fetch(`${this.baseURL}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: booking.service_id,
                    master_id: booking.master_id,
                    date: booking.date,
                    time: booking.time,
                    user_id: booking.user_id,
                    user_name: booking.user_name,
                    notes: booking.notes || null
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Ошибка создания');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Получить записи пользоаавателя
    async getUserBookings(userId) {
        try {
            const response = await fetch(`${this.baseURL}/bookings/${userId}`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },
    
    // Отменить запись
    async cancelBooking(bookingId) {
        try {
            const response = await fetch(`${this.baseURL}/booking/${bookingId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Ошибка отмены');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

        async getAdminStats() {
        try {
            const response = await fetch(`${this.baseURL}/admin/stats`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            console.error('Stats Error:', error);
            return {
                total_bookings: 0,
                active_bookings: 0,
                active_services: 0,
                active_masters: 0,
                monthly_revenue: 0
            };
        }
    }
};