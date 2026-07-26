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