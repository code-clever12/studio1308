jQuery(function ($) {
    let API_URL = 'https://studio1308.code-clever.com/api/v1/submit-form';

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
    $('.lead-form').on('blur', 'input[name="phone"]', function () {
    let $form = $(this).closest('.lead-form');
    let phone = $(this).val();

    if (!isValidPhone(phone) || $form.data('partial-sent')) {
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
    data.is_partial = true;

    submitLead(data, $form.find('.form-msg'));
    $form.data('partial-sent', true); // avoid re-sending on every blur
    });

    $('.lead-form').on('submit', function (e) {
    e.preventDefault();

    let $form = $(this);
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

    // Per-form metadata, pulled from the form's own data attributes
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
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
        if (params.has(key)) data[key] = params.get(key);
    });

    $button.prop('disabled', true);
    $msg.text('');

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