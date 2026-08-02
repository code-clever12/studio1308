jQuery(function ($) {
    let API_URL = 'https://studio1308.code-clever.com/api/v1/submit-form';

    // Paste the /exec URL from your Google Apps Script deployment here.
    // Leave blank to skip the Google Sheets copy.
    let GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYbM0MShIVm56KgGfdAgq8EIp-6Ht8VQ2KsatLLqkDuaEmaoeANWFNOAMpaHR5_lRy/exec';

    // ── Booking rules for the step-2 date/time picker ──
    let BOOKING_START_HOUR = 8;   // 8:00 AM
    let BOOKING_END_HOUR = 17;    // 5:00 PM (last bookable slot)
    let BOOKING_MIN_LEAD_MINUTES = 60; // can't pick a time less than 1 hour from now
    let BOOKING_CLOSED_WEEKDAYS = [0]; // 0 = Sunday

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

    // ── Date/time helpers ──
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }

    function toISODate(d) {
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }

    function parseISODate(dateStr) {
        let p = dateStr.split('-');
        return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function formatHourLabel(h) {
        let period = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        return h12 + ':00 ' + period;
    }

    function formatDateLabel(dateStr) {
        let d = parseISODate(dateStr);
        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    // Hourly slots between BOOKING_START_HOUR and BOOKING_END_HOUR, minus anything
    // closer than BOOKING_MIN_LEAD_MINUTES from right now (only matters for today).
    function timeSlotsForDate(dateStr) {
        let minDateTime = new Date(Date.now() + BOOKING_MIN_LEAD_MINUTES * 60 * 1000);
        let d = parseISODate(dateStr);
        let slots = [];

        for (let h = BOOKING_START_HOUR; h <= BOOKING_END_HOUR; h++) {
            let slotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0, 0);
            if (slotDate < minDateTime) continue;
            slots.push({ value: pad2(h) + ':00', label: formatHourLabel(h) });
        }
        return slots;
    }

    function isClosedDay(date) {
        return BOOKING_CLOSED_WEEKDAYS.indexOf(date.getDay()) !== -1;
    }

    // ── Step 2 markup: build once per form, wrapping the existing fields as "step 1" ──
    function buildBookingStep($form) {
        if ($form.data('booking-built')) return;
        $form.data('booking-built', true);

        $form.children().wrapAll('<div class="lead-step lead-step-1 active"></div>');

        let step2 = '' +
            '<div class="lead-step lead-step-2">' +
                '<button type="button" class="lead-back">&larr; Back</button>' +
                '<p class="lead-step2-title">Pick a preferred date &amp; time</p>' +
                '<div class="booking-picker">' +
                    '<div class="booking-cal"></div>' +
                    '<div class="booking-times">' +
                        '<div class="booking-times-head">Select a date</div>' +
                        '<div class="booking-times-list"></div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="lead-submit lead-confirm" disabled>Confirm Request &rarr;</button>' +
                '<div class="form-msg-final"></div>' +
            '</div>';

        $form.append(step2);
    }

    function bookingState($form) {
        let state = $form.data('booking-state');
        if (!state) {
            let today = new Date();
            state = { year: today.getFullYear(), month: today.getMonth(), date: null, time: null };
            $form.data('booking-state', state);
        }
        return state;
    }

    function renderCalendar($form) {
        let state = bookingState($form);
        let $cal = $form.find('.booking-cal');
        let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let firstOfMonth = new Date(state.year, state.month, 1);
        let startWeekday = firstOfMonth.getDay();
        let daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
        let isCurrentMonth = (state.year === today.getFullYear() && state.month === today.getMonth());

        let html = '<div class="cal-head">' +
            '<span class="cal-title">' + monthNames[state.month] + ' ' + state.year + '</span>' +
            '<div class="cal-nav-group">' +
                '<button type="button" class="cal-nav cal-prev"' + (isCurrentMonth ? ' disabled' : '') + ' aria-label="Previous month">&#8249;</button>' +
                '<button type="button" class="cal-nav cal-next" aria-label="Next month">&#8250;</button>' +
            '</div>' +
        '</div>';

        html += '<div class="cal-weekdays">';
        ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(function (d) { html += '<span>' + d + '</span>'; });
        html += '</div>';

        html += '<div class="cal-days">';
        for (let i = 0; i < startWeekday; i++) html += '<span class="cal-day cal-day-empty"></span>';

        for (let d = 1; d <= daysInMonth; d++) {
            let thisDate = new Date(state.year, state.month, d);
            let dateStr = toISODate(thisDate);
            let isPast = thisDate < today;
            let closed = isClosedDay(thisDate);
            let noSlotsLeft = !isPast && !closed && timeSlotsForDate(dateStr).length === 0;
            let disabled = isPast || closed || noSlotsLeft;
            let selected = state.date === dateStr;

            html += '<button type="button" class="cal-day' +
                (disabled ? ' cal-day-disabled' : '') +
                (selected ? ' cal-day-selected' : '') +
                '" data-date="' + dateStr + '"' + (disabled ? ' disabled' : '') + '>' + d + '</button>';
        }
        html += '</div>';

        $cal.html(html);
    }

    function renderTimeList($form) {
        let state = bookingState($form);
        let $head = $form.find('.booking-times-head');
        let $list = $form.find('.booking-times-list');

        if (!state.date) {
            $head.text('Select a date');
            $list.html('');
            return;
        }

        $head.text(formatDateLabel(state.date));
        let slots = timeSlotsForDate(state.date);

        if (!slots.length) {
            $list.html('<p class="time-empty">No times left for this date — try another day.</p>');
            return;
        }

        let html = '';
        slots.forEach(function (s) {
            let selected = state.time === s.value;
            html += '<button type="button" class="time-slot' + (selected ? ' time-slot-selected' : '') + '" data-time="' + s.value + '">' +
                '<span class="time-dot"></span>' + s.label +
                '</button>';
        });
        $list.html(html);
    }

    // One draft_id per form instance, generated once when the page loads.
    $('.lead-form').each(function () {
    $(this).data('draft-id', 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
    buildBookingStep($(this));
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

    // Step 1 submit: validate contact info, then advance to the date/time picker
    // instead of submitting right away.
    $('.lead-form').on('submit', function (e) {
    e.preventDefault();

    let $form = $(this);
    clearTimeout($form.data('partial-timer')); // a full submit supersedes any pending partial capture
    let $msg = $form.find('.lead-step-1 .form-msg');
    let phone = $form.find('input[name="phone"]').val();

    if (!isValidPhone(phone)) {
        $msg.removeClass('success').addClass('error').text('Please enter a valid phone number.');
        return;
    }

    $msg.text('');
    $form.find('.lead-step-1').removeClass('active');
    $form.find('.lead-step-2').addClass('active');
    renderCalendar($form);
    renderTimeList($form);
    });

    // Step 2: calendar navigation, date pick, time pick, back, confirm
    $(document).on('click', '.cal-prev', function () {
    let $form = $(this).closest('.lead-form');
    let state = bookingState($form);
    state.month--;
    if (state.month < 0) { state.month = 11; state.year--; }
    renderCalendar($form);
    });

    $(document).on('click', '.cal-next', function () {
    let $form = $(this).closest('.lead-form');
    let state = bookingState($form);
    state.month++;
    if (state.month > 11) { state.month = 0; state.year++; }
    renderCalendar($form);
    });

    $(document).on('click', '.cal-day:not(.cal-day-disabled):not(.cal-day-empty)', function () {
    let $form = $(this).closest('.lead-form');
    let state = bookingState($form);
    state.date = $(this).data('date');
    state.time = null;
    renderCalendar($form);
    renderTimeList($form);
    $form.find('.lead-confirm').prop('disabled', true);
    });

    $(document).on('click', '.time-slot', function () {
    let $form = $(this).closest('.lead-form');
    let state = bookingState($form);
    state.time = $(this).data('time');
    renderTimeList($form);
    $form.find('.lead-confirm').prop('disabled', false);
    });

    $(document).on('click', '.lead-back', function () {
    let $form = $(this).closest('.lead-form');
    $form.find('.lead-step-2').removeClass('active');
    $form.find('.lead-step-1').addClass('active');
    });

    // Step 2 submit: this is the real lead submission — now carries the
    // preferred date/time alongside the contact info collected in step 1.
    $(document).on('click', '.lead-confirm', function () {
    let $form = $(this).closest('.lead-form');
    let state = bookingState($form);
    let $button = $(this);
    let $msg = $form.find('.form-msg-final');

    if (!state.date || !state.time) return;

    let data = {};
    $form.serializeArray().forEach(function (field) {
        data[field.name] = field.value;
    });

    data.form_slug = $form.data('form-slug');
    data.form_name = $form.data('form-name');
    data.url = window.location.href;
    data.draft_id = $form.data('draft-id');
    data.is_partial = false;
    data.preferred_date = state.date;
    data.preferred_time = state.time;
    data.preferred_slot_display = formatDateLabel(state.date) + ' at ' + formatHourLabel(parseInt(state.time, 10));
    if ($form.data('value')) {
        data.value = $form.data('value');
    }

    // Optional: capture UTM/ad-tracking params from the page's own query string.
    // URL param names are set by Google Ads and can't be renamed — only the key
    // we send them under is renamed to "utm_..." so the admin CRM groups them
    // with the rest of the tracking data instead of listing them separately.
    let params = new URLSearchParams(window.location.search);
    ['utm_term', 'utm_content', 'adgroupid', 'gad_campaignid', 'gclid'].forEach(function (key) {
        if (params.has(key)) {
            let apiKey = key.indexOf('utm_') === 0 ? key : 'utm_' + key;
            data[apiKey] = params.get(key);
        }
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
        $msg.removeClass('error').addClass('success').text("Thanks! We'll confirm your " + data.preferred_slot_display + " request shortly.");
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
        event: 'generate_lead',
        form_id: $form.attr('id') || 'unknown_form',
        form_slug: data.form_slug || 'unknown_slug',
        form_name: data.form_name || 'Unknown Form',
        form_location: $form.data('form-location') || $form.closest('section').attr('id') || 'general',
        service: data.service || '',
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time
        });
        $form[0].reset();
        $form.data('partial-sent', false);
        $form.data('draft-id', 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)); // fresh id for next lead
        $form.data('booking-state', null);
    })
    .fail(function () {
        $msg.removeClass('success').addClass('error').text('Something went wrong, please try again.');
    })
    .always(function () {
        $button.prop('disabled', false);
    });
    });

});
