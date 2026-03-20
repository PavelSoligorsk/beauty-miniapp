// Панель мастера
const Master = {
    masterId: null,
    masterData: null,
    selectedDate: null,
    currentBooking: null,
    bookings: [],
    services: [],

    // Инициализация
    async init() {
        // Загружаем ID мастера из localStorage или запрашиваем
        let masterId = localStorage.getItem('master_id');
        
        if (!masterId) {
            masterId = prompt('Введите ваш ID мастера (1 - Анна, 2 - Дмитрий, 3 - Елена, 4 - Мария):');
            if (masterId) {
                localStorage.setItem('master_id', masterId);
            } else {
                alert('ID мастера обязателен');
                window.location.href = 'index.html';
                return;
            }
        }
        
        this.masterId = parseInt(masterId);
        await this.loadData();
        this.setupEventListeners();
        this.renderCalendar();
    },

    // Загрузка данных
    async loadData() {
        try {
            // Загружаем данные мастера
            const mastersResponse = await fetch('http://localhost:8000/masters');
            if (mastersResponse.ok) {
                const masters = await mastersResponse.json();
                this.masterData = masters.find(m => m.id === this.masterId);
                
                if (!this.masterData) {
                    alert('Мастер не найден!');
                    localStorage.removeItem('master_id');
                    window.location.href = 'index.html';
                    return;
                }
                
                // Обновляем информацию в шапке
                document.getElementById('master-info').innerHTML = `
                    <div class="master-name">${this.masterData.name}</div>
                    <div class="master-specialty">${this.masterData.specialty || ''}</div>
                `;
                
                // Заполняем форму настроек
                document.getElementById('master-name-settings').value = this.masterData.name;
                document.getElementById('master-specialty-settings').value = this.masterData.specialty || '';
                document.getElementById('master-phone').value = this.masterData.phone || '';
                document.getElementById('master-email').value = this.masterData.email || '';
            }
            
            // Загружаем услуги
            const servicesResponse = await fetch('http://localhost:8000/services');
            if (servicesResponse.ok) {
                this.services = await servicesResponse.json();
                
                // Заполняем список услуг в настройках
                const select = document.getElementById('master-services-settings');
                select.innerHTML = this.services.map(service => `
                    <option value="${service.id}" ${this.masterData?.services?.some(s => s.id === service.id) ? 'selected' : ''}>
                        ${service.name} (${service.price} ₽, ${service.duration} мин)
                    </option>
                `).join('');
            }
            
            // Загружаем записи
            await this.loadBookings();
            
            // Загружаем статистику
            await this.loadStats();
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.showMessage('Ошибка загрузки данных', 'error');
        }
    },

    // Загрузка записей
    async loadBookings(date = null) {
        try {
            // Загружаем все записи для этого мастера
            // Временно - загружаем все записи и фильтруем
            const testUserId = 1;
            const response = await fetch(`http://localhost:8000/bookings/${testUserId}`);
            if (response.ok) {
                const allBookings = await response.json();
                this.bookings = allBookings.filter(b => b.master_id === this.masterId);
            } else {
                this.bookings = [];
            }
            
            // Фильтруем по дате если указана
            if (date) {
                const filtered = this.bookings.filter(b => b.booking_date === date);
                this.renderBookings(filtered);
            } else {
                this.renderBookings(this.bookings);
            }
            
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
            this.bookings = [];
        }
    },

    // Отображение записей
    renderBookings(bookings) {
        const tbody = document.getElementById('bookings-list');
        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Нет записей</td></tr>';
            return;
        }
        
        tbody.innerHTML = bookings.map(booking => `
            <tr>
                <td>${booking.booking_time}</td>
                <td>${booking.user_name || 'Клиент'}</td>
                <td>${booking.service_name}</td>
                <td>
                    <span class="status-badge ${booking.status}">
                        ${booking.status === 'active' ? 'Активна' : 'Отменена'}
                    </span>
                </td>
                <td>
                    <button onclick="Master.viewBooking(${JSON.stringify(booking).replace(/"/g, '&quot;')})">Подробнее</button>
                </td>
            </tr>
        `).join('');
    },

    // Просмотр деталей записи
    viewBooking(booking) {
        this.currentBooking = booking;
        const modal = document.getElementById('booking-modal');
        const details = document.getElementById('booking-details');
        
        details.innerHTML = `
            <p><strong>Клиент:</strong> ${booking.user_name || 'Не указан'}</p>
            <p><strong>Услуга:</strong> ${booking.service_name}</p>
            <p><strong>Дата:</strong> ${booking.booking_date}</p>
            <p><strong>Время:</strong> ${booking.booking_time}</p>
            <p><strong>Статус:</strong> ${booking.status === 'active' ? 'Активна' : 'Отменена'}</p>
            ${booking.notes ? `<p><strong>Примечания:</strong> ${booking.notes}</p>` : ''}
        `;
        
        modal.classList.add('active');
    },

    // Отметить запись выполненной
    async completeBooking() {
        if (!this.currentBooking) return;
        
        if (confirm('Отметить запись как выполненную?')) {
            try {
                // Здесь нужно добавить эндпоинт для обновления статуса
                // Пока просто показываем сообщение
                this.showMessage('Запись отмечена как выполненная', 'success');
                this.closeBookingModal();
                await this.loadBookings();
                await this.loadStats();
            } catch (error) {
                this.showMessage('Ошибка', 'error');
            }
        }
    },

    // Отмена записи
    async cancelBookingFromModal() {
        if (!this.currentBooking) return;
        
        if (confirm('Отменить эту запись?')) {
            try {
                const response = await fetch(`http://localhost:8000/booking/${this.currentBooking.id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showMessage('Запись отменена', 'success');
                    this.closeBookingModal();
                    await this.loadBookings();
                    await this.loadStats();
                    this.renderCalendar();
                } else {
                    throw new Error('Ошибка отмены');
                }
            } catch (error) {
                this.showMessage('Ошибка отмены', 'error');
            }
        }
    },

    // Закрыть модальное окно
    closeBookingModal() {
        document.getElementById('booking-modal').classList.remove('active');
        this.currentBooking = null;
    },

    // Загрузка статистики
    async loadStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = this.bookings.filter(b => b.booking_date === today && b.status === 'active');
        document.getElementById('today-bookings').textContent = todayBookings.length;
        
        // За неделю
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekBookings = this.bookings.filter(b => 
            new Date(b.booking_date) >= weekAgo && b.status === 'active'
        );
        document.getElementById('week-bookings').textContent = weekBookings.length;
        
        // Выручка за месяц
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthBookings = this.bookings.filter(b => 
            b.booking_date.startsWith(currentMonth) && b.status === 'active'
        );
        // Нужно получить цены услуг
        let revenue = 0;
        for (const booking of monthBookings) {
            const service = this.services.find(s => s.id === booking.service_id);
            if (service) revenue += service.price;
        }
        document.getElementById('month-revenue').textContent = `${revenue} ₽`;
        
        // Выполненные
        const completed = this.bookings.filter(b => b.status === 'completed').length;
        document.getElementById('completed-bookings').textContent = completed;
    },

    // Рендер календаря
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        
        const daysInMonth = lastDay.getDate();
        const startWeekday = firstDay.getDay();
        
        let html = '';
        
        // Дни недели
        const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        weekdays.forEach(day => {
            html += `<div class="calendar-day" style="background: none; font-weight: bold;">${day}</div>`;
        });
        
        // Пустые ячейки
        for (let i = 1; i < startWeekday; i++) {
            html += `<div class="calendar-day"></div>`;
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === today.getDate();
            const isWeekend = (startWeekday + day - 1) % 7 === 5 || (startWeekday + day - 1) % 7 === 6;
            
            // Считаем записи на этот день
            const dayBookings = this.bookings.filter(b => b.booking_date === date && b.status === 'active');
            const bookingCount = dayBookings.length;
            
            html += `
                <div class="calendar-day ${isWeekend ? 'weekend' : ''} ${this.selectedDate === date ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                     onclick="Master.selectDate('${date}')">
                    <div class="day-number">${day}</div>
                    <div class="day-name">${bookingCount > 0 ? `📅 ${bookingCount}` : ''}</div>
                </div>
            `;
        }
        
        calendar.innerHTML = html;
    },

    // Выбор даты
    async selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        
        // Загружаем слоты для этой даты
        const slotsContainer = document.getElementById('slots-container');
        const slotsList = document.getElementById('slots-list');
        
        slotsContainer.style.display = 'block';
        
        try {
            const response = await fetch(`http://localhost:8000/slots?date=${date}&master_id=${this.masterId}`);
            if (response.ok) {
                const slots = await response.json();
                
                // Получаем занятые слоты
                const dayBookings = this.bookings.filter(b => b.booking_date === date);
                const bookedTimes = dayBookings.map(b => b.booking_time);
                
                slotsList.innerHTML = slots.map(slot => `
                    <div class="slot ${bookedTimes.includes(slot) ? 'booked' : 'available'}" 
                         onclick="${bookedTimes.includes(slot) ? '' : `Master.bookSlot('${date}', '${slot}')`}">
                        ${slot}
                        ${bookedTimes.includes(slot) ? '❌ Занято' : '✅ Свободно'}
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Ошибка загрузки слотов:', error);
        }
    },

    // Забронировать слот (для ручного добавления)
    bookSlot(date, time) {
        if (confirm(`Забронировать время ${date} ${time} для себя?`)) {
            // Здесь можно добавить логику для ручного бронирования
            this.showMessage('Слот забронирован (функция в разработке)', 'info');
        }
    },

    // Фильтр по дате
    filterByDate() {
        const date = document.getElementById('filter-date').value;
        if (date) {
            const filtered = this.bookings.filter(b => b.booking_date === date);
            this.renderBookings(filtered);
        } else {
            this.renderBookings(this.bookings);
        }
    },

    // Переключение перерыва
    toggleBreak() {
        this.showMessage('Функция перерыва в разработке', 'info');
    },

    // Сохранение настроек
    async saveSettings(event) {
        event.preventDefault();
        
        const updatedMaster = {
            name: document.getElementById('master-name-settings').value,
            specialty: document.getElementById('master-specialty-settings').value || null,
            phone: document.getElementById('master-phone').value || null,
            email: document.getElementById('master-email').value || null,
            service_ids: Array.from(document.getElementById('master-services-settings').selectedOptions).map(opt => parseInt(opt.value))
        };
        
        try {
            const response = await fetch(`http://localhost:8000/masters/${this.masterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedMaster)
            });
            
            if (response.ok) {
                this.showMessage('Настройки сохранены', 'success');
                await this.loadData();
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (error) {
            this.showMessage('Ошибка сохранения', 'error');
        }
    },

    // Переключение вкладок
    switchTab(tabName) {
        document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        
        document.getElementById(`${tabName}-panel`).classList.add('active');
        event.target.classList.add('active');
    },

    // Настройка обработчиков
    setupEventListeners() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        document.getElementById('settings-form').addEventListener('submit', (e) => this.saveSettings(e));
        document.getElementById('filter-date').addEventListener('change', () => this.filterByDate());
    },

    // Показать сообщение
    showMessage(text, type) {
        const msgDiv = document.getElementById('message');
        msgDiv.textContent = text;
        msgDiv.className = `message ${type}`;
        msgDiv.style.display = 'block';
        
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    }
};

// Глобальные функции
function logout() {
    localStorage.removeItem('master_id');
    window.location.href = 'index.html';
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    Master.init();
});

window.Master = Master;