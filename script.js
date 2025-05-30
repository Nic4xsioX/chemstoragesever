// Scroll to section smoothly (optional enhancement, most modern browsers support smooth scroll via CSS)
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
  