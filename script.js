document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('scratchCanvas');
    const ctx = canvas.getContext('2d');
    const actionBlock = document.getElementById('actionBlock');
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const successModal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');
    const statusBadge = document.getElementById('statusBadge');

    // Элементы для 3D-параллакса
    const ticketCard = document.getElementById('ticketCard');
    const holoGlare = document.getElementById('holoGlare');

    let isDrawing = false;
    let isRevealed = false;

    // ==========================================
    // 1. 3D-ПАРАЛЛАКС ОТ ГИРОСКОПА ТЕЛЕФОНА
    // ==========================================
    let baseBeta = null;
    let baseGamma = null;
    let gyroEnabled = false;

    function applyTilt(rotateX, rotateY, glareX, glareY) {
        const clampedX = Math.max(-16, Math.min(16, rotateX));
        const clampedY = Math.max(-16, Math.min(16, rotateY));

        ticketCard.style.transform = `rotateX(${clampedX}deg) rotateY(${clampedY}deg)`;

        const shadowX = -clampedY * 1.4;
        const shadowY = 22 + clampedX * 1.4;
        ticketCard.style.boxShadow = `${shadowX}px ${shadowY}px 45px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.14)`;

        holoGlare.style.background = `radial-gradient(
            circle at ${glareX}% ${glareY}%,
            rgba(255, 255, 255, 0.32) 0%,
            rgba(5, 217, 232, 0.18) 25%,
            rgba(255, 42, 109, 0.12) 48%,
            transparent 72%
        )`;
        holoGlare.style.opacity = '0.95';
    }

    function handleOrientation(event) {
        if (event.beta === null || event.gamma === null) return;

        if (baseBeta === null) baseBeta = event.beta;
        if (baseGamma === null) baseGamma = event.gamma;

        const deltaBeta = event.beta - baseBeta;
        const deltaGamma = event.gamma - baseGamma;

        const rotateX = -deltaBeta * 0.45;
        const rotateY = deltaGamma * 0.45;

        const glareX = Math.max(0, Math.min(100, 50 + deltaGamma * 1.6));
        const glareY = Math.max(0, Math.min(100, 50 + deltaBeta * 1.6));

        requestAnimationFrame(() => {
            applyTilt(rotateX, rotateY, glareX, glareY);
        });
    }

    function enableGyroscope() {
        if (gyroEnabled) return;

        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        gyroEnabled = true;
                    }
                })
                .catch(console.error);
        } else if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', handleOrientation);
            gyroEnabled = true;
        }
    }

    enableGyroscope();
    document.body.addEventListener('touchstart', enableGyroscope, { once: true });

    document.addEventListener('mousemove', (e) => {
        if (gyroEnabled && baseBeta !== null) return;
        const rect = ticketCard.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 12;
        const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 12;
        const glareX = ((e.clientX - rect.left) / rect.width) * 100;
        const glareY = ((e.clientY - rect.top) / rect.height) * 100;

        applyTilt(rotateX, rotateY, glareX, glareY);
    });

    // ==========================================
    // 2. СКРЕТЧ-СЛОЙ БИЛЕТА И СМЕНА АТМОСФЕРЫ
    // ==========================================
    function initCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
        gradient.addColorStop(0, '#3a3f58');
        gradient.addColorStop(0.5, '#525875');
        gradient.addColorStop(1, '#2c3044');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rect.width, rect.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '600 14px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨ Потри здесь пальцем ✨', rect.width / 2, rect.height / 2);
    }

    initCanvas();

    function getPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function scratch(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
        checkScratchPercentage();
    }

    function checkScratchPercentage() {
        if (isRevealed) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 64) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }

        const totalSampled = pixels.length / 64;
        const percentage = (transparentPixels / totalSampled) * 100;

        if (percentage > 40) {
            isRevealed = true;
            canvas.style.opacity = '0';
            setTimeout(() => {
                canvas.style.display = 'none';
            }, 500);

            // Переключаем неоновую подсветку фона и статус билета
            document.body.classList.add('unlocked');
            statusBadge.textContent = 'ACCESS GRANTED • VIP';

            actionBlock.classList.remove('hidden');

            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

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

    // ==========================================
    // 3. КНОПКИ ОТВЕТА И МОДАЛЬНОЕ ОКНО
    // ==========================================
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
