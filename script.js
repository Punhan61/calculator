document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calcForm');
    if (!form) return; // Защита на случай подключения на других страницах

    const distanceInput = document.getElementById('distance');
    const weightInput = document.getElementById('weight');
    const tariffInput = document.getElementById('tariff');

    const distanceError = document.getElementById('distanceError');
    const weightError = document.getElementById('weightError');
    const tariffError = document.getElementById('tariffError');

    const resultBox = document.getElementById('resultBox');
    const totalPriceEl = document.getElementById('totalPrice');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const STORAGE_KEY = 'cargo_calc_history';

    // Загрузка сохранённой истории при открытии страницы
    let historyData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    renderFullHistory();

    // Функция строгой проверки 4 типов ошибок
    function validateField(rawValue) {
        const trimmed = rawValue.trim();

        // 1. Поле пустое
        if (trimmed === '') {
            return { isValid: false, message: 'Ошибка: поле не должно быть пустым, заполните значение.' };
        }

        // Поддержка запятой как десятичного разделителя и проверка на чистое число
        const normalized = trimmed.replace(',', '.');
        if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
            // 2. Введены буквы или спецсимволы (не число)
            return { isValid: false, message: 'Ошибка: допустим ввод только числовых значений без букв и символов.' };
        }

        const num = Number(normalized);

        // 3. Введён ровно 0
        if (num === 0) {
            return { isValid: false, message: 'Ошибка: значение не может быть равно нулю.' };
        }

        // 4. Введено отрицательное число (< 0)
        if (num < 0) {
            return { isValid: false, message: 'Ошибка: значение должно быть положительным (больше нуля).' };
        }

        return { isValid: true, value: num };
    }

    function setFieldError(inputEl, errorEl, message) {
        if (message) {
            inputEl.classList.add('input-error');
            errorEl.textContent = message;
        } else {
            inputEl.classList.remove('input-error');
            errorEl.textContent = '';
        }
    }

    // Отрисовка одного элемента в конец списка (постепенное добавление вниз)
    function appendHistoryItem(record, index) {
        const emptyMsg = historyList.querySelector('.empty-history');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-meta">
                <span>Запрос #${index}</span>
                <span>${record.timestamp}</span>
            </div>
            <div class="history-details">
                Расстояние: <strong>${record.distance} км</strong> | 
                Вес: <strong>${record.weight} кг</strong> | 
                Тариф: <strong>${record.tariff} ₽/км</strong>
            </div>
            <div class="history-total">Итого: ${record.total.toLocaleString('ru-RU')} ₽</div>
        `;
        historyList.appendChild(item);
    }

    // Первичная отрисовка при загрузке из localStorage
    function renderFullHistory() {
        historyList.innerHTML = '';
        if (historyData.length === 0) {
            historyList.innerHTML = '<p class="empty-history">История расчётов пока пуста.</p>';
            return;
        }
        historyData.forEach((record, idx) => {
            appendHistoryItem(record, idx + 1);
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const distCheck = validateField(distanceInput.value);
        const weightCheck = validateField(weightInput.value);
        const tariffCheck = validateField(tariffInput.value);

        setFieldError(distanceInput, distanceError, distCheck.isValid ? '' : distCheck.message);
        setFieldError(weightInput, weightError, weightCheck.isValid ? '' : weightCheck.message);
        setFieldError(tariffInput, tariffError, tariffCheck.isValid ? '' : tariffCheck.message);

        if (!distCheck.isValid || !weightCheck.isValid || !tariffCheck.isValid) {
            resultBox.classList.add('hidden');
            return;
        }

        // Формула расчёта: Базовая стоимость (км * тариф) + надбавка за вес (5 руб. за каждый кг)
        const baseCost = distCheck.value * tariffCheck.value;
        const weightCost = weightCheck.value * 5;
        const total = Math.round((baseCost + weightCost) * 100) / 100;

        totalPriceEl.textContent = `${total.toLocaleString('ru-RU')} ₽`;
        resultBox.classList.remove('hidden');

        // Формирование записи для журнала
        const now = new Date();
        const timestamp = now.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const newRecord = {
            timestamp,
            distance: distCheck.value,
            weight: weightCheck.value,
            tariff: tariffCheck.value,
            total
        };

        historyData.push(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));

        // Постепенное добавление новой записи вниз списка без перезаписи старых
        appendHistoryItem(newRecord, historyData.length);
    });

    // Очистка журнала
    clearHistoryBtn.addEventListener('click', () => {
        historyData = [];
        localStorage.removeItem(STORAGE_KEY);
        renderFullHistory();
    });
});
