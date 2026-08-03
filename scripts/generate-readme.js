// Regenerates the "Featured Builds" block in README.md using live GitHub repo data.
// Requires Node 20+ (built-in fetch). Run from the repo root: node scripts/generate-readme.js

const fs = require('fs');

const USERNAME = 'buildbyanish';
const EXCLUDE = ['buildbyanish', 'buildbyanish.github.io']; // profile / site repos, not projects
const MAX_REPOS = 6; // how many cards to show, must be even for a clean 2-column grid

async function main() {
  const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  const repos = await res.json();

  const featured = repos
    .filter((r) => !r.fork && !r.archived && !EXCLUDE.includes(r.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, MAX_REPOS);

  if (featured.length === 0) {
    console.error('No repos found to feature — leaving README untouched.');
    return;
  }

  const card = (r) => {
    const desc = (r.description || 'No description yet.').trim();
    const lang = r.language ? `\`${r.language}\`` : '';
    return `<td width="50%" valign="top">

### [${r.name}](${r.html_url})
${desc}

${lang}

</td>`;
  };

  let rows = '';
  for (let i = 0; i < featured.length; i += 2) {
    const left = card(featured[i]);
    const right = featured[i + 1] ? card(featured[i + 1]) : '<td width="50%"></td>';
    rows += `<tr>\n${left}\n${right}\n</tr>\n`;
  }

  const block = `<table>\n${rows}</table>`;

  const readmePath = 'README.md';
  const readme = fs.readFileSync(readmePath, 'utf8');
  const markerPattern = /<!--REPOS:START-->[\s\S]*?<!--REPOS:END-->/;

  if (!markerPattern.test(readme)) {
    console.error(
      'Could not find <!--REPOS:START--> / <!--REPOS:END--> markers in README.md.\n' +
      'Add them around your Featured Builds table first — see the setup instructions.'
    );
    process.exit(1);
  }

  const updated = readme.replace(
    markerPattern,
    `<!--REPOS:START-->\n${block}\n<!--REPOS:END-->`
  );

  fs.writeFileSync(readmePath, updated);
  console.log(`Updated README.md with ${featured.length} featured repos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
