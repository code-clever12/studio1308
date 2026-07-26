window.dataLayer = window.dataLayer || [];

document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href^="tel:"]');
  if (!link) return;

  window.dataLayer.push({
    event: 'phone_call_click',
    cta_section: (link.closest('section') || {}).id || 'unknown'
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

(function() {
  const thresholds = [10, 30, 60, 120, 180, 300]; // seconds
  let activeSeconds = 0;
  let nextIndex = 0;

  setInterval(function() {
    if (document.visibilityState !== 'visible') return;

    activeSeconds += 1;

    if (nextIndex < thresholds.length && activeSeconds >= thresholds[nextIndex]) {
      window.dataLayer.push({
        event: 'time_on_page',
        seconds_on_page: thresholds[nextIndex]
      });

      console.log('Time on Page Milestone:', thresholds[nextIndex] + 's');
      nextIndex += 1;
    }
  }, 1000);
})();