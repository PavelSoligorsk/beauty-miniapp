// Основное приложение
const App = {
    // Данные
    user: null,
    selectedService: null,
    selectedMaster: null,
    selectedDate: null,
    selectedTime: null,
    currentStep: 'services',
    mastersList: [], // Список мастеров с их услугами
    
    // Инициализация
    async init() {
        // Инициализируем Telegram WebApp
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            this.user = tg.initDataUnsafe?.user || { id: Date.now(), first_name: 'Гость' };
        } else {
            this.user = { id: Date.now(), first_name: 'Гость' };
        }
        
        // Загружаем данные
        await this.loadServices();
        await this.loadMasters();
        
        // Настраиваем обработчики
        this.setupEventListeners();
        
        // Показываем первый шаг
        this.showStep('services');
    },
    
    // Загрузка услуг
    async loadServices() {
        const container = document.getElementById('services-list');
        Utils.showLoading(container);
        
        try {
            const services = await API.getServices();
            container.innerHTML = services.map(service => `
                <div class="service-card" data-id="${service.id}" data-name="${service.name}" data-price="${service.price}" data-duration="${service.duration}">
                    <strong>${service.name}</strong>
                    <div class="service-price">${service.price} ₽</div>
                    <div class="service-duration">⏱ ${service.duration} мин</div>
                    ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
                </div>
            `).join('');
            
            // Добавляем обработчики
            document.querySelectorAll('.service-card').forEach(card => {
                card.addEventListener('click', () => this.selectService(card));
            });
        } catch (error) {
            Utils.showMessage('Ошибка загрузки услуг', 'error');
        } finally {
            Utils.hideLoading(container);
        }
    },
    
    // Загрузка мастеров
    async loadMasters() {
        const container = document.getElementById('masters-list');
        
        try {
            this.mastersList = await API.getMasters();
            container.innerHTML = this.mastersList.map(master => `
                <div class="master-card" data-id="${master.id}" data-name="${master.name}">
                    <strong>${master.name}</strong>
                    <div class="master-specialty">${master.specialty || ''}</div>
                    ${master.services && master.services.length > 0 ? 
                        `<div class="master-services">🎯 ${master.services.map(s => s.name).join(', ')}</div>` : ''}
                </div>
            `).join('');
            
            // Добавляем обработчики
            document.querySelectorAll('.master-card').forEach(card => {
                card.addEventListener('click', () => this.selectMaster(card));
            });
        } catch (error) {
            Utils.showMessage('Ошибка загрузки мастеров', 'error');
        }
    },
    
    // Выбор услуги
    selectService(card) {
        // Убираем выделение
        document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // Сохраняем выбранную услугу
        this.selectedService = {
            id: parseInt(card.dataset.id),
            name: card.dataset.name,
            price: parseInt(card.dataset.price),
            duration: parseInt(card.dataset.duration)
        };
        
        // Фильтруем мастеров по услуге
        this.filterMastersByService();
        
        // Переходим к выбору мастера
        this.showStep('masters');
    },
    
    // Фильтрация мастеров по выбранной услуге
    filterMastersByService() {
        const container = document.getElementById('masters-list');
        const filteredMasters = this.mastersList.filter(master => {
            // Если у мастера нет услуг, показываем всех
            if (!master.services || master.services.length === 0) return true;
            // Проверяем, может ли мастер выполнить выбранную услугу
            return master.services.some(s => s.id === this.selectedService.id);
        });
        
        if (filteredMasters.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет мастеров для этой услуги</div>';
            return;
        }
        
        container.innerHTML = filteredMasters.map(master => `
            <div class="master-card" data-id="${master.id}" data-name="${master.name}">
                <strong>${master.name}</strong>
                <div class="master-specialty">${master.specialty || ''}</div>
            </div>
        `).join('');
        
        // Добавляем обработчики
        document.querySelectorAll('.master-card').forEach(card => {
            card.addEventListener('click', () => this.selectMaster(card));
        });
    },
    
    // Выбор мастера
    selectMaster(card) {
        // Убираем выделение
        document.querySelectorAll('.master-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // Сохраняем выбранного мастера
        this.selectedMaster = {
            id: parseInt(card.dataset.id),
            name: card.dataset.name
        };
        
        // Переходим к выбору даты и времени
        this.showStep('datetime');
        
        // Настраиваем выбор даты
        const datePicker = document.getElementById('date-picker');
        datePicker.min = Utils.getTodayDate();
        datePicker.value = Utils.getTodayDate();
        datePicker.onchange = () => this.loadSlots();
        
        // Загружаем слоты
        this.loadSlots();
    },
    
    // Загрузка слотов
    async loadSlots() {
        const date = document.getElementById('date-picker').value;
        if (!date || !this.selectedMaster) return;
        
        this.selectedDate = date;
        const slotsContainer = document.getElementById('slots-container');
        const slotsList = document.getElementById('slots-list');
        
        Utils.showLoading(slotsList);
        slotsContainer.classList.remove('hidden');
        
        try {
            const slots = await API.getSlots(date, this.selectedMaster.id);
            
            if (slots.length === 0) {
                slotsList.innerHTML = '<div class="empty-state">Нет свободных слотов на эту дату</div>';
                return;
            }
            
            slotsList.innerHTML = slots.map(slot => `
                <div class="slot" data-time="${slot}">${slot}</div>
            `).join('');
            
            // Добавляем обработчики
            document.querySelectorAll('.slot').forEach(slot => {
                slot.addEventListener('click', () => this.selectTime(slot));
            });
        } catch (error) {
            Utils.showMessage('Ошибка загрузки слотов', 'error');
        } finally {
            Utils.hideLoading(slotsList);
        }
    },
    
    // Выбор времени
    selectTime(slot) {
        // Убираем выделение
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
        
        this.selectedTime = slot.dataset.time;
        this.showSummary();
    },
    
    // Показать подтверждение
    showSummary() {
        const summaryDiv = document.getElementById('summary');
        
        summaryDiv.innerHTML = `
            <div class="summary-item">
                <span class="label">Услуга:</span>
                <span class="value">${this.selectedService.name}</span>
            </div>
            <div class="summary-item">
                <span class="label">Мастер:</span>
                <span class="value">${this.selectedMaster.name}</span>
            </div>
            <div class="summary-item">
                <span class="label">Дата:</span>
                <span class="value">${Utils.formatDate(this.selectedDate)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Время:</span>
                <span class="value">${this.selectedTime}</span>
            </div>
            <div class="summary-item total">
                <span class="label">Сумма:</span>
                <span class="value">${this.selectedService.price} ₽</span>
            </div>
        `;
        
        this.showStep('confirm');
    },
    
    // Подтверждение записи
    async confirmBooking() {
    const confirmBtn = document.getElementById('confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Создание...';
    
    try {
        // Формируем данные для отправки на сервер
        const booking = {
            service_id: this.selectedService.id,
            master_id: this.selectedMaster.id,
            date: this.selectedDate,
            time: this.selectedTime,
            user_id: this.user.id,
            user_name: `${this.user.first_name} ${this.user.last_name || ''}`.trim(),
            notes: null
        };
        
        // Отправляем запрос на сервер
        const result = await API.createBooking(booking);
        
        // Показываем сообщение об успехе
        Utils.showMessage(result.message, 'success');
        
        // Сбрасываем форму через 2 секунды
        setTimeout(() => {
            this.resetForm();           // очищаем выбранные данные
            this.showStep('services');  // возвращаемся к выбору услуг
            this.loadMyBookings();      // обновляем список записей
        }, 2000);
        
    } catch (error) {
        // Обрабатываем ошибку
        Utils.showMessage(error.message || 'Ошибка создания записи', 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✅ Подтвердить запись';
    }
},
    
    // Загрузка моих записей
    async loadMyBookings() {
        const container = document.getElementById('my-bookings-list');
        Utils.showLoading(container);
        
        try {
            const bookings = await API.getUserBookings(this.user.id);
            
            if (bookings.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>📭 У вас нет активных записей</p>
                        <p class="hint">Нажмите "Записаться", чтобы создать запись</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = bookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-header">
                        <h3>${booking.service_name}</h3>
                        <span class="status-badge active">Активна</span>
                    </div>
                    <div class="booking-details">
                        <p>👤 ${booking.master_name}</p>
                        <p>📅 ${Utils.formatDate(booking.booking_date)} в ${booking.booking_time}</p>
                        ${booking.notes ? `<p>📝 ${booking.notes}</p>` : ''}
                    </div>
                    <button class="cancel-btn" data-id="${booking.id}">Отменить запись</button>
                </div>
            `).join('');
            
            // Добавляем обработчики отмены
            document.querySelectorAll('.cancel-btn').forEach(btn => {
                btn.addEventListener('click', () => this.cancelBooking(parseInt(btn.dataset.id)));
            });
            
        } catch (error) {
            Utils.showMessage('Ошибка загрузки записей', 'error');
        } finally {
            Utils.hideLoading(container);
        }
    },
    
    // Отмена записи
    async cancelBooking(bookingId) {
        if (!confirm('Вы уверены, что хотите отменить запись?')) return;
        
        try {
            await API.cancelBooking(bookingId);
            Utils.showMessage('Запись отменена', 'success');
            this.loadMyBookings();
        } catch (error) {
            Utils.showMessage(error.message || 'Ошибка отмены записи', 'error');
        }
    },
    
    // Сброс формы
    resetForm() {
        this.selectedService = null;
        this.selectedMaster = null;
        this.selectedDate = null;
        this.selectedTime = null;
        
        // Очищаем выделения
        document.querySelectorAll('.service-card, .master-card, .slot').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Сбрасываем дату
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.value = Utils.getTodayDate();
        }
        
        // Скрываем контейнер слотов
        const slotsContainer = document.getElementById('slots-container');
        if (slotsContainer) {
            slotsContainer.classList.add('hidden');
        }
        
        // Перезагружаем полный список мастеров
        this.loadMasters();
    },
    
    // Показать шаг
    showStep(step) {
        this.currentStep = step;
        
        // Скрываем все шаги
        document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
        
        // Показываем нужный шаг
        const stepElement = document.getElementById(`step-${step}`);
        if (stepElement) {
            stepElement.classList.remove('hidden');
        }
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Переключение вкладок
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Обновляем активную вкладку
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Показываем нужную страницу
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                document.getElementById(`${tabName}-page`).classList.add('active');
                
                // Если открыли страницу моих записей, загружаем их
                if (tabName === 'my') {
                    this.loadMyBookings();
                }
            });
        });
        
        // Кнопки назад
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.dataset.step;
                if (step === 'services') {
                    this.resetForm();
                }
                this.showStep(step);
            });
        });
        
        // Кнопка подтверждения
        const confirmBtn = document.getElementById('confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmBooking());
        }
    }
};

// Запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});