import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_SOURCES, QUIZZES, QUIZ_IDS, findQuiz, quizAnimal } from '../src/quizzes.js';

const PACK = readFileSync(new URL('../plans/animal-quiz-content.md', import.meta.url), 'utf8');
const ANIMAL_KINDS = { fox: 'probability', owl: 'logic', deer: 'nature', badger: 'thought-experiment' };
const ALLOWED_HOSTS = new Set([
  'discovery.cs.illinois.edu', 'ocw.mit.edu', 'www.cep.ucsb.edu', 'www.nps.gov',
  'home.nps.gov', 'research.fs.usda.gov', 'plato.stanford.edu', 'iep.utm.edu',
]);
const CORRECT_MARKER = ' **Correct.**';

// Reads the pack's player fields. A Title's closing period is field punctuation, so it's dropped
// ("Three baskets." becomes "Three baskets"); a closing "?" belongs to the title and stays.
function parsePackItems(markdown) {
  const items = [];
  let item = null, list = null;
  for (const line of markdown.split('\n')) {
    let match;
    if ((match = line.match(/^### ([a-z0-9-]+)$/))) {
      item = { id: match[1], options: [], feedback: {}, authoringNotes: [] };
      items.push(item);
      list = 'options';
    } else if (line.startsWith('## ')) {
      item = null;
    } else if (!item) {
      continue;
    } else if ((match = line.match(/^\*\*Source:\*\* (.+)$/))) {
      item.sourceIds = [...match[1].matchAll(/S\d\d/g)].map(found => found[0]);
    } else if ((match = line.match(/^\*\*Title:\*\* (.+)$/))) {
      item.title = match[1].replace(/\.$/, '');
    } else if ((match = line.match(/^\*\*Question:\*\* “(.+)”$/))) {
      item.premise = match[1];
    } else if ((match = line.match(/^\*\*Explanation:\*\* (.+)$/))) {
      item.explanation = match[1];
    } else if (line === '**Feedback:**') {
      list = 'feedback';
    } else if ((match = line.match(/^\*\*Authoring notes:\*\* (.+)$/))) {
      item.authoringNotes.push(match[1]);
      list = null;
    } else if ((match = line.match(/^- `([a-z0-9-]+)`: (.+)$/))) {
      const [, id, text] = match;
      if (list === 'options') {
        const correct = text.endsWith(CORRECT_MARKER);
        item.options.push({ id, en: correct ? text.slice(0, -CORRECT_MARKER.length) : text });
        if (correct) item.correct = [...(item.correct ?? []), id];
      } else if (list === 'feedback') {
        item.feedback[id] = text;
      } else {
        throw new Error(`Unexpected list line in ${item.id}: ${line}`);
      }
    }
  }
  return items;
}

function parsePackSources(markdown) {
  const sources = {};
  for (const line of markdown.split('\n')) {
    const match = line.match(/^\| (S\d\d) \| (.+?) \| .+ \|$/);
    if (match) sources[match[1]] = [...match[2].matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map(found => found[1]);
  }
  return sources;
}

const PACK_ITEMS = parsePackItems(PACK);
const PACK_SOURCES = parsePackSources(PACK);
const ALL_ITEMS = Object.values(QUIZZES).flat();

function playerTexts(item) {
  return [
    ['title', item.title], ['premise', item.premise], ['explanation', item.explanation],
    ...item.options.map(option => [`option ${option.id}`, option]),
    ...Object.entries(item.feedback).map(([id, text]) => [`feedback ${id}`, text]),
  ];
}

function sourceTexts(source) {
  return [['name', source.name], ['summary', source.summary], ...source.links.map((link, index) => [`link ${index}`, link.label])];
}

function everyLocalized() {
  const entries = [];
  for (const item of ALL_ITEMS) {
    for (const [field, text] of playerTexts(item)) entries.push([`${item.id} ${field}`, text]);
    for (const source of item.sources) if (source.section) entries.push([`${item.id} ${source.id} section`, source.section]);
  }
  for (const source of Object.values(QUIZ_SOURCES)) {
    for (const [field, text] of sourceTexts(source)) entries.push([`${source.id} ${field}`, text]);
  }
  return entries;
}

const words = text => text.toLowerCase().replace(/[’']/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);

test('the content pack parser finds 12 complete items and 9 sources', () => {
  // Guards against a parser change that silently skips fields, which would let later comparisons pass vacuously.
  assert.equal(PACK_ITEMS.length, 12);
  for (const item of PACK_ITEMS) {
    for (const field of ['title', 'premise', 'explanation']) assert.ok(item[field], `${item.id} ${field}`);
    assert.equal(item.options.length, 3, item.id);
    assert.equal(Object.keys(item.feedback).length, 3, item.id);
    assert.equal(item.correct?.length, 1, `${item.id} has exactly one Correct marker`);
    assert.ok(item.authoringNotes.length >= 1, `${item.id} authoring notes`);
    assert.ok(item.sourceIds?.length >= 1, `${item.id} source line`);
  }
  assert.deepEqual(Object.keys(PACK_SOURCES), ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09']);
  assert.ok(Object.values(PACK_SOURCES).every(urls => urls.length >= 1));
});

test('there are 12 quizzes, three per animal, with unique IDs in pack order', () => {
  assert.deepEqual(Object.keys(QUIZZES), ['fox', 'owl', 'deer', 'badger']);
  for (const items of Object.values(QUIZZES)) assert.equal(items.length, 3);
  assert.equal(ALL_ITEMS.length, 12);
  assert.deepEqual(QUIZ_IDS, PACK_ITEMS.map(item => item.id));
  assert.deepEqual(ALL_ITEMS.map(item => item.id), QUIZ_IDS);
  assert.equal(new Set(QUIZ_IDS).size, 12);
});

test('each quiz has three unique options, a valid key, exact feedback keys, its animal’s kind, and known sources', () => {
  for (const [animal, items] of Object.entries(QUIZZES)) {
    for (const item of items) {
      const optionIds = item.options.map(option => option.id);
      assert.equal(optionIds.length, 3, item.id);
      assert.equal(new Set(optionIds).size, 3, item.id);
      assert.ok(optionIds.includes(item.correctOptionId), item.id);
      assert.deepEqual(Object.keys(item.feedback).sort(), [...optionIds].sort(), item.id);
      assert.equal(item.kind, ANIMAL_KINDS[animal], item.id);
      assert.ok(item.sources.length >= 1, item.id);
      for (const source of item.sources) {
        assert.ok(Object.hasOwn(QUIZ_SOURCES, source.id), `${item.id} cites ${source.id}`);
        assert.ok(source.section === null || (typeof source.section.cs === 'string' && typeof source.section.en === 'string'), `${item.id} ${source.id} section`);
      }
    }
  }
});

test('English player text, option order, answer keys, and cited sources match the content pack', () => {
  for (const packItem of PACK_ITEMS) {
    const item = findQuiz(packItem.id);
    assert.ok(item, packItem.id);
    assert.equal(item.title.en, packItem.title, `${item.id} title`);
    assert.equal(item.premise.en, packItem.premise, `${item.id} premise`);
    assert.equal(item.explanation.en, packItem.explanation, `${item.id} explanation`);
    assert.deepEqual(item.options.map(option => ({ id: option.id, en: option.en })), packItem.options, `${item.id} options`);
    assert.deepEqual(Object.fromEntries(Object.entries(item.feedback).map(([id, text]) => [id, text.en])), packItem.feedback, `${item.id} feedback`);
    assert.equal(item.correctOptionId, packItem.correct[0], `${item.id} answer key`);
    assert.deepEqual(item.sources.map(source => source.id), packItem.sourceIds, `${item.id} sources`);
  }
});

test('section references follow the pack', () => {
  const sectionOf = (quizId, sourceId) => findQuiz(quizId).sources.find(source => source.id === sourceId).section;
  assert.deepEqual(sectionOf('badger-theseus', 'S07'), { cs: 'oddíl 2.5', en: 'section 2.5' });
  for (const id of ['owl-cards', 'owl-counterexample', 'owl-reverse']) assert.match(sectionOf(id, 'S03').en, /^figure 87\.1$/);
  assert.match(sectionOf('fox-monty', 'S01').en, /class 3 solutions, problem 1/);
  for (const [quizId, sourceId] of [['fox-independent', 'S02'], ['fox-two-coins', 'S02'], ['deer-lichen', 'S04'], ['deer-leaf', 'S05'], ['badger-heap', 'S08'], ['badger-experience', 'S09']]) {
    assert.equal(sectionOf(quizId, sourceId), null, `${quizId} ${sourceId}`);
  }
});

test('no player or source string carries authoring notes or markdown artifacts', () => {
  // Any five-word run from an authoring note counts as leaked note text.
  const noteRuns = new Set();
  for (const note of PACK_ITEMS.flatMap(item => item.authoringNotes)) {
    const noteWords = words(note);
    for (let index = 0; index + 5 <= noteWords.length; index++) noteRuns.add(noteWords.slice(index, index + 5).join(' '));
  }
  assert.ok(noteRuns.size > 50, 'authoring notes were read');
  for (const [where, text] of everyLocalized()) {
    for (const language of ['cs', 'en']) {
      const value = text[language], padded = ` ${words(value).join(' ')} `;
      for (const run of noteRuns) assert.ok(!padded.includes(` ${run} `), `${where} ${language} repeats authoring note text “${run}”`);
      for (const note of PACK_ITEMS.flatMap(item => item.authoringNotes)) assert.ok(!value.includes(note), `${where} ${language}`);
      for (const artifact of ['Authoring', '**', 'Correct.', '`']) assert.ok(!value.includes(artifact), `${where} ${language} contains ${artifact}`);
    }
  }
});

test('every localized string is non-empty, trimmed, and uses curly quotation marks', () => {
  for (const [where, text] of everyLocalized()) {
    assert.deepEqual(Object.keys(text).filter(key => key === 'cs' || key === 'en').sort(), ['cs', 'en'], where);
    for (const language of ['cs', 'en']) {
      const value = text[language];
      assert.equal(typeof value, 'string', `${where} ${language}`);
      assert.ok(value.length > 0, `${where} ${language} is empty`);
      assert.equal(value, value.trim(), `${where} ${language} is untrimmed`);
      assert.ok(!/["']/.test(value), `${where} ${language} has a straight quote`);
    }
    const cs = text.cs, count = mark => cs.split(mark).length - 1;
    assert.ok(!cs.includes('”'), `${where} cs uses an English closing quote`);
    assert.equal(count('„'), count('“'), `${where} cs double quotes pair as „…“`);
    assert.equal(count('‚'), count('‘'), `${where} cs single quotes pair as ‚…‘`);
  }
});

test('source registry matches the pack’s HTTPS links on allowed hosts', () => {
  assert.deepEqual(Object.keys(QUIZ_SOURCES), Object.keys(PACK_SOURCES));
  for (const [id, source] of Object.entries(QUIZ_SOURCES)) {
    assert.equal(source.id, id);
    assert.deepEqual(source.links.map(link => link.url), PACK_SOURCES[id], `${id} links`);
    for (const link of source.links) {
      const url = new URL(link.url);
      assert.equal(url.protocol, 'https:', link.url);
      assert.ok(ALLOWED_HOSTS.has(url.hostname), `${link.url} host`);
    }
  }
  const cited = new Set(ALL_ITEMS.flatMap(item => item.sources.map(source => source.id)));
  assert.deepEqual([...cited].sort(), Object.keys(QUIZ_SOURCES).sort(), 'every source is cited');
});

test('findQuiz and quizAnimal resolve each ID and return null for unknown IDs', () => {
  for (const [animal, items] of Object.entries(QUIZZES)) {
    for (const item of items) {
      assert.equal(findQuiz(item.id), item);
      assert.equal(quizAnimal(item.id), animal);
    }
  }
  for (const unknown of ['fox-unknown', 'fox', '', undefined, null, 'constructor', '__proto__', 'toString', 'FOX-MONTY']) {
    assert.equal(findQuiz(unknown), null, String(unknown));
    assert.equal(quizAnimal(unknown), null, String(unknown));
  }
});
