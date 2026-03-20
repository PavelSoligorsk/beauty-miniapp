// Утилиты
const Utils = {
    // Показать сообщение
    showMessage(text, type = 'success') {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    },
    
    // Форматировать дату
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    // Получить сегодняшнюю дату в формате YYYY-MM-DD
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },
    
    // Показать загрузку
    showLoading(container) {
        container.innerHTML = '<div class="loading">Загрузка...</div>';
    },
    
    // Скрыть загрузку
    hideLoading(container) {
        const loading = container.querySelector('.loading');
        if (loading) loading.remove();
    },
    
    // Сохранить данные в localStorage
    saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Получить данные из localStorage
    getFromLocalStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};