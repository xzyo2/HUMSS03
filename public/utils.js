const phrases = ["Best section known to man", "Worst section known to man"];
let phraseIndex = 0, charIndex = 0, isDeleting = false;

function typeWriter() {
    const target = document.querySelector('.typewriter');
    if (!target) return;
    const currentPhrase = phrases[phraseIndex];
    let typeSpeed = 100;
    if (isDeleting) {
        target.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50;
    } else {
        target.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }
    if (!isDeleting && charIndex === currentPhrase.length) { 
        isDeleting = true; typeSpeed = 2000; 
    } else if (isDeleting && charIndex === 0) { 
        isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; typeSpeed = 500; 
    }
    setTimeout(typeWriter, typeSpeed);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3200);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        let current = progress * (end - start) + start;
        obj.innerHTML = current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
