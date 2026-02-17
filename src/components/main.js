// CSS is now loaded directly in HTML for clarity

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
      const expanded = btn.getAttribute('aria-expanded') === 'true' || false;
      btn.setAttribute('aria-expanded', !expanded);
    });
  }

  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-sm');
      navbar.classList.remove('bg-white/80', 'backdrop-blur-md');
      navbar.classList.add('bg-white', 'backdrop-blur-none');
    } else {
      navbar.classList.remove('shadow-sm', 'bg-white', 'backdrop-blur-none');
      navbar.classList.add('bg-white/80', 'backdrop-blur-md');
    }
  });
});
