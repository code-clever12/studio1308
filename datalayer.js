window.dataLayer = window.dataLayer || [];

document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href^="tel:"]');
  if (!link) return;

  window.dataLayer.push({
    event: 'phone_call_click',
    cta_section: (link.closest('section') || {}).id || 'unknown'
  });
});


document.addEventListener('submit', function (e) {
  const form = e.target.closest('form');

  if (!form) return;

  const formId = form.id || 'unknown_form';
  const formLocation = form.getAttribute('data-form-location') || form.closest('section')?.id || 'general';

  // dataLayer event for lead generation
  window.dataLayer.push({
    event: 'generate_lead',
    form_id: formId,
    form_location: formLocation
  });

});

(function() {
  const sections = document.querySelectorAll('section[data-section-name]');
  const seen = new Set();
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting || seen.has(entry.target.id)) return;
      seen.add(entry.target.id);
      window.dataLayer.push({
        event: 'section_view',
        section_name: entry.target.dataset.sectionName,
        section_id: entry.target.id || 'unknown'
      });
    });
  }, { threshold: 0, rootMargin: '-15% 0px -15% 0px' });
  sections.forEach(function(s) { 
    observer.observe(s); 
  });
})();