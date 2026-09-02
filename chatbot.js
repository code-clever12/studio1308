// 1308 Studio chat widget — floating trigger + welcome menu + rule-based FAQ bot.
// Client-side FAQ matching (no AI, no cost). Optionally captures name/email/phone
// once per visitor and forwards it to the existing Laravel CRM. Conversation is
// persisted to localStorage so a page reload shows the previous chat. Replaces Tawk.to.
(function () {
  'use strict';

  var LEAD_API_URL = 'https://studio1308.code-clever.com/api/v1/submit-form';

  var STORAGE_CONTACT = 'chatbot_contact';           // {name, email, phone} once given
  var STORAGE_PROMPTED = 'chatbot_contact_prompted'; // '1' once asked (given or skipped)
  var STORAGE_THREAD = 'chatbot_thread';              // array of message entries
  var STORAGE_SCREEN = 'chatbot_screen';              // 'welcome' | 'thread'

  var STUDIO_PHONE_DISPLAY = '+1 (912) 800-0555';
  var STUDIO_PHONE_TEL = '+19128000555';

  document.addEventListener('DOMContentLoaded', init);

  // ── Storage helpers — wrapped defensively so a locked-down privacy mode
  // degrades to "nothing remembered" instead of breaking the widget. ──
  function getRaw(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function setRaw(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function getJSON(key) { try { return JSON.parse(getRaw(key)); } catch (e) { return null; } }
  function setJSON(key, val) { setRaw(key, JSON.stringify(val)); }

  function init() {
    var root = buildWidgetDOM();
    document.body.appendChild(root);

    var toggle = root.querySelector('#chatbotToggle');
    var panel = root.querySelector('#chatbotPanel');
    var closeBtn = root.querySelector('#chatbotClose');
    var body = root.querySelector('#chatbotBody');

    var knowledgeBase = buildKnowledgeBase();

    function openPanel() {
      panel.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-label', 'Close chat');
    }
    function closePanel() {
      panel.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-label', 'Open chat');
    }

    toggle.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });
    closeBtn.addEventListener('click', closePanel);

    function scrollToSection(id) {
      closePanel();
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderWelcome() {
      setRaw(STORAGE_SCREEN, 'welcome');
      body.innerHTML =
        '<div class="chatbot-welcome">' +
          '<p class="chatbot-greeting">Hi! 👋 I\'m here to help. What can I do for you?</p>' +
          '<button type="button" class="chatbot-menu-btn" id="chatbotCallBtn">' +
            '<span class="chatbot-menu-icon">📞</span>' +
            '<span>Call us</span>' +
            '<span class="chatbot-menu-arrow">' + arrowIcon() + '</span>' +
          '</button>' +
          '<button type="button" class="chatbot-menu-btn" id="chatbotFaqBtn">' +
            '<span class="chatbot-menu-icon">💬</span>' +
            '<span>Have a question?</span>' +
            '<span class="chatbot-menu-arrow">' + arrowIcon() + '</span>' +
          '</button>' +
          '<button type="button" class="chatbot-menu-btn" id="chatbotBookBtn">' +
            '<span class="chatbot-menu-icon">📅</span>' +
            '<span>Book an appointment</span>' +
            '<span class="chatbot-menu-arrow">' + arrowIcon() + '</span>' +
          '</button>' +
        '</div>';

      body.querySelector('#chatbotCallBtn').addEventListener('click', function () { window.location.href = 'tel:' + STUDIO_PHONE_TEL; });
      body.querySelector('#chatbotFaqBtn').addEventListener('click', function () { renderThread(false); });
      body.querySelector('#chatbotBookBtn').addEventListener('click', function () { scrollToSection('book-widget'); });
    }

    // restoring = true when rebuilding a previously-saved conversation (e.g. after
    // a page reload); false when the visitor is opening the FAQ flow fresh.
    function renderThread(restoring) {
      setRaw(STORAGE_SCREEN, 'thread');
      body.innerHTML =
        '<div class="chatbot-thread">' +
          '<button type="button" class="chatbot-back">&larr; Back</button>' +
          '<div class="chatbot-messages" id="chatbotMessages"></div>' +
          '<div class="chatbot-suggestions" id="chatbotSuggestions"></div>' +
          '<form class="chatbot-input-row" id="chatbotForm">' +
            '<input type="text" id="chatbotInput" placeholder="Type your question..." autocomplete="off" aria-label="Type your question">' +
            '<button type="submit" aria-label="Send">' + sendIcon() + '</button>' +
          '</form>' +
        '</div>';

      var messages = body.querySelector('#chatbotMessages');
      var suggestions = body.querySelector('#chatbotSuggestions');
      var form = body.querySelector('#chatbotForm');
      var input = body.querySelector('#chatbotInput');

      body.querySelector('.chatbot-back').addEventListener('click', renderWelcome);

      if (restoring) {
        var saved = getJSON(STORAGE_THREAD) || [];
        saved.forEach(function (entry) { renderStoredEntry(messages, entry); });
        renderSuggestions(suggestions, messages, knowledgeBase);
      } else if (!getRaw(STORAGE_PROMPTED)) {
        // Hide the FAQ chips and input until the contact card is actually
        // resolved (submitted or skipped) — otherwise a visitor could just
        // tap a suggestion and bypass the card without it ever registering.
        suggestions.hidden = true;
        form.hidden = true;
        renderContactCapture(messages, function () {
          suggestions.hidden = false;
          form.hidden = false;
          renderSuggestions(suggestions, messages, knowledgeBase);
        });
      } else {
        addBotMessage(messages, "Ask me anything, or tap a quick question below.");
        renderSuggestions(suggestions, messages, knowledgeBase);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        addUserMessage(messages, text);
        input.value = '';
        respond(messages, knowledgeBase, text);
      });
    }

    // One-time, skippable name/email/phone capture — rendered as a card inside
    // the thread rather than blocking it, so declining still lets the visitor
    // use the FAQ bot normally. onResolved runs after submit or skip, once the
    // card is gone, to reveal the FAQ chips/input that were hidden until now.
    function renderContactCapture(messages, onResolved) {
      var card = document.createElement('div');
      card.className = 'chatbot-capture';
      card.innerHTML =
        '<p class="chatbot-capture-title">Call us now at <a href="tel:' + STUDIO_PHONE_TEL + '" class="chatbot-capture-phone">' + STUDIO_PHONE_DISPLAY + '</a>, or share a few quick details below and we\'ll reach out within minutes.</p>' +
        '<input type="text" class="chatbot-capture-input" id="chatbotCapName" placeholder="Full name" autocomplete="name">' +
        '<input type="tel" class="chatbot-capture-input" id="chatbotCapPhone" placeholder="Phone number" autocomplete="tel">' +
        '<input type="email" class="chatbot-capture-input" id="chatbotCapEmail" placeholder="Email (optional)" autocomplete="email">' +
        '<div class="chatbot-capture-actions">' +
          '<button type="button" class="chatbot-capture-skip" id="chatbotCapSkip">Skip</button>' +
          '<button type="button" class="chatbot-capture-submit" id="chatbotCapSubmit">Submit</button>' +
        '</div>' +
        '<p class="chatbot-capture-note" id="chatbotCapNote"></p>';
      messages.appendChild(card);
      messages.scrollTop = messages.scrollHeight;

      card.querySelector('#chatbotCapSkip').addEventListener('click', function () {
        setRaw(STORAGE_PROMPTED, '1');
        card.remove();
        addBotMessage(messages, "No problem! Ask me anything, or tap a quick question below.");
        onResolved();
      });

      card.querySelector('#chatbotCapSubmit').addEventListener('click', function () {
        var name = card.querySelector('#chatbotCapName').value.trim();
        var phone = card.querySelector('#chatbotCapPhone').value.trim();
        var email = card.querySelector('#chatbotCapEmail').value.trim();
        var note = card.querySelector('#chatbotCapNote');

        if (!name || !isValidPhone(phone)) {
          note.textContent = 'Please enter your name and a valid phone number.';
          return;
        }

        var contact = { name: name, phone: phone, email: email };
        setJSON(STORAGE_CONTACT, contact);
        setRaw(STORAGE_PROMPTED, '1');
        submitLead(contact);

        card.remove();
        addBotMessage(messages, 'Thanks, ' + escapeHTML(name.split(' ')[0]) + '! Ask me anything, or tap a quick question below.');
        onResolved();
      });
    }

    // Bot bubbles render via innerHTML (so hardcoded answers can include real
    // links), so any visitor-supplied text folded into a bot message — like
    // their own name here — must be escaped first to avoid it being parsed as HTML.
    function escapeHTML(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function isValidPhone(phone) {
      return (phone || '').replace(/\D/g, '').length >= 10;
    }

    // Ad-tracking params, same convention as the site's old lead forms: any
    // key sent with a "utm_" prefix gets auto-grouped by the Laravel CRM.
    function collectAdParams() {
      var params = new URLSearchParams(window.location.search);
      var fields = {};
      ['utm_term', 'utm_content', 'adgroupid', 'gad_campaignid', 'gclid', 'keyword'].forEach(function (key) {
        if (params.has(key)) {
          var apiKey = key.indexOf('utm_') === 0 ? key : 'utm_' + key;
          fields[apiKey] = params.get(key);
        }
      });
      return fields;
    }

    function submitLead(contact) {
      var data = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        form_slug: 'chatbot-contact',
        form_name: 'Chatbot Contact',
        url: window.location.href
      };
      var adParams = collectAdParams();
      for (var k in adParams) { if (adParams.hasOwnProperty(k)) data[k] = adParams[k]; }

      fetch(LEAD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function () {});
    }

    function respond(messages, kb, userText) {
      var match = matchQuestion(kb, userText);
      if (match) {
        addBotMessage(messages, match.answer);
        if (match.action === 'book') {
          addActionButton(messages, 'Take me to booking →', 'book');
        } else if (match.action === 'services') {
          addActionButton(messages, 'Show me the menu →', 'services');
        }
      } else {
        addBotMessage(messages, "I don't have an answer for that one — here's what I can help with, or call us directly.");
        addActionButton(messages, '📞 Call ' + STUDIO_PHONE_DISPLAY, 'call');
      }
    }

    // ── Persisted message rendering ──
    // Every entry is {type: 'bot'|'user'|'action', text, actionType}. Storing
    // an actionType (not a function) keeps this JSON-serializable so a saved
    // thread can be fully replayed after a page reload.
    function pushToThread(entry) {
      var thread = getJSON(STORAGE_THREAD) || [];
      thread.push(entry);
      setJSON(STORAGE_THREAD, thread);
    }

    function runAction(actionType) {
      if (actionType === 'book') scrollToSection('book-widget');
      else if (actionType === 'services') scrollToSection('services');
      else if (actionType === 'call') window.location.href = 'tel:' + STUDIO_PHONE_TEL;
    }

    function renderStoredEntry(container, entry) {
      if (entry.type === 'user') renderUserBubble(container, entry.text);
      else if (entry.type === 'bot') renderBotBubble(container, entry.text);
      else if (entry.type === 'action') renderActionBtn(container, entry.text, entry.actionType);
    }

    function renderUserBubble(container, text) {
      var el = document.createElement('div');
      el.className = 'chatbot-msg chatbot-msg-user';
      el.textContent = text;
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
    }
    // innerHTML is safe here: bot answers only ever come from the hardcoded
    // knowledge base or the page's own on-page FAQ text — never from what a
    // visitor types (that stays on textContent in renderUserBubble above).
    function renderBotBubble(container, html) {
      var el = document.createElement('div');
      el.className = 'chatbot-msg chatbot-msg-bot';
      el.innerHTML = html;
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
    }
    function renderActionBtn(container, label, actionType) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'chatbot-msg-action';
      el.textContent = label;
      el.addEventListener('click', function () { runAction(actionType); });
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
    }

    function addUserMessage(container, text) {
      renderUserBubble(container, text);
      pushToThread({ type: 'user', text: text });
    }
    function addBotMessage(container, text) {
      renderBotBubble(container, text);
      pushToThread({ type: 'bot', text: text });
    }
    function addActionButton(container, label, actionType) {
      renderActionBtn(container, label, actionType);
      pushToThread({ type: 'action', text: label, actionType: actionType });
    }

    // ── Suggestion chips ──
    function renderSuggestions(container, messages, kb) {
      kb.slice(0, 5).forEach(function (entry) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chatbot-chip';
        chip.textContent = truncate(entry.question, 34);
        chip.addEventListener('click', function () {
          addUserMessage(messages, entry.question);
          addBotMessage(messages, entry.answer);
          if (entry.action === 'book') addActionButton(messages, 'Take me to booking →', 'book');
          else if (entry.action === 'services') addActionButton(messages, 'Show me the menu →', 'services');
          chip.remove();
        });
        container.appendChild(chip);
      });
    }

    // ── Entry point: restore previous screen/conversation if one exists ──
    var savedScreen = getRaw(STORAGE_SCREEN);
    var savedThread = getJSON(STORAGE_THREAD) || [];
    if (savedScreen === 'thread' && savedThread.length) {
      renderThread(true);
    } else {
      renderWelcome();
    }
  }

  // ── Knowledge base: a small set of universal facts, plus whatever FAQ
  // content already exists on this specific page (scraped from the real,
  // visible #faq section so the bot never contradicts what's on the page). ──
  function buildKnowledgeBase() {
    var universal = [
      {
        keywords: ['hour', 'hours', 'open', 'close', 'closing', 'time'],
        question: 'What are your hours?',
        answer: "We're open Mon-Fri 10 AM-6 PM, Sat 9 AM-3 PM, and Sunday by appointment only."
      },
      {
        keywords: ['park', 'parking', 'location', 'address', 'where', 'directions'],
        question: 'Where are you & is parking easy?',
        answer: "We're at 1308 Martin Luther King Jr Blvd, Savannah, GA 31415. Free parking is right in front of and behind the building — no meters, no permits."
      },
      {
        keywords: ['discount', 'off', 'deal', 'promo', 'new client', 'first visit'],
        question: 'Any new client discount?',
        answer: 'Yes — new guests get 10% off their first visit. Just mention it when you book.'
      },
      {
        keywords: ['phone', 'call', 'number', 'text', 'reach'],
        question: 'How can I reach you?',
        answer: 'Call or text us at <a href="tel:' + STUDIO_PHONE_TEL + '" class="chatbot-msg-link">' + STUDIO_PHONE_DISPLAY + '</a>, or book online anytime.'
      },
      {
        keywords: ['service', 'services', 'price', 'pricing', 'cost', 'menu', 'hair', 'lash', 'lashes', 'brow', 'brows'],
        question: 'What services & pricing do you offer?',
        answer: 'We offer hair (cuts, color, balayage), lash extensions, brows, and head spa treatments. Scroll down to see our full menu and pricing.',
        action: 'services'
      },
      {
        keywords: ['book', 'appointment', 'schedule', 'reserve', 'availability', 'slot'],
        question: 'How do I book?',
        answer: 'You can book online right on this page — it only takes about 2 minutes.',
        action: 'book'
      }
    ];

    var pageFaq = document.querySelectorAll('#faq .faq-item');
    pageFaq.forEach(function (item) {
      var qEl = item.querySelector('.faq-q');
      var aEl = item.querySelector('.faq-a');
      if (!qEl || !aEl) return;
      var questionText = qEl.textContent.trim();
      var answerText = aEl.textContent.trim();
      if (!questionText || !answerText) return;
      universal.push({
        keywords: extractKeywords(questionText),
        question: questionText,
        answer: answerText
      });
    });

    return universal;
  }

  var STOPWORDS = ['a', 'an', 'the', 'is', 'are', 'do', 'does', 'i', 'you', 'your', 'my', 'to', 'for', 'of', 'in', 'on',
    'or', 'and', 'can', 'what', 'how', 'when', 'if', 'it', 'be', 'with', 'this', 'that', 'me', 'we', 'us', 'our'];

  function extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(function (w) { return w.length > 2 && STOPWORDS.indexOf(w) === -1; });
  }

  function matchQuestion(kb, userText) {
    var normalized = userText.toLowerCase();
    var best = null;
    var bestScore = 0;
    kb.forEach(function (entry) {
      var score = 0;
      entry.keywords.forEach(function (kw) {
        if (normalized.indexOf(kw) !== -1) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });
    return bestScore > 0 ? best : null;
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1).trim() + '…' : str;
  }

  function arrowIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  }
  function sendIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  }
  function closeIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  }
  function chatIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  }

  function buildWidgetDOM() {
    var wrap = document.createElement('div');
    wrap.className = 'chatbot-widget';
    wrap.innerHTML =
      '<button type="button" id="chatbotToggle" class="chatbot-toggle" aria-label="Open chat">' +
        '<span class="chatbot-icon-chat">' + chatIcon() + '</span>' +
        '<span class="chatbot-icon-close">' + closeIcon() + '</span>' +
        '<span class="chatbot-badge" aria-hidden="true"></span>' +
      '</button>' +
      '<div id="chatbotPanel" class="chatbot-panel" role="dialog" aria-label="1308 Studio chat">' +
        '<div class="chatbot-header">' +
          '<div class="chatbot-header-info">' +
            '<div class="chatbot-avatar">1308</div>' +
            '<div>' +
              '<div class="chatbot-title">1308 Studio</div>' +
              '<div class="chatbot-subtitle">Usually replies instantly</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" id="chatbotClose" class="chatbot-close" aria-label="Close chat">' + closeIcon() + '</button>' +
        '</div>' +
        '<div class="chatbot-body" id="chatbotBody"></div>' +
      '</div>';
    return wrap;
  }
})();
