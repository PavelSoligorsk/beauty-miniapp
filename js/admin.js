// Админ-панель (без авторизации)
const Admin = {
    services: [],
    masters: [],
    bookings: [],
    allServices: [],

    // Инициализация
    async init() {
        await this.loadData();
        this.setupEventListeners();
    },

    // Загрузка данных
    async loadData() {
        try {
            // Показываем загрузку
            this.showLoading();
            
            // Загружаем услуги
            const servicesResponse = await fetch('http://localhost:8000/services?active_only=false');
            if (servicesResponse.ok) {
                this.services = await servicesResponse.json();
                this.allServices = this.services;
            } else {
                console.error('Ошибка загрузки услуг:', servicesResponse.status);
                this.services = [];
                this.allServices = [];
            }
            
            // Загружаем мастеров
            const mastersResponse = await fetch('http://localhost:8000/masters?active_only=false');
            if (mastersResponse.ok) {
                this.masters = await mastersResponse.json();
            } else {
                console.error('Ошибка загрузки мастеров:', mastersResponse.status);
                this.masters = [];
            }
            
            // Загружаем статистику
            try {
                const statsResponse = await fetch('http://localhost:8000/admin/stats');
                if (statsResponse.ok) {
                    const stats = await statsResponse.json();
                    this.updateStats(stats);
                } else {
                    this.updateStats({
                        total_bookings: 0,
                        active_bookings: 0,
                        active_services: this.services.filter(s => s.is_active).length,
                        active_masters: this.masters.filter(m => m.is_active).length,
                        monthly_revenue: 0
                    });
                }
            } catch (e) {
                console.warn('Статистика не загружена');
                this.updateStats({
                    total_bookings: 0,
                    active_bookings: 0,
                    active_services: this.services.filter(s => s.is_active).length,
                    active_masters: this.masters.filter(m => m.is_active).length,
                    monthly_revenue: 0
                });
            }
            
            // Отображаем данные
            this.renderServices();
            this.renderMasters();
            this.renderBookings();
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.showMessage('Ошибка загрузки данных. Проверьте, запущен ли сервер.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    // Показать загрузку
    showLoading() {
        console.log('Загрузка данных...');
    },

    // Скрыть загрузку
    hideLoading() {
        console.log('Загрузка завершена');
    },

    // Обновление статистики
    updateStats(stats) {
        document.getElementById('total-bookings').textContent = stats.total_bookings || 0;
        document.getElementById('active-bookings').textContent = stats.active_bookings || 0;
        document.getElementById('total-services').textContent = stats.active_services || this.services.length;
        document.getElementById('total-masters').textContent = stats.active_masters || this.masters.length;
        document.getElementById('monthly-revenue').textContent = `${stats.monthly_revenue || 0} ₽`;
    },

    // Отображение услуг
    renderServices() {
        const tbody = document.getElementById('services-list');
        if (!this.services || this.services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Нет услуг. Добавьте первую!</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.services.map(service => `
            <tr>
                <td>${service.id}</td>
                <td>${service.name}</td>
                <td>${service.price} ₽</td>
                <td>${service.duration} мин</td>
                <td>${service.is_active ? '✅ Активна' : '❌ Неактивна'}</td>
                <td class="actions">
                    <button class="edit-btn" onclick="Admin.editService(${service.id})">✏️</button>
                    <button class="delete-btn" onclick="Admin.deleteService(${service.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    // Отображение мастеров
    renderMasters() {
        const tbody = document.getElementById('masters-list');
        if (!this.masters || this.masters.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Нет мастеров. Добавьте первого!</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.masters.map(master => `
            <tr>
                <td>${master.id}</td>
                <td>${master.name}</td>
                <td>${master.specialty || '-'}</td>
                <td>${(master.services || []).map(s => s.name).join(', ') || '-'}</td>
                <td>${master.phone || '-'}</td>
                <td>${master.is_active ? '✅ Активен' : '❌ Неактивен'}</td>
                <td class="actions">
                    <button class="edit-btn" onclick="Admin.editMaster(${master.id})">✏️</button>
                    <button class="delete-btn" onclick="Admin.deleteMaster(${master.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    // Отображение записей
    renderBookings() {
        const tbody = document.getElementById('bookings-list');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Загрузка записей...</td></tr>';
        this.loadAllBookings();
    },

    // Загрузка всех записей
    async loadAllBookings() {
        try {
            // Загружаем записи для всех пользователей (временно - тестовый ID)
            const testUserId = 1;
            const response = await fetch(`http://localhost:8000/bookings/${testUserId}`);
            if (response.ok) {
                this.bookings = await response.json();
            } else {
                this.bookings = [];
            }
            
            const tbody = document.getElementById('bookings-list');
            if (this.bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Нет записей</td></tr>';
                return;
            }
            
            tbody.innerHTML = this.bookings.map(booking => `
                <tr>
                    <td>${booking.id}</td>
                    <td>${booking.user_name || booking.user_id}</td>
                    <td>${booking.service_name}</td>
                    <td>${booking.master_name}</td>
                    <td>${booking.booking_date}</td>
                    <td>${booking.booking_time}</td>
                    <td>${booking.status === 'active' ? '🟢 Активна' : '🔴 Отменена'}</td>
                    <td>
                        ${booking.status === 'active' ? 
                            `<button class="delete-btn" onclick="Admin.cancelBooking(${booking.id})">Отменить</button>` : 
                            '-'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
            const tbody = document.getElementById('bookings-list');
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Ошибка загрузки записей</td></tr>';
        }
    },

    // Редактирование услуги
    editService(id) {
        const service = this.services.find(s => s.id === id);
        if (service) {
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-price').value = service.price;
            document.getElementById('service-duration').value = service.duration;
            document.getElementById('service-description').value = service.description || '';
            document.getElementById('service-modal-title').textContent = 'Редактировать услугу';
            document.getElementById('service-modal').classList.add('active');
        }
    },

    // Удаление услуги
    async deleteService(id) {
        if (!confirm('Вы уверены, что хотите удалить эту услугу?')) return;
        
        try {
            const response = await fetch(`http://localhost:8000/services/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showMessage('Услуга удалена', 'success');
                await this.loadData();
            } else {
                throw new Error('Ошибка удаления');
            }
        } catch (error) {
            this.showMessage('Ошибка удаления', 'error');
        }
    },

    // Редактирование мастера
    async editMaster(id) {
        const master = this.masters.find(m => m.id === id);
        if (master) {
            document.getElementById('master-id').value = master.id;
            document.getElementById('master-name').value = master.name;
            document.getElementById('master-specialty').value = master.specialty || '';
            document.getElementById('master-phone').value = master.phone || '';
            document.getElementById('master-email').value = master.email || '';
            
            const select = document.getElementById('master-services');
            select.innerHTML = this.allServices.map(service => `
                <option value="${service.id}" ${master.services?.some(s => s.id === service.id) ? 'selected' : ''}>
                    ${service.name} (${service.price} ₽)
                </option>
            `).join('');
            
            document.getElementById('master-modal-title').textContent = 'Редактировать мастера';
            document.getElementById('master-modal').classList.add('active');
        }
    },

    // Удаление мастера
    async deleteMaster(id) {
        if (!confirm('Вы уверены, что хотите удалить этого мастера?')) return;
        
        try {
            const response = await fetch(`http://localhost:8000/masters/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showMessage('Мастер удалён', 'success');
                await this.loadData();
            } else {
                throw new Error('Ошибка удаления');
            }
        } catch (error) {
            this.showMessage('Ошибка удаления', 'error');
        }
    },

    // Отмена записи
    async cancelBooking(id) {
        if (!confirm('Отменить запись?')) return;
        
        try {
            const response = await fetch(`http://localhost:8000/booking/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showMessage('Запись отменена', 'success');
                await this.loadData();
            } else {
                throw new Error('Ошибка отмены');
            }
        } catch (error) {
            this.showMessage('Ошибка отмены', 'error');
        }
    },

    // Открытие модального окна услуги
    openServiceModal() {
        document.getElementById('service-id').value = '';
        document.getElementById('service-name').value = '';
        document.getElementById('service-price').value = '';
        document.getElementById('service-duration').value = '';
        document.getElementById('service-description').value = '';
        document.getElementById('service-modal-title').textContent = 'Добавить услугу';
        document.getElementById('service-modal').classList.add('active');
    },

    // Открытие модального окна мастера
    openMasterModal() {
        document.getElementById('master-id').value = '';
        document.getElementById('master-name').value = '';
        document.getElementById('master-specialty').value = '';
        document.getElementById('master-phone').value = '';
        document.getElementById('master-email').value = '';
        
        const select = document.getElementById('master-services');
        select.innerHTML = this.allServices.map(service => `
            <option value="${service.id}">${service.name} (${service.price} ₽)</option>
        `).join('');
        
        document.getElementById('master-modal-title').textContent = 'Добавить мастера';
        document.getElementById('master-modal').classList.add('active');
    },

    // Закрытие модальных окон
    closeServiceModal() {
        document.getElementById('service-modal').classList.remove('active');
    },

    closeMasterModal() {
        document.getElementById('master-modal').classList.remove('active');
    },

    // Сохранение услуги
    async saveService(event) {
        event.preventDefault();
        
        const id = document.getElementById('service-id').value;
        const service = {
            name: document.getElementById('service-name').value,
            price: parseInt(document.getElementById('service-price').value),
            duration: parseInt(document.getElementById('service-duration').value),
            description: document.getElementById('service-description').value || null
        };
        
        try {
            let response;
            if (id) {
                response = await fetch(`http://localhost:8000/services/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(service)
                });
            } else {
                response = await fetch('http://localhost:8000/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(service)
                });
            }
            
            if (response.ok) {
                this.showMessage(id ? 'Услуга обновлена' : 'Услуга создана', 'success');
                this.closeServiceModal();
                await this.loadData();
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (error) {
            this.showMessage('Ошибка сохранения', 'error');
        }
    },

    // Сохранение мастера
    async saveMaster(event) {
        event.preventDefault();
        
        const id = document.getElementById('master-id').value;
        const select = document.getElementById('master-services');
        const serviceIds = Array.from(select.selectedOptions).map(opt => parseInt(opt.value));
        
        const master = {
            name: document.getElementById('master-name').value,
            specialty: document.getElementById('master-specialty').value || null,
            phone: document.getElementById('master-phone').value || null,
            email: document.getElementById('master-email').value || null,
            service_ids: serviceIds
        };
        
        try {
            let response;
            if (id) {
                response = await fetch(`http://localhost:8000/masters/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(master)
                });
            } else {
                response = await fetch('http://localhost:8000/masters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(master)
                });
            }
            
            if (response.ok) {
                this.showMessage(id ? 'Мастер обновлён' : 'Мастер создан', 'success');
                this.closeMasterModal();
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
        
        document.getElementById('service-form').addEventListener('submit', (e) => this.saveService(e));
        document.getElementById('master-form').addEventListener('submit', (e) => this.saveMaster(e));
        
        window.onclick = (event) => {
            const serviceModal = document.getElementById('service-modal');
            const masterModal = document.getElementById('master-modal');
            if (event.target === serviceModal) this.closeServiceModal();
            if (event.target === masterModal) this.closeMasterModal();
        };
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
    window.location.href = 'index.html';
}

function openServiceModal() { Admin.openServiceModal(); }
function closeServiceModal() { Admin.closeServiceModal(); }
function openMasterModal() { Admin.openMasterModal(); }
function closeMasterModal() { Admin.closeMasterModal(); }

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    Admin.init();
});

window.Admin = Admin;