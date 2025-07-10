// Глобальные переменные
let currentCitation = null;
let allCitations = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadAllCitations();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработка нажатия Enter в поле поиска
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCitations();
        }
    });

    // Отправка формы модального окна
    document.getElementById('citationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCitation();
    });
}

// Загрузка всех цитирований
async function loadAllCitations() {
    showLoading(true);
    try {
        const response = await fetch('/api/citations');
        if (response.ok) {
            allCitations = await response.json();
            displayCitations(allCitations);
            updateStatistics(allCitations);
        } else {
            showToast('Ошибка загрузки цитирований', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Ошибка загрузки цитирований', 'error');
    } finally {
        showLoading(false);
    }
}

// Поиск цитирований
async function searchCitations() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        loadAllCitations();
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const results = await response.json();
            displayCitations(results);
            updateStatistics(results);
        } else {
            showToast('Ошибка поиска цитирований', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Ошибка поиска цитирований', 'error');
    } finally {
        showLoading(false);
    }
}

// Отображение цитирований в интерфейсе
function displayCitations(citations) {
    const container = document.getElementById('citationsList');
    const noResults = document.getElementById('noResults');

    if (citations.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('d-none');
        return;
    }

    noResults.classList.add('d-none');
    container.innerHTML = '';

    citations.forEach(citation => {
        const card = createCitationCard(citation);
        container.appendChild(card);
    });
}

// Создание карточки цитирования
function createCitationCard(citation) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    const card = document.createElement('div');
    card.className = 'card citation-card h-100';
    card.onclick = () => viewCitation(citation);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Заголовок
    const title = document.createElement('h6');
    title.className = 'citation-title';
    title.textContent = citation.title;

    // Авторы
    const authors = document.createElement('p');
    authors.className = 'citation-authors';
    authors.textContent = citation.authors || 'Авторы не указаны';

    // Журнал и год
    const journal = document.createElement('p');
    journal.className = 'citation-journal';
    journal.textContent = citation.journal || 'Журнал не указан';
    if (citation.year) {
        journal.textContent += ` (${citation.year})`;
    }

    // Метаинформация
    const meta = document.createElement('p');
    meta.className = 'citation-meta';
    const metaParts = [];
    if (citation.volume) metaParts.push(`Т. ${citation.volume}`);
    if (citation.issue) metaParts.push(`№ ${citation.issue}`);
    if (citation.pages) metaParts.push(`с. ${citation.pages}`);
    meta.textContent = metaParts.join(', ');

    // Аннотация (сокращенная)
    if (citation.abstract) {
        const abstract = document.createElement('p');
        abstract.className = 'citation-abstract';
        abstract.textContent = citation.abstract;
        cardBody.appendChild(abstract);
    }

    // Ключевые слова
    if (citation.keywords) {
        const keywords = document.createElement('div');
        keywords.className = 'citation-keywords';
        citation.keywords.split(',').forEach(keyword => {
            const badge = document.createElement('span');
            badge.className = 'badge keyword-badge';
            badge.textContent = keyword.trim();
            keywords.appendChild(badge);
        });
        cardBody.appendChild(keywords);
    }

    // Кнопки действий
    const actions = document.createElement('div');
    actions.className = 'mt-3 d-flex gap-2';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editCitation(citation);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteCitation(citation.id);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    cardBody.appendChild(title);
    cardBody.appendChild(authors);
    cardBody.appendChild(journal);
    if (metaParts.length > 0) {
        cardBody.appendChild(meta);
    }
    cardBody.appendChild(actions);

    card.appendChild(cardBody);
    col.appendChild(card);
    return col;
}

// Показать модальное окно добавления цитирования
function showAddCitationModal() {
    currentCitation = null;
    document.getElementById('modalTitle').textContent = 'Добавить новое цитирование';
    document.getElementById('citationForm').reset();
    document.getElementById('citationId').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('citationModal'));
    modal.show();
}

// Редактирование цитирования
function editCitation(citation) {
    currentCitation = citation;
    document.getElementById('modalTitle').textContent = 'Редактировать цитирование';
    document.getElementById('citationId').value = citation.id;
    document.getElementById('title').value = citation.title;
    document.getElementById('authors').value = citation.authors;
    document.getElementById('journal').value = citation.journal;
    document.getElementById('year').value = citation.year;
    document.getElementById('volume').value = citation.volume;
    document.getElementById('issue').value = citation.issue;
    document.getElementById('pages').value = citation.pages;
    document.getElementById('doi').value = citation.doi;
    document.getElementById('url').value = citation.url;
    document.getElementById('keywords').value = citation.keywords;
    document.getElementById('abstract').value = citation.abstract;

    const modal = new bootstrap.Modal(document.getElementById('citationModal'));
    modal.show();
}

// Сохранение цитирования (создание или обновление)
async function saveCitation() {
    const formData = {
        title: document.getElementById('title').value.trim(),
        authors: document.getElementById('authors').value.trim(),
        journal: document.getElementById('journal').value.trim(),
        year: parseInt(document.getElementById('year').value) || 0,
        volume: document.getElementById('volume').value.trim(),
        issue: document.getElementById('issue').value.trim(),
        pages: document.getElementById('pages').value.trim(),
        doi: document.getElementById('doi').value.trim(),
        url: document.getElementById('url').value.trim(),
        keywords: document.getElementById('keywords').value.trim(),
        abstract: document.getElementById('abstract').value.trim()
    };

    if (!formData.title) {
        showToast('Заголовок обязателен', 'error');
        return;
    }

    const isEdit = currentCitation !== null;
    const url = isEdit ? `/api/citations/${currentCitation.id}` : '/api/citations';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const savedCitation = await response.json();
            showToast(isEdit ? 'Цитирование успешно обновлено' : 'Цитирование успешно добавлено', 'success');
            
            // Закрытие модального окна
            const modal = bootstrap.Modal.getInstance(document.getElementById('citationModal'));
            modal.hide();

            // Перезагрузка цитирований
            loadAllCitations();
        } else {
            const error = await response.json();
            showToast(error.error || 'Ошибка сохранения цитирования', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Ошибка сохранения цитирования', 'error');
    }
}

// Просмотр деталей цитирования
async function viewCitation(citation) {
    try {
        const response = await fetch(`/api/citations/${citation.id}`);
        if (response.ok) {
            const fullCitation = await response.json();
            displayCitationDetails(fullCitation);
            
            const modal = new bootstrap.Modal(document.getElementById('viewModal'));
            modal.show();
        } else {
            showToast('Ошибка загрузки деталей цитирования', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Ошибка загрузки деталей цитирования', 'error');
    }
}

// Отображение деталей цитирования в модальном окне
function displayCitationDetails(citation) {
    const modalBody = document.getElementById('viewModalBody');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-12">
                <h5 class="mb-3">${citation.title}</h5>
                <p class="text-muted mb-2"><strong>Авторы:</strong> ${citation.authors || 'Не указаны'}</p>
                <p class="text-muted mb-2"><strong>Журнал:</strong> ${citation.journal || 'Не указан'}</p>
                <p class="text-muted mb-2"><strong>Год:</strong> ${citation.year || 'Не указан'}</p>
                ${citation.volume ? `<p class="text-muted mb-2"><strong>Том:</strong> ${citation.volume}</p>` : ''}
                ${citation.issue ? `<p class="text-muted mb-2"><strong>Номер:</strong> ${citation.issue}</p>` : ''}
                ${citation.pages ? `<p class="text-muted mb-2"><strong>Страницы:</strong> ${citation.pages}</p>` : ''}
                ${citation.doi ? `<p class="text-muted mb-2"><strong>DOI:</strong> <a href="https://doi.org/${citation.doi}" target="_blank">${citation.doi}</a></p>` : ''}
                ${citation.url ? `<p class="text-muted mb-2"><strong>URL:</strong> <a href="${citation.url}" target="_blank">${citation.url}</a></p>` : ''}
                ${citation.keywords ? `<p class="text-muted mb-2"><strong>Ключевые слова:</strong> ${citation.keywords}</p>` : ''}
                ${citation.abstract ? `<div class="mt-3"><strong>Аннотация:</strong><p class="mt-2">${citation.abstract}</p></div>` : ''}
                <div class="mt-3 text-muted">
                    <small>Создано: ${new Date(citation.created_at).toLocaleString('ru-RU')}</small><br>
                    <small>Обновлено: ${new Date(citation.updated_at).toLocaleString('ru-RU')}</small>
                </div>
            </div>
        </div>
    `;
}

// Редактирование текущего цитирования из модального окна просмотра
function editCurrentCitation() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewModal'));
    modal.hide();
    
    // Получение текущего цитирования из модального окна просмотра
    const title = document.querySelector('#viewModalBody h5').textContent;
    const citation = allCitations.find(c => c.title === title);
    if (citation) {
        editCitation(citation);
    }
}

// Удаление цитирования
async function deleteCitation(id) {
    if (!confirm('Вы уверены, что хотите удалить это цитирование?')) {
        return;
    }

    try {
        const response = await fetch(`/api/citations/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Цитирование успешно удалено', 'success');
            loadAllCitations();
        } else {
            showToast('Ошибка удаления цитирования', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Ошибка удаления цитирования', 'error');
    }
}

// Экспорт цитирований
function exportCitations(format) {
    const url = `/api/export?format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `citations.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Цитирования экспортированы в формате ${format.toUpperCase()}`, 'success');
}

// Обновление статистики
function updateStatistics(citations) {
    document.getElementById('totalCitations').textContent = citations.length;
    
    // Подсчет недавних цитирований (этот месяц)
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const recentCount = citations.filter(c => new Date(c.created_at) >= thisMonth).length;
    document.getElementById('recentCitations').textContent = recentCount;
    
    // Подсчет уникальных журналов
    const journals = new Set(citations.map(c => c.journal).filter(j => j));
    document.getElementById('uniqueJournals').textContent = journals.size;
    
    // Подсчет среднего года
    const years = citations.map(c => c.year).filter(y => y > 0);
    const avgYear = years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 0;
    document.getElementById('avgYear').textContent = avgYear;
}

// Показать/скрыть индикатор загрузки
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

// Показать уведомление
function showToast(message, type = 'info') {
    // Создание контейнера для уведомлений, если он не существует
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast show`;
    
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-header ${bgClass} text-white">
            <i class="fas fa-${icon} me-2"></i>
            <strong class="me-auto">Система цитирований</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    container.appendChild(toast);

    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Подсветка поисковых терминов в тексте
function highlightSearchTerms(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
} 