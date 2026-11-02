const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async ({github, context, core}) => {
  const config = JSON.parse(await fs.readFile('fork-release.json', 'utf8'));
  const {owner, repo} = context.repo;
  const files = (await fs.readdir('release-assets')).sort();
  if (files.length !== 4 || !files.some(file => file.endsWith('.exe')) ||
      !files.includes('SHA256SUMS.txt') || !files.includes('BUILD-INFO.json') ||
      !files.includes('LICENSE.txt')) {
    throw new Error('Incomplete release assets');
  }
  const source = `https://github.com/${owner}/${repo}/commit/${context.sha}`;
  const upstream = `https://github.com/OutlineFoundation/outline-apps/tree/${config.upstreamCommit}`;
  const body = [
    'Unofficial Windows x86 installer built from the patched source in this fork.',
    '',
    'Open the side menu and uncheck **Start Outline when signing in to Windows** to disable automatic startup. Connecting to a VPN no longer adds the client back to Windows startup. The choice is saved; startup is off by default.',
    '',
    'When startup is disabled, the client also skips automatic restoration of the saved VPN connection. Automatic update checks are disabled so an upstream update cannot silently remove this fix. The networking engine, TAP drivers and OutlineService are unchanged.',
    '',
    `**Version:** ${config.version}`,
    `**Source:** [${context.sha}](${source})`,
    `**Upstream source:** [${config.upstreamTag}](${upstream}) (${config.upstreamCommit})`,
    '',
    'The upstream base is a release-candidate source tag. This is not an official stable Outline release.',
    '',
    '**Experimental and unsigned.** The installer was compiled on GitHub Actions. Application installation, Windows startup behavior, and real VPN connectivity have not been tested. Use at your own risk. No ongoing maintenance is planned.',
    '',
    'Download the `.exe` under Assets. `SHA256SUMS.txt` contains file checksums; `BUILD-INFO.json` identifies the source and build run. The automatic Source code archives are not installers.',
    '',
    'Upstream reports: [#686](https://github.com/OutlineFoundation/outline-apps/issues/686), [#1478](https://github.com/OutlineFoundation/outline-apps/issues/1478), [#2559](https://github.com/OutlineFoundation/outline-apps/issues/2559).',
  ].join('\n');

  let release;
  try {
    release = (await github.rest.repos.getReleaseByTag({owner, repo, tag: config.tag})).data;
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  if (release) {
    const reference = (await github.rest.git.getRef({owner, repo, ref: `tags/${config.tag}`})).data;
    if (reference.object.type !== 'commit' || reference.object.sha !== context.sha) {
      throw new Error('The release tag already points at different source; refusing to replace it');
    }
    if (!release.draft) {
      if (files.every(file => release.assets.some(asset => asset.name === file))) {
        core.notice(`Release already published: ${release.html_url}`);
        return;
      }
      throw new Error('An existing published release is incomplete; refusing to replace public files');
    }
  } else {
    release = (await github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: config.tag,
      target_commitish: context.sha,
      name: `Outline ${config.version} — Windows autostart fix`,
      body,
      draft: true,
      prerelease: true,
    })).data;
  }

  for (const filename of files) {
    const previous = release.assets.find(asset => asset.name === filename);
    if (previous) await github.rest.repos.deleteReleaseAsset({owner, repo, asset_id: previous.id});
    const data = await fs.readFile(path.join('release-assets', filename));
    await github.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.id,
      name: filename,
      data,
      headers: {'content-type': 'application/octet-stream', 'content-length': data.length},
    });
  }
  release = (await github.rest.repos.updateRelease({
    owner, repo, release_id: release.id, body, draft: false, prerelease: true,
  })).data;
  await core.summary.addHeading('Download the installer').addLink(release.name, release.html_url).write();
  core.notice(`Published ${release.html_url}`);
};
