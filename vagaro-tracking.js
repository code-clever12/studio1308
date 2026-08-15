// Vagaro booking-value capture — listens for postMessage from the embedded
// Vagaro widget on this page, and hands the captured $ value off to
// thank-you.html via localStorage (Vagaro redirects there after a
// completed booking).
(function () {
  var VALUE_KEY    = 'vagaro_booking_value';
  var CURRENCY_KEY = 'vagaro_booking_currency';
  var TXN_KEY      = 'vagaro_booking_txn';
  var DEBUG_KEY    = 'vagaro_message_history'; // keeps every message seen this session, not just the last one
  var DEBUG_MAX    = 50; // cap so a long session doesn't grow this unbounded

  // Best-effort field name guesses — Vagaro's real payload shape is
  // unconfirmed. Do one real test booking, check the browser console
  // (or JSON.parse(localStorage["vagaro_message_history"]) for the full
  // sequence) for the actual field names, then tighten this list to match.
  var VALUE_KEYS = [
    'total', 'grandtotal', 'grandTotal', 'bookingtotal', 'bookingTotal',
    'ordertotal', 'orderTotal', 'amount', 'amountpaid', 'amountPaid',
    'price', 'totalprice', 'totalPrice', 'totalamount', 'totalAmount',
    'subtotal', 'value'
  ];
  var TXN_KEYS = [
    'transactionid', 'transactionId', 'bookingid', 'bookingId',
    'orderid', 'orderId', 'id', 'confirmationnumber', 'confirmationNumber',
    'customerid', 'customerId'
  ];

  function findFirstMatch(obj, keys, seen) {
    if (!obj || typeof obj !== 'object') return null;
    seen = seen || new Set();
    if (seen.has(obj)) return null;
    seen.add(obj);

    var objKeys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      for (var j = 0; j < objKeys.length; j++) {
        if (objKeys[j].toLowerCase() === keys[i].toLowerCase()) {
          return obj[objKeys[j]];
        }
      }
    }
    for (var k = 0; k < objKeys.length; k++) {
      var v = obj[objKeys[k]];
      if (v && typeof v === 'object') {
        var found = findFirstMatch(v, keys, seen);
        if (found !== null && found !== undefined) return found;
      }
    }
    return null;
  }

  function toNumber(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') {
      var n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
      if (isFinite(n)) return n;
    }
    return null;
  }

  // Confirmed-noisy message shapes from a live test — Vagaro's iframe fires
  // these constantly (roughly every 0.5-1s) purely to auto-resize itself.
  // They carry no booking data and were flooding the capped debug history
  // below, pushing out the rarer, meaningful events (e.g. the confirmed
  // "eventName": "CreditCardCaptureViewed" style messages).
  function isNoise(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.object === 'requestSize') return true;
    if (data.eventType === 'setHeightBuilder') return true;
    return false;
  }

  window.addEventListener('message', function (event) {
    if (!event.origin || event.origin.indexOf('vagaro.com') === -1) return;

    var raw = event.data;
    var data = raw;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = null; }
    }

    // Discovery logging — keeps every non-noise message from this page load
    // in order, so we can see the full sequence (e.g. a booking-confirmation
    // message near the end). Keep this until Vagaro's real payload shape for
    // a *completed* booking is confirmed, then it's safe to remove.
    if (!isNoise(data)) {
      console.log('[Vagaro message]', event.origin, raw);
      try {
        var history = [];
        try { history = JSON.parse(localStorage.getItem(DEBUG_KEY)) || []; } catch (e) {}
        history.push({ origin: event.origin, data: raw, at: new Date().toISOString() });
        if (history.length > DEBUG_MAX) history = history.slice(history.length - DEBUG_MAX);
        localStorage.setItem(DEBUG_KEY, JSON.stringify(history));
      } catch (e) {}
    }

    if (!data || typeof data !== 'object') return;

    // Only extract from the confirmed, authoritative completion event.
    // Scanning every message risked grabbing a price shown earlier in the
    // flow (e.g. while browsing services, before the customer finished or
    // changed their booking) and mistaking it for the final value.
    if (data.eventName !== 'BookingCompleted') return;

    var value = toNumber(findFirstMatch(data, VALUE_KEYS));
    var txn = findFirstMatch(data, TXN_KEYS); // reliably finds customerId on this event

    try {
      if (value !== null) {
        localStorage.setItem(VALUE_KEY, String(value));
        localStorage.setItem(CURRENCY_KEY, 'USD');
      }
      if (txn) localStorage.setItem(TXN_KEY, String(txn));
      console.log('[Vagaro] BookingCompleted captured — value:', value, 'txn:', txn);
    } catch (e) {}
  });
})();
