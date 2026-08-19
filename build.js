const fs = require('fs');
const path = require('path');

const contentDir = './content';
const templatesDir = './templates';
const indexPath = './index.html';

const HEADER_TEMPLATE = fs.readFileSync(path.join(templatesDir, 'header.html'), 'utf8');
const FOOTER_TEMPLATE = fs.readFileSync(path.join(templatesDir, 'footer.html'), 'utf8');
const HOME_TEMPLATE = fs.readFileSync(path.join(templatesDir, 'home.html'), 'utf8');

// `prefix` accounts for pages at different depths: '' for index.html, '../' for content/*.html
const render = (template, prefix) => template.replace(/\{\{prefix\}\}/g, prefix);

const wrapHTML = (title, body, prefix) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Design Education x AI Day</title>
    <link rel="stylesheet" href="${prefix}style.css" />
  </head>
  <body>
    <!-- HEADER:START -->
    ${render(HEADER_TEMPLATE, prefix)}
    <!-- HEADER:END -->
    ${body}
    <!-- FOOTER:START -->
    ${render(FOOTER_TEMPLATE, prefix)}
    <!-- FOOTER:END -->
  </body>
</html>`;

// replaces the content between marker comments if present, else returns null
const replaceMarkerBlock = (html, name, content) => {
	const start = `<!-- ${name}:START -->`;
	const end = `<!-- ${name}:END -->`;
	const re = new RegExp(`${start}[\\s\\S]*?${end}`);
	return re.test(html) ? html.replace(re, `${start}\n${content}\n${end}`) : null;
};

// ---- content/*.html ----
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.html'));
const prefix = '../';

files.forEach((f) => {
	const filePath = path.join(contentDir, f);
	let html = fs.readFileSync(filePath, 'utf8');

	// Bare fragment (fresh Notion export) — wrap fully, header/footer included
	if (!html.includes('<html')) {
		const title = f
			.replace('.html', '')
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());
		html = wrapHTML(title, html, prefix);
		fs.writeFileSync(filePath, html);
		console.log(`Wrapped ${f}`);
		return;
	}

	// Already-wrapped file — patch stylesheet/header/footer independently so
	// re-running the build backfills pages that were wrapped before this existed,
	// and keeps header/footer in sync whenever the templates change
	const original = html;

	if (!html.includes(`${prefix}style.css`)) {
		html = html.replace('</head>', `  <link rel="stylesheet" href="${prefix}style.css" />\n</head>`);
	}

	const withHeader = replaceMarkerBlock(html, 'HEADER', render(HEADER_TEMPLATE, prefix));
	html = withHeader ?? html.replace('<body>', `<body>\n<!-- HEADER:START -->\n${render(HEADER_TEMPLATE, prefix)}\n<!-- HEADER:END -->`);

	const withFooter = replaceMarkerBlock(html, 'FOOTER', render(FOOTER_TEMPLATE, prefix));
	html = withFooter ?? html.replace('</body>', `<!-- FOOTER:START -->\n${render(FOOTER_TEMPLATE, prefix)}\n<!-- FOOTER:END -->\n</body>`);

	if (html !== original) {
		fs.writeFileSync(filePath, html);
		console.log(`Synced header/footer in ${f}`);
	} else {
		console.log(`Skipped ${f} — already complete`);
	}
});

// ---- index.html: fully regenerated from templates every run ----
const indexHtml = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Design Education x AI Day</title>
		<link rel="stylesheet" href="style.css" />
	</head>
	<body>
		${render(HEADER_TEMPLATE, '')}

		${HOME_TEMPLATE}

		${render(FOOTER_TEMPLATE, '')}
	</body>
</html>
`;

fs.writeFileSync(indexPath, indexHtml);
console.log('\nRegenerated index.html from templates.');
