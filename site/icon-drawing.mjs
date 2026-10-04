/** An original drafting sheet built from the same glyphs as the gallery. */
export function iconDrawing(glyph) {
  const names = ['terminal', 'git-branch', 'fingerprint', 'agent-loop', 'stealth-mask'];
  return `<figure class="icon-drawing" aria-label="Burtson icon construction and scale examples">
    <figcaption><span>THE ANATOMY OF AN ACTION</span><span>24 × 24</span></figcaption>
    <div class="id-stage" aria-hidden="true">
      <div class="id-orbit"></div>
      <div class="id-axis id-axis-h"></div><div class="id-axis id-axis-v"></div>
      <div class="id-master">${glyph('agent-loop', 'id-large')}</div>
      <span class="id-measure id-top">24</span><span class="id-measure id-side">24</span>
      <div class="id-detail">${glyph('agent-loop', 'id-small')}<span>16</span>${glyph('agent-loop', 'id-medium')}<span>24</span>${glyph('agent-loop', 'id-normal')}<span>32</span></div>
    </div>
    <div class="id-specimens" aria-hidden="true">${names.map((name) => `<span>${glyph(name, 'id-specimen')}</span>`).join('')}</div>
    <p class="id-note">One grid. A family of useful details.</p>
  </figure>`;
}
