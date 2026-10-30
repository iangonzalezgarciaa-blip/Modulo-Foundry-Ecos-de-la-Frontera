import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import publicar from '../tools/publish-release.cjs';

function entorno(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecos-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'releases'));
  const base = 'https://github.com/autor/modulo';
  fs.writeFileSync(path.join(root, 'module.json'), JSON.stringify({ version: '1.2.3',
    manifest: `${base}/releases/latest/download/module.json`, download: `${base}/releases/download/v1.2.3/ecos-frontera-1.2.3.zip` }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), '# Cambios\n\n## 1.2.3 — Prueba\n\n- Cambio comprobado.\n');
  fs.writeFileSync(path.join(root, 'releases/ecos-frontera-1.2.3.zip'), 'archivo de prueba del adaptador HTTP');
  const estado = { release: null, calls: [], fallarManifest: false, esperados: 2 };
  const repos = {
    async getReleaseByTag() { if (!estado.release) throw Object.assign(Error('ausente'), { status: 404 }); return { data: estado.release }; },
    async createRelease(data) { estado.calls.push('crear'); estado.release = { id: 1, draft: data.draft, body: data.body, assets: [], html_url: `${base}/releases/tag/v1.2.3` }; return { data: estado.release }; },
    async uploadReleaseAsset(data) {
      if (estado.fallarManifest && data.name === 'module.json') throw Error('falló el adjunto');
      estado.calls.push(data.name);
      const asset = { name: data.name, size: data.data.length, digest: 'sha256:' + crypto.createHash('sha256').update(data.data).digest('hex') };
      estado.release.assets.push(asset); return { data: asset };
    },
    async updateRelease(data) { assert.equal(estado.release.assets.length, estado.esperados); estado.calls.push('publicar'); estado.release.draft = data.draft; return { data: estado.release }; }
  };
  return { estado, root, args: { github: { rest: { repos } }, context: { repo: { owner: 'autor', repo: 'modulo' }, sha: 'commit-validado' },
    core: { notice() {}, setOutput() {} }, root } };
}

test('un Release se publica después de adjuntar el ZIP y el manifiesto', async t => {
  const e = entorno(t); await publicar(e.args);
  assert.deepEqual(e.estado.calls, ['crear','ecos-frontera-1.2.3.zip','module.json','publicar']);
  assert.equal(e.estado.release.draft, false);
});
test('reintentar conserva los archivos ya publicados y rechaza contenido distinto', async t => {
  const e = entorno(t); await publicar(e.args); await publicar(e.args);
  assert.equal(e.estado.calls.length, 4);
  e.estado.release.assets[1].digest = 'sha256:otro';
  await assert.rejects(publicar(e.args), /No se sobrescribe/);
  assert.equal(e.estado.calls.length, 4);
});
test('un fallo al adjuntar el manifiesto mantiene el borrador y permite reanudar', async t => {
  const e = entorno(t); e.estado.fallarManifest = true;
  await assert.rejects(publicar(e.args), /falló el adjunto/);
  assert.equal(e.estado.release.draft, true); assert.equal(e.estado.release.assets.length, 1);
  e.estado.fallarManifest = false; await publicar(e.args);
  assert.deepEqual(e.estado.calls, ['crear','ecos-frontera-1.2.3.zip','module.json','publicar']);
});
test('no publica un manifiesto cuya descarga apunta a otra versión', async t => {
  const e = entorno(t), file = path.join(e.root, 'module.json');
  const m = JSON.parse(fs.readFileSync(file)); m.download = m.download.replace('v1.2.3','v0.0.1'); fs.writeFileSync(file, JSON.stringify(m));
  await assert.rejects(publicar(e.args), /no apunta/); assert.equal(e.estado.calls.length, 0);
});
test('modo privado adjunta el ayudante y no exige enlaces públicos', async t => {
  const e = entorno(t); e.estado.esperados = 3;
  fs.writeFileSync(path.join(e.root, 'package.json'), JSON.stringify({ version: '1.2.3', ecosUpdateMode: 'private' }));
  fs.writeFileSync(path.join(e.root, 'module.json'), JSON.stringify({ version: '1.2.3' }));
  fs.mkdirSync(path.join(e.root, 'tools/windows'), { recursive: true });
  fs.writeFileSync(path.join(e.root, 'tools/windows/Ecos-Actualizar.ps1'), '# ayudante de prueba');
  await publicar(e.args);
  assert.deepEqual(e.estado.calls, ['crear','ecos-frontera-1.2.3.zip','module.json','Ecos-Actualizar.ps1','publicar']);
  assert.match(e.estado.release.body, /Actualización privada/);
});
test('modo privado rechaza anunciar una actualización nativa sin autenticación', async t => {
  const e = entorno(t);
  fs.writeFileSync(path.join(e.root, 'package.json'), JSON.stringify({ version: '1.2.3', ecosUpdateMode: 'private' }));
  await assert.rejects(publicar(e.args), /modo privado/); assert.equal(e.estado.calls.length, 0);
});
