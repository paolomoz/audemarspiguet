/**
 * product-highlights — PDP feature callouts (live ap-featured-products):
 * Case / Dial / Bracelet rows with big Scene7 layered close-ups and
 * label/value/unit spec items.
 *
 * Authoring rows: [ text cell: h2 + description p + optional "Label: value
 * unit" p's ][ image cell: desktop composite img + mobile composite img ].
 * Rows alternate sides automatically (odd rows: text left / image right;
 * even rows: image left / text right — live order).
 */

const SPEC_RE = /^([^:]+):\s*([\d.]+)\s*([a-z]+)$/i;

export default function decorate(block) {
  const features = [];

  [...block.children].forEach((row, i) => {
    const [textCell, imgCell] = [...row.children];
    if (!textCell) return;

    const feature = document.createElement('div');
    feature.className = `ph-feature ${i % 2 === 0 ? 'ph-feature-media-right' : 'ph-feature-media-left'}`;

    const text = document.createElement('div');
    text.className = 'ph-text';
    const heading = textCell.querySelector('h2, h3');
    if (heading) text.append(heading);
    const list = document.createElement('ul');
    list.className = 'ph-list';
    [...textCell.querySelectorAll('p')].forEach((p) => {
      const m = p.textContent.trim().match(SPEC_RE);
      if (m) {
        const [, labelText, valueText, unitText] = m;
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.className = 'ph-label';
        label.textContent = labelText.trim();
        const value = document.createElement('span');
        value.className = 'ph-value';
        value.textContent = valueText;
        const unit = document.createElement('span');
        unit.className = 'ph-unit';
        unit.textContent = ` ${unitText}`;
        li.append(label, value, unit);
        list.append(li);
      } else {
        const desc = document.createElement('div');
        desc.className = 'ph-desc';
        desc.append(p);
        text.append(desc);
      }
    });
    if (list.children.length) text.append(list);

    const media = document.createElement('div');
    media.className = 'ph-media';
    if (imgCell) {
      const imgs = [...imgCell.querySelectorAll('img')];
      imgs.forEach((img, j) => {
        img.classList.add(j === 0 ? 'ph-img-desktop' : 'ph-img-mobile');
        img.setAttribute('loading', 'lazy');
        const box = document.createElement('div');
        box.className = 'ph-imgbox';
        box.append(img);
        media.append(box);
      });
    }

    feature.append(text, media);
    features.push(feature);
  });

  block.replaceChildren(...features);
}
