/**
 * video — PDP media module (live ap-video / video.js): poster + centered
 * 48px play button; click swaps in the real player (native <video> for
 * Scene7/DAM mp4 URLs, YouTube iframe for youtube.com links).
 *
 * Authoring rows: [ poster image ] , [ video URL link ].
 * Live PDP videos do NOT autoplay — the poster + big play button IS the
 * resting state (verified in the 26420SO captures).
 */

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
  + '<path d="M8 5.5v13l11-6.5z" fill="currentColor"></path></svg>';

export default function decorate(block) {
  const poster = block.querySelector('img');
  const link = block.querySelector('a');
  const href = link ? link.getAttribute('href') : null;

  const frame = document.createElement('figure');
  frame.className = 'video-frame';

  if (poster) {
    poster.setAttribute('loading', 'lazy');
    frame.append(poster);
  }

  if (href) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-play';
    btn.setAttribute('aria-label', 'Play video');
    btn.innerHTML = PLAY_ICON;
    frame.append(btn);

    btn.addEventListener('click', () => {
      if (/youtube\.com|youtu\.be/.test(href)) {
        const iframe = document.createElement('iframe');
        const sep = href.includes('?') ? '&' : '?';
        iframe.src = `${href}${sep}autoplay=1`;
        iframe.title = poster ? poster.alt : 'Video';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        frame.replaceChildren(iframe);
      } else {
        const video = document.createElement('video');
        video.src = href;
        video.controls = true;
        video.playsInline = true;
        if (poster) video.poster = poster.currentSrc || poster.src;
        frame.replaceChildren(video);
        video.play().catch(() => {});
      }
    });
  }

  const container = document.createElement('div');
  container.className = 'grid-container';
  container.append(frame);
  block.replaceChildren(container);
}
