// API для работы с бэкендом
const API = {
    baseURL: 'http://localhost:8000', // Замените на ваш URL
    
    // Получить услуги
    async getServices() {
        try {
            const response = await fetch(`${this.baseURL}/services`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Возвращаем тестовые данные если бэкенд не работает
            return [
                { id: 1, name: '💇‍♀️ Стрижка женская', price: 2500, duration: 60 },
                { id: 2, name: '💇‍♂️ Стрижка мужская', price: 1500, duration: 30 },
                { id: 3, name: '🎨 Окрашивание', price: 4500, duration: 120 },
                { id: 4, name: '💅 Маникюр', price: 1800, duration: 60 }
            ];
        }
    },
    
    // Получить мастеров
    async getMasters() {
        try {
            const response = await fetch(`${this.baseURL}/masters`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [
                { id: 1, name: 'Анна', specialty: 'Женские стрижки' },
                { id: 2, name: 'Дмитрий', specialty: 'Мужские стрижки' },
                { id: 3, name: 'Елена', specialty: 'Маникюр' }
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
                slots.push(`${hour}:00`);
                slots.push(`${hour}:30`);
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
                body: JSON.stringify(booking)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Для тестов сохраняем в localStorage
            const bookings = Utils.getFromLocalStorage('bookings') || [];
            const newBooking = {
                ...booking,
                id: Date.now(),
                status: 'active',
                created_at: new Date().toISOString()
            };
            bookings.push(newBooking);
            Utils.saveToLocalStorage('bookings', bookings);
            return { status: 'ok', message: 'Запись создана (тест)', booking_id: newBooking.id };
        }
    },
    
    // Получить записи пользователя
    async getUserBookings(userId) {
        try {
            const response = await fetch(`${this.baseURL}/bookings/${userId}`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Получаем из localStorage
            const bookings = Utils.getFromLocalStorage('bookings') || [];
            return bookings.filter(b => b.user_id === userId && b.status === 'active');
        }
    },
    
    // Отменить запись
    async cancelBooking(bookingId) {
        try {
            const response = await fetch(`${this.baseURL}/booking/${bookingId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Ошибка отмены');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Обновляем в localStorage
            const bookings = Utils.getFromLocalStorage('bookings') || [];
            const updatedBookings = bookings.map(b => 
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
            );
            Utils.saveToLocalStorage('bookings', updatedBookings);
            return { status: 'ok', message: 'Запись отменена (тест)' };
        }
    }
};