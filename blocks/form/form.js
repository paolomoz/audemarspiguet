/**
 * form — AP contact form, static/resting parity (source: ap-contact-us-form,
 * /ch/en/form/contact-us). Submission backend (.postcontactus. servlet),
 * reCAPTCHA v3, validation-on-submit and the geo-resolved local contact are
 * DEFERRED (interaction-only — register candidate, R-02/R-03 class).
 *
 * Authoring rows are keyed by their first cell (fixed composition, template-
 * slotted like hero/dual-text):
 *  - local-contact: [key, card content (label p, selected <strong>, tel link,
 *    hours ul "days|hours"), regions ul]
 *  - salutation / residence / phone-code / contact-method / reason:
 *    [key, label, placeholder, options ul?] → select field
 *  - first-name / last-name / email / phone-number:
 *    [key, label, placeholder] → text field
 *  - message: [key, label] → textarea
 *  - acknowledgement: [key, rich text]
 *  - submit: [key, button label]
 */

const CHEVRON = '<svg viewBox="0 0 12 8" aria-hidden="true" focusable="false">'
  + '<path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"></path></svg>';

const TEXT_TYPES = { email: 'email', 'phone-number': 'tel' };

let uid = 0;

function field(key, labelText, control, extraClass) {
  uid += 1;
  const id = `fm-${key}-${uid}`;
  const div = document.createElement('div');
  div.className = `fm-field fm-${key}${extraClass ? ` ${extraClass}` : ''}`;
  const label = document.createElement('label');
  label.className = 'fm-label';
  label.htmlFor = id;
  label.textContent = labelText;
  control.id = id;
  const wrap = document.createElement('div');
  wrap.className = 'fm-control';
  wrap.append(control);
  if (control.tagName === 'SELECT') {
    div.classList.add('fm-is-select');
    const chev = document.createElement('span');
    chev.className = 'fm-chevron';
    chev.innerHTML = CHEVRON;
    wrap.append(chev);
    const sync = () => {
      const filled = control.selectedIndex > -1
        && control.options[control.selectedIndex]
        && control.options[control.selectedIndex].value !== '';
      div.classList.toggle('fm-filled', filled);
    };
    control.addEventListener('change', sync);
    sync();
  }
  div.append(label, wrap);
  return div;
}

function makeSelect(placeholder, optionsCell, selectedText) {
  const select = document.createElement('select');
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.disabled = true;
    opt.hidden = true;
    opt.selected = !selectedText;
    opt.textContent = placeholder;
    select.append(opt);
  }
  if (optionsCell) {
    optionsCell.querySelectorAll('li').forEach((li) => {
      const opt = document.createElement('option');
      opt.value = li.textContent.trim();
      opt.textContent = li.textContent.trim();
      if (selectedText && opt.value === selectedText) opt.selected = true;
      select.append(opt);
    });
  }
  return select;
}

function makeInput(key, placeholder) {
  const input = document.createElement('input');
  input.type = TEXT_TYPES[key] || 'text';
  input.name = key;
  input.placeholder = placeholder || '';
  return input;
}

function buildCard(cardCell, regionsCell) {
  const card = document.createElement('aside');
  card.className = 'fm-card';
  const ps = [...cardCell.querySelectorAll('p')];
  const labelText = ps[0] ? ps[0].textContent.trim() : 'Local Contact';
  const selected = cardCell.querySelector('strong');
  const selectedText = selected ? selected.textContent.trim() : '';
  const tel = cardCell.querySelector('a[href^="tel:"]');

  const select = makeSelect('', regionsCell, selectedText);
  card.append(field('local-contact', labelText, select));
  if (tel) {
    tel.className = 'fm-phone';
    card.append(tel);
  }
  const hoursUl = cardCell.querySelector('ul');
  if (hoursUl) {
    const hours = document.createElement('ul');
    hours.className = 'fm-hours';
    hoursUl.querySelectorAll('li').forEach((li) => {
      const [days, time] = li.textContent.split('|').map((s) => s.trim());
      const row = document.createElement('li');
      const d = document.createElement('span');
      d.textContent = days || '';
      const t = document.createElement('span');
      t.textContent = time || '';
      row.append(d, t);
      hours.append(row);
    });
    card.append(hours);
  }
  return card;
}

export default function decorate(block) {
  const rows = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = cells[0] ? cells[0].textContent.trim().toLowerCase() : '';
    if (key) rows[key] = cells.slice(1);
  });

  const txt = (cells, i) => (cells && cells[i] ? cells[i].textContent.trim() : '');

  const wrap = document.createElement('div');
  wrap.className = 'grid-container';
  const body = document.createElement('div');
  body.className = 'fm-body';

  if (rows['local-contact']) {
    body.append(buildCard(rows['local-contact'][0], rows['local-contact'][1]));
  }

  const form = document.createElement('form');
  form.className = 'fm-fields';
  form.noValidate = true;
  // static/resting parity only — submission servlet + reCAPTCHA deferred
  form.addEventListener('submit', (e) => e.preventDefault());

  const selectField = (key, extraClass) => {
    const c = rows[key];
    if (!c) return null;
    return field(key, txt(c, 0), makeSelect(txt(c, 1), c[2]), extraClass);
  };
  const textField = (key, extraClass) => {
    const c = rows[key];
    if (!c) return null;
    return field(key, txt(c, 0), makeInput(key, txt(c, 1)), extraClass);
  };

  const nameRow = document.createElement('div');
  nameRow.className = 'fm-row fm-row-name';
  nameRow.append(...[selectField('salutation'), textField('first-name'), textField('last-name')].filter(Boolean));
  form.append(nameRow);

  [selectField('residence'), textField('email')].filter(Boolean).forEach((f) => form.append(f));

  const phoneRow = document.createElement('div');
  phoneRow.className = 'fm-row fm-row-phone';
  phoneRow.append(...[selectField('phone-code'), textField('phone-number')].filter(Boolean));
  form.append(phoneRow);

  [selectField('contact-method'), selectField('reason')].filter(Boolean).forEach((f) => form.append(f));

  if (rows.message) {
    const ta = document.createElement('textarea');
    ta.name = 'message';
    ta.maxLength = 2000;
    form.append(field('message', txt(rows.message, 0), ta, 'fm-textarea'));
  }

  if (rows.acknowledgement) {
    const ack = document.createElement('p');
    ack.className = 'fm-ack';
    const src = rows.acknowledgement[0].querySelector('p') || rows.acknowledgement[0];
    ack.innerHTML = src.innerHTML;
    form.append(ack);
  }

  if (rows.submit) {
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'fm-submit';
    btn.textContent = txt(rows.submit, 0) || 'Submit';
    form.append(btn);
  }

  body.append(form);
  wrap.append(body);
  block.replaceChildren(wrap);
}
