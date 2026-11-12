import crypto from 'node:crypto';
export const events = new Map();
export const settings = new Map();
export const messages = [];
export const notices = [];
export function merge(a, b) {
  const out = structuredClone(a);
  for (const [k, v] of Object.entries(b)) out[k] = v && !Array.isArray(v) && typeof v === 'object'
    ? merge(out[k] ?? {}, v) : structuredClone(v);
  return out;
}
export function put(o, path, value) {
  const parts = path.split('.'), last = parts.pop();
  let t = o;
  for (const p of parts) t = t[p] ??= {};
  if (last.startsWith('-=')) delete t[last.slice(2)];
  else t[last] = value;
}
export const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
export const collection = (values = []) => Object.assign(values, { get(id) { return this.find(x => x.id === id); } });

class Document {
  constructor(data, parent) {
    Object.assign(this, structuredClone(data));
    this.parent = parent;
    this.id = this._id ?? crypto.randomBytes(8).toString('hex');
    this._id = this.id;
  }
  getFlag(m, k) { return this.flags?.[m]?.[k]; }
  async setFlag(m, k, v) { return this.update({ [`flags.${m}.${k}`]: v }); }
  updateSource(changes) { for (const [k, v] of Object.entries(changes)) put(this, k, v); }
  async update(changes) { this.updateSource(changes); return this; }
  toObject() {
    const { parent, actor, ...own } = this;
    return structuredClone(own);
  }
}
export class MockEffect extends Document {
  constructor(data, parent) {
    super(data, parent);
    this.statuses = new Set(data.statuses ?? []);
    this.duration ??= {};
  }
  async delete() {
    this.parent.effects.splice(this.parent.effects.indexOf(this), 1);
    for (const st of this.statuses) if (!this.parent.effects.some(ef => ef.statuses.has(st))) this.parent.statuses.delete(st);
  }
  toObject() { const out = super.toObject(); out.statuses = [...this.statuses]; return out; }
}
export class MockItem extends Document {
  constructor(data, actor) { super(data, actor); this.actor = actor; }
  async delete() { this.actor.items.splice(this.actor.items.indexOf(this), 1); }
}
export class MockActor {
  constructor(level = 1, patch = {}, options = {}) {
    this.id = crypto.randomUUID(); this.uuid = `Actor.${this.id}`;
    this.documentName = 'Actor'; this.name = 'Actor local'; this.type = 'character'; this.isOwner = true;
    this.ownerId = 'player';
    this.system = { details: { level }, attributes: { prof: Math.floor((level + 7) / 4), exhaustion: 0,
      hp: { value: 100 }, movement: { units: 'm', walk: 9 }, ac: { value: 10 } },
      abilities: Object.fromEntries(['str','dex','con','int','wis','cha'].map(k => [k, { mod: 0 }])),
      skills: {}, currency: { soul: 1 } };
    this.flags = { 'ecos-frontera': { verbe: { despierto: true, reglasVersion: 2, car: 'wis', valor: 5,
      dotes: [], nats: ['fuego'], rangos: { forma: 1 }, principal: 'forma', fuerza: 'ninguna', cultivos: {},
      infusiones: {}, gastados: 0, ...patch } } };
    this.items = collection(); this.effects = collection(); this.statuses = new Set();
    this.updates = []; this.deletedItems = []; this.updatedItems = [];
    this.savingThrows = 0; this.saveTotal = 99; this.failNextUpdate = false;
    Object.assign(this, options);
    game.actors.push(this);
  }
  getFlag(m, k) { return this.flags[m]?.[k]; }
  async setFlag(m, k, v) { return this.update({ [`flags.${m}.${k}`]: v }); }
  async unsetFlag(m, k) { return this.update({ [`flags.${m}.-=${k}`]: null }); }
  testUserPermission(user) { return user?.isGM || user?.id === this.ownerId; }
  getActiveTokens() { return []; }
  async update(changes) {
    if (this.failNextUpdate) { this.failNextUpdate = false; throw Error('actualización rechazada'); }
    this.updates.push(structuredClone(changes));
    for (const [k, v] of Object.entries(changes)) put(this, k, v);
    for (const fn of events.get('updateActor') ?? []) fn(this, changes, {});
    return this;
  }
  async rollSkill() { return [{ total: 99 }]; }
  async rollSavingThrow() { this.savingThrows++; return [{ total: this.saveTotal }]; }
  async createEmbeddedDocuments(type, docs) {
    if (type === 'Item') return docs.map(d => { const it = new MockItem(d, this); this.items.push(it); return it; });
    return docs.map(d => {
      const ef = new MockEffect(d, this); this.effects.push(ef);
      for (const s of ef.statuses) this.statuses.add(s);
      return ef;
    });
  }
  async updateEmbeddedDocuments(type, docs) {
    this.updatedItems.push(...docs.map(d => d._id));
    return Promise.all(docs.map(async d => { const it = this.items.get(d._id); await it.update(d); return it; }));
  }
  async deleteEmbeddedDocuments(type, ids) {
    if (type === 'Item') { this.deletedItems.push(...ids); for (const id of ids) await this.items.get(id)?.delete(); }
  }
  async applyDamage() {}
}

export function resetEnvironment() {
  settings.clear(); settings.set('capaVExtra', []); settings.set('capaVPendientes', []);
  messages.length = 0; notices.length = 0;
  const gm = { id: 'gm', isGM: true, isSelf: true, active: true };
  const player = { id: 'player', isGM: false, isSelf: false, active: true };
  const users = collection([gm, player]); users.activeGM = gm;
  globalThis.game = { user: gm, users, actors: collection(), time: { worldTime: 0 }, modules: new Map(), combat: null,
    settings: { get: (m, k) => settings.get(k), set: async (m, k, v) => { settings.set(k, v); return v; },
      register: (m, k, cfg) => { if (!settings.has(k)) settings.set(k, cfg.default); } } };
  globalThis.CONFIG = { DND5E: { spellcasting: {}, spellLevels: {}, skills: {}, spellSchools: {} }, statusEffects: [] };
  globalThis.CONST = { USER_ROLES: { ASSISTANT: 3 } };
  globalThis.MidiQOL = { setReactionUsed: async () => {}, hasUsedReaction: () => false };
  globalThis.ChatMessage = { create: async data => { messages.push(data); return { id: crypto.randomUUID() }; }, getSpeaker: () => ({}) };
}
Math.clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
globalThis.foundry = { applications: { api: { ApplicationV2: class {}, DialogV2: { confirm: async () => true } } },
  utils: { deepClone: structuredClone, mergeObject: merge, setProperty: put, getProperty: get, expandObject: o => { const out = {}; for (const [k, v] of Object.entries(o ?? {})) put(out, k, v); return out; },
    hasProperty: (o, k) => get(o, k) !== undefined,
    randomID: (n = 16) => crypto.randomBytes(n).toString('hex').slice(0, n) } };
globalThis.Hooks = { once(name, fn) { const list = events.get(name) ?? []; list.push(fn); events.set(name, list); },
  on(name, fn) { const list = events.get(name) ?? []; list.push(fn); events.set(name, list); } };
globalThis.ui = { notifications: Object.fromEntries(['warn','info','error'].map(k => [k, msg => notices.push({ type: k, msg })])) };
globalThis.Actor = MockActor;
globalThis.Roll = class { constructor() { this.total = 3; } async evaluate() { return this; } async toMessage() {} };
resetEnvironment();
