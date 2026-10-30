/** Publicación idempotente: crea un borrador, adjunta el ZIP y después lo publica. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = async function publicar({ github, context, core, root = process.cwd() }) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const version = manifest.version;
  if (!/^\d+\.\d+\.\d+$/.test(version) || pkg.version !== version) throw Error('Versión inválida o distinta entre los manifiestos.');
  const tag = `v${version}`, nombre = `ecos-frontera-${version}.zip`;
  const data = fs.readFileSync(path.join(root, 'releases', nombre));
  const digest = `sha256:${crypto.createHash('sha256').update(data).digest('hex')}`;
  const cambios = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const bloques = cambios.split(/^## /m).slice(1);
  const bloque = bloques.find(b => b.split('\n')[0].startsWith(`${version} `) || b.split('\n')[0].trim() === version);
  if (!bloque) throw Error(`Faltan notas de ${version} en CHANGELOG.md.`);
  const body = bloque.slice(bloque.indexOf('\n') + 1).trim()
    + `\n\nInstalación: con Foundry cerrado y el mundo respaldado, reemplaza la carpeta Data/modules/ecos-frontera por la del ZIP adjunto.\n\nSHA-256 del ZIP: \`${digest.slice(7)}\`.\n\nLas pruebas automáticas no sustituyen la comprobación dentro de Foundry con los módulos de la campaña.`;
  const { owner, repo } = context.repo;
  let release;
  try {
    release = (await github.rest.repos.getReleaseByTag({ owner, repo, tag })).data;
  } catch (error) {
    if (error.status !== 404) throw error;
    release = (await github.rest.repos.createRelease({ owner, repo, tag_name: tag,
      target_commitish: context.sha, name: `Ecos de la Frontera ${version}`, body,
      draft: true, prerelease: false })).data;
  }
  const existente = release.assets?.find(a => a.name === nombre);
  if (existente) {
    if (existente.size !== data.length || (existente.digest && existente.digest !== digest)) {
      throw Error(`El archivo de ${tag} ya existe con otro contenido. No se sobrescribe una versión publicada.`);
    }
  } else {
    await github.rest.repos.uploadReleaseAsset({ owner, repo, release_id: release.id, name: nombre,
      data, headers: { 'content-type': 'application/zip', 'content-length': data.length } });
  }
  if (release.draft) release = (await github.rest.repos.updateRelease({ owner, repo, release_id: release.id,
    draft: false, make_latest: 'true' })).data;
  core.notice(`Release publicado: ${release.html_url}`);
  core.setOutput('url', release.html_url);
  return release.html_url;
};
