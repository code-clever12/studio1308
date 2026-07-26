window.dataLayer = window.dataLayer || [];

document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href^="tel:"]');
  if (!link) return;

  window.dataLayer.push({
    event: 'phone_call_click',
    cta_section: (link.closest('section') || {}).id || 'unknown'
  });
});