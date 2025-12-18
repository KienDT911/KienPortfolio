document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const successBox = document.getElementById('contact-success');

    // Trigger entrance animations on load
    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    if (heroLeft) heroLeft.classList.add('enter');
    if (heroRight) heroRight.classList.add('enter');

    if (!form) return;

    function showMessage(message, type = 'success') {
        successBox.textContent = message;
        successBox.classList.remove('success', 'error');
        successBox.classList.add(type);
        successBox.hidden = false;
        if (type === 'success') {
            setTimeout(() => {
                successBox.hidden = true;
            }, 4000);
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = (form.name.value || '').trim();
        const email = (form.email.value || '').trim();
        const message = (form.message.value || '').trim();

        if (!name || !email || !message) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        // Basic email pattern check
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Simulate sending (replace with real POST / API later)
        showMessage('Sending...', 'success');
        setTimeout(() => {
            form.reset();
            showMessage('Thanks — your message was sent!', 'success');
        }, 700);
    });

    // Observe contact section to animate when scrolled into view
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('enter');
                }
            });
        }, {threshold: 0.15});
        io.observe(contactSection);
    }
});
