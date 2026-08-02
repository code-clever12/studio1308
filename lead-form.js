jQuery(function ($) {
    let API_URL = 'https://studio1308.code-clever.com/api/v1/submit-form';

    // Paste the /exec URL from your Google Apps Script deployment here.
    // Leave blank to skip the Google Sheets copy.
    let GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYbM0MShIVm56KgGfdAgq8EIp-6Ht8VQ2KsatLLqkDuaEmaoeANWFNOAMpaHR5_lRy/exec';

    function submitToSheet(data) {
        if (!GOOGLE_SHEETS_URL) return;
        // no-cors: Apps Script doesn't return CORS headers, and we don't need to read the response
        fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        }).catch(function () {});
    }

    function isValidPhone(phone) {
    return (phone || '').replace(/\D/g, '').length >= 10;
    }

    function submitLead(data, $msg) {
    return $.ajax({
        url: API_URL,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json'
    });
    }

    // One draft_id per form instance, generated once when the page loads.
    $('.lead-form').each(function () {
    $(this).data('draft-id', 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
    });

    // Partial capture: as soon as the phone field looks valid, save progress
    // in the background so an abandoned form is still a recoverable lead.
    // Delayed + cancellable: clicking Submit blurs this field first, which would
    // otherwise fire this same-draft_id request in a race with the real submit
    // a few ms later and make the real submit fail. The submit handler cancels
    // this timer, so only one request ever goes out for a normal submission.
    $('.lead-form').on('blur', 'input[name="phone"]', function () {
    let $form = $(this).closest('.lead-form');
    let phone = $(this).val();

    if (!isValidPhone(phone) || $form.data('partial-sent')) {
        return;
    }

    let timer = setTimeout(function () {
        let data = {};
        $form.serializeArray().forEach(function (field) {
            data[field.name] = field.value;
        });

        data.form_slug = $form.data('form-slug');
        data.form_name = $form.data('form-name');
        data.url = window.location.href;
        data.draft_id = $form.data('draft-id');
        data.is_partial = true;

        submitLead(data, $form.find('.form-msg'));
        $form.data('partial-sent', true); // avoid re-sending on every blur
    }, 400);

    $form.data('partial-timer', timer);
    });

    $('.lead-form').on('submit', function (e) {
    e.preventDefault();

    let $form = $(this);
    clearTimeout($form.data('partial-timer')); // a full submit supersedes any pending partial capture
    let $msg = $form.find('.form-msg');
    let $button = $form.find('button[type="submit"]');
    let phone = $form.find('input[name="phone"]').val();

    if (!isValidPhone(phone)) {
        $msg.removeClass('success').addClass('error').text('Please enter a valid phone number.');
        return;
    }

    let data = {};
    $form.serializeArray().forEach(function (field) {
        data[field.name] = field.value;
    });

    data.form_slug = $form.data('form-slug');
    data.form_name = $form.data('form-name');
    data.url = window.location.href;
    data.draft_id = $form.data('draft-id');
    data.is_partial = false;
    if ($form.data('value')) {
        data.value = $form.data('value');
    }

    // Optional: capture UTM params from the page's own query string
    let params = new URLSearchParams(window.location.search);
    ['utm_term', 'utm_content', 'adgroupid', 'gad_campaignid', 'gclid'].forEach(function (key) {
        if (params.has(key)) data[key] = params.get(key);
    });

    $button.prop('disabled', true);
    $msg.text('');

    submitToSheet(data);

    $.ajax({
        url: API_URL,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json'
    })
    .done(function () {
        $msg.removeClass('error').addClass('success').text("Thanks, we'll be in touch!");
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
        event: 'generate_lead',
        form_id: $form.attr('id') || 'unknown_form',
        form_slug: data.form_slug || 'unknown_slug',
        form_name: data.form_name || 'Unknown Form',
        form_location: $form.data('form-location') || $form.closest('section').attr('id') || 'general',
        service: data.service || ''
        });
        $form[0].reset();
        $form.data('partial-sent', false);
        $form.data('draft-id', 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)); // fresh id for next lead
    })
    .fail(function () {
        $msg.removeClass('success').addClass('error').text('Something went wrong, please try again.');
    })
    .always(function () {
        $button.prop('disabled', false);
    });
    });

});