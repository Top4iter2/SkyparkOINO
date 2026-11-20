  

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
 
