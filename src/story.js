// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (story introduction pass)
// Data-driven opening for offline story mode. Pages are intentionally broad mood/setting text:
// no new canon, named geography, Cipher powers or story tower is established here. Future
// dialogue/story events can add pages or reuse StoryDeck without changing the overlay code.
export const STORY_PAGES = Object.freeze([
  Object.freeze({
    id: 'road-beyond',
    title: 'THE ROAD BEYOND',
    body: Object.freeze([
      'The maps end at the training-yard fence. Past it, the old roads have gone quiet.',
      'The settlements that remain keep their lamps low, their gates shut, and their business brief. News travels slower than rumour.'
    ])
  }),
  Object.freeze({
    id: 'place-to-begin',
    title: 'A PLACE TO BEGIN',
    body: Object.freeze([
      'This yard is one of the last places where a lesson costs nothing but breath. Sensei keeps the ring swept and the gate open.',
      'There are no titles waiting here. Only practice.'
    ])
  }),
  Object.freeze({
    id: 'wilderness',
    title: 'THE WILDERNESS',
    body: Object.freeze([
      'North of the gate, a worn track cuts through scrub and broken ground. An occupied outpost watches the road.',
      'The raiders there are not an army. They are what remains when no one is left to keep the peace.'
    ])
  }),
  Object.freeze({
    id: 'the-work',
    title: 'THE WORK',
    body: Object.freeze([
      'You begin with a staff, a pair of hands and a place to stand. The rest is repetition: footwork, distance, timing, restraint.',
      'No blow here is meant to kill. The first lesson is knowing when to stop.'
    ])
  }),
  Object.freeze({
    id: 'training-begins',
    title: 'TRAINING BEGINS',
    body: Object.freeze([
      'Spar with Sensei. Walk the north road. Learn what the outpost is guarding — and what it is not.',
      'The story is yours to carry from here.'
    ])
  })
]);

export class StoryDeck {
  constructor(pages = STORY_PAGES) {
    this.pages = Array.isArray(pages) && pages.length ? pages : STORY_PAGES;
    this.index = 0;
  }

  get page() {
    return this.pages[this.index];
  }

  get count() {
    return this.pages.length;
  }

  get isLast() {
    return this.index >= this.pages.length - 1;
  }

  next() {
    if (this.isLast) return false;
    this.index += 1;
    return true;
  }

  reset() {
    this.index = 0;
    return this;
  }
}
