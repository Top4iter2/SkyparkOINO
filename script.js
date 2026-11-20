document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('scratchCanvas');
    const ctx = canvas.getContext('2d');
    const actionBlock = document.getElementById('actionBlock');
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const successModal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');

    let isDrawing = false;
    let isRevealed = false;

    // Настройка размеров холста под Retina-экраны телефонов
    function initCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Заливка серебристым градиентом (защитный слой)
        const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
        gradient.addColorStop(0, '#3a3f58');
        gradient.addColorStop(0.5, '#525875');
        gradient.addColorStop(1, '#2c3044');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Текст-подсказка поверх защитного слоя
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '600 14px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨ Потри здесь пальцем ✨', rect.width / 2, rect.height / 2);
    }

    initCanvas();

    // Получение координат касания/курсора
    function getPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // Функция стирания
    function scratch(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
        checkScratchPercentage();
    }

    // Проверка, сколько процентов уже стерто
    function checkScratchPercentage() {
        if (isRevealed) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        // Проверяем каждый 16-й пиксель для высокой скорости работы на телефоне
        for (let i = 3; i < pixels.length; i += 64) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }

        const totalSampled = pixels.length / 64;
        const percentage = (transparentPixels / totalSampled) * 100;

        // Если стерто больше 40%, плавно убираем остаток слоя и показываем кнопки
        if (percentage > 40) {
            isRevealed = true;
            canvas.style.opacity = '0';
            setTimeout(() => {
                canvas.style.display = 'none';
            }, 500);
            actionBlock.classList.remove('hidden');

            // Легкая вибрация на поддерживаемых смартфонах
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

    // События для сенсорных экранов (телефоны)
    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const pos = getPosition(e);
        scratch(pos.x, pos.y);
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        const pos = getPosition(e);
        scratch(pos.x, pos.y);
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
        isDrawing = false;
    });

    // События для мыши (на случай теста с ПК)
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const pos = getPosition(e);
        scratch(pos.x, pos.y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const pos = getPosition(e);
        scratch(pos.x, pos.y);
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // Интерактив с кнопкой "Нет" (убегает при попытке нажать)
    const noTexts = [
        'Точно нет? 🤔',
        'Подумай еще раз!',
        'Билеты уже почти куплены...',
        'Эта кнопка сломалась 😅',
        'Нажимай на розовую!'
    ];
    let noClickCount = 0;

    function dodgeButton(e) {
        e.preventDefault();
        const randomX = (Math.random() - 0.5) * 160;
        const randomY = (Math.random() - 0.5) * 90;
        
        noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
        noBtn.textContent = noTexts[noClickCount % noTexts.length];
        noClickCount++;

        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }

    noBtn.addEventListener('touchstart', dodgeButton);
    noBtn.addEventListener('click', dodgeButton);

    // Согласие
    yesBtn.addEventListener('click', () => {
        successModal.classList.remove('hidden');
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 100]);
        }
    });

    closeModal.addEventListener('click', () => {
        successModal.classList.add('hidden');
    });
});
