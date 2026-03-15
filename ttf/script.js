document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const fontUpload = document.getElementById('fontUpload');
    const textInput = document.getElementById('textInput');
    const colorPicker = document.getElementById('colorPicker');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const boldCheckbox = document.getElementById('boldCheckbox');
    const italicCheckbox = document.getElementById('italicCheckbox');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvas = document.getElementById('textCanvas');
    const canvasPlaceholder = document.getElementById('canvasPlaceholder');
    const fileInfo = document.getElementById('fileInfo');
    const previewInfo = document.getElementById('previewInfo');
    
    const ctx = canvas.getContext('2d');
    let currentFont = null;
    let generatedImageUrl = null;
    let hasGeneratedBefore = false;
    
    // Отображение значения размера шрифта
    fontSize.addEventListener('input', function() {
        fontSizeValue.textContent = `${this.value} px`;
        if (hasGeneratedBefore) {
            autoGenerate();
        }
    });
    
    // Загрузка шрифта
    fontUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Проверка типа файла
        if (!file.name.toLowerCase().endsWith('.ttf')) {
            alert('Пожалуйста, загрузите файл в формате .ttf');
            fontUpload.value = '';
            fileInfo.textContent = 'Шрифт не загружен';
            return;
        }
        
        fileInfo.textContent = `Загружен: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        
        // Создание URL для загруженного шрифта
        const fontUrl = URL.createObjectURL(file);
        
        // Создание и загрузка шрифта
        currentFont = new FontFace('customFont', `url(${fontUrl})`);
        
        currentFont.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
            console.log('Шрифт загружен успешно');
            if (hasGeneratedBefore) {
                autoGenerate();
            }
        }).catch(function(error) {
            console.error('Ошибка загрузки шрифта:', error);
            fileInfo.textContent = 'Ошибка загрузки шрифта';
        });
    });
    
    // Генерация изображения
    generateBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        
        if (!text) {
            alert('Пожалуйста, введите текст');
            return;
        }
        
        generateImage();
    });
    
    function generateImage() {
        const text = textInput.value.trim();
        
        // Настройка стиля текста
        const color = colorPicker.value;
        const size = parseInt(fontSize.value);
        const isBold = boldCheckbox.checked;
        const isItalic = italicCheckbox.checked;
        
        let fontStyle = '';
        if (isBold) fontStyle += 'bold ';
        if (isItalic) fontStyle += 'italic ';
        
        // Используем кастомный шрифт или стандартный
        const fontFamily = currentFont ? 'customFont' : 'Arial, sans-serif';
        fontStyle += `${size}px ${fontFamily}`;
        
        // Временный canvas для измерения текста
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = fontStyle;
        
        // Получаем точные размеры текста
        const textMetrics = tempCtx.measureText(text);
        
        // Расчитываем точные размеры с учетом всех деталей шрифта
        // Используем современные метрики, если они доступны
        const textWidth = Math.ceil(textMetrics.width);
        
        // Для высоты используем фактическую высоту bounding box
        let textHeight = size; // Базовое значение
        
        if (textMetrics.actualBoundingBoxAscent && textMetrics.actualBoundingBoxDescent) {
            // Современный способ - используем фактические метрики
            textHeight = Math.ceil(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent);
        } else {
            // Старый способ - приблизительная высота
            textHeight = Math.ceil(size * 1.2);
        }
        
        // Устанавливаем размеры canvas точно по тексту
        canvas.width = textWidth;
        canvas.height = textHeight;
        
        // Очищаем canvas (прозрачный фон)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Настраиваем шрифт снова после изменения размера canvas
        ctx.font = fontStyle;
        ctx.fillStyle = colorPicker.value;
        
        // Определяем положение текста для точного размещения
        let textX = 0;
        let textY = 0;
        
        if (textMetrics.actualBoundingBoxAscent && textMetrics.actualBoundingBoxDescent) {
            // Точное позиционирование с использованием современных метрик
            textY = textMetrics.actualBoundingBoxAscent;
        } else {
            // Приблизительное позиционирование
            textY = size * 0.8; // Эмпирически подобранное значение
        }
        
        // Рисуем текст точно по границам canvas
        ctx.fillText(text, textX, textY);
        
        // Показываем canvas, скрываем placeholder
        canvas.style.display = 'block';
        canvasPlaceholder.style.display = 'none';
        
        // Активируем кнопку скачивания
        downloadBtn.disabled = false;
        
        // Обновляем информацию
        previewInfo.textContent = `Размер изображения: ${canvas.width} × ${canvas.height} px`;
        
        // Освобождаем предыдущий URL, если он существует
        if (generatedImageUrl) {
            URL.revokeObjectURL(generatedImageUrl);
        }
        
        hasGeneratedBefore = true;
    }
    
    // Скачивание изображения
    downloadBtn.addEventListener('click', function() {
        if (!canvas.style.display || canvas.style.display === 'none') {
            alert('Сначала сгенерируйте изображение');
            return;
        }
        
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        
        // Генерируем имя файла на основе текста
        const text = textInput.value.trim().substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = text ? `text_${text}.png` : 'text.png';
        link.download = filename;
        
        // Получаем данные canvas в формате PNG
        canvas.toBlob(function(blob) {
            generatedImageUrl = URL.createObjectURL(blob);
            link.href = generatedImageUrl;
            
            // Инициируем скачивание
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 'image/png');
    });
    
    // Пример текста при загрузке
    textInput.addEventListener('focus', function() {
        if (this.value === 'Пример текста') {
            this.select();
        }
    });
    
    // Автоматическая генерация при изменении параметров (только если уже была генерация)
    textInput.addEventListener('input', function() {
        if (hasGeneratedBefore && textInput.value.trim()) {
            autoGenerate();
        }
    });
    
    colorPicker.addEventListener('input', function() {
        if (hasGeneratedBefore && textInput.value.trim()) {
            autoGenerate();
        }
    });
    
    boldCheckbox.addEventListener('change', function() {
        if (hasGeneratedBefore && textInput.value.trim()) {
            autoGenerate();
        }
    });
    
    italicCheckbox.addEventListener('change', function() {
        if (hasGeneratedBefore && textInput.value.trim()) {
            autoGenerate();
        }
    });
    
    function autoGenerate() {
        // Автоматически генерируем только если уже был создан хотя бы один preview
        // и если есть текст в поле ввода
        if (hasGeneratedBefore && textInput.value.trim()) {
            generateImage();
        }
    }
    
    // Инициализация
    fontSizeValue.textContent = `${fontSize.value} px`;
});