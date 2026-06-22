const fs = require('fs');
const path = require('path');

const contentDir = './content';
const indexPath = './index.html';

const wrapHTML = (title, body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Design Education x AI Day</title>
    <link rel="stylesheet" href="../style.css" />
  </head>
  <body>
    ${body}
  </body>
</html>`;

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.html'));

files.forEach((f) => {
	const filePath = path.join(contentDir, f);
	let html = fs.readFileSync(filePath, 'utf8');

	// Only wrap if it's a bare fragment (no <html> tag)
	if (!html.includes('<html')) {
		const title = f
			.replace('.html', '')
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());
		html = wrapHTML(title, html);
		fs.writeFileSync(filePath, html);
		console.log(`Wrapped and injected stylesheet into ${f}`);
	} else if (!html.includes('../style.css')) {
		html = html.replace(
			'</head>',
			`  <link rel="stylesheet" href="../style.css" />\n</head>`,
		);
		fs.writeFileSync(filePath, html);
		console.log(`Injected stylesheet into ${f}`);
	} else {
		console.log(`Skipped ${f} — already complete`);
	}
});

// Update index.html list
const listItems = files
	.map((f) => {
		const label = f
			.replace('.html', '')
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());
		return `\t\t\t<li><a href="./content/${f}">${label}</a></li>`;
	})
	.join('\n');

let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(
	/<ul id="content-list">[\s\S]*?<\/ul>/,
	`<ul id="content-list">\n${listItems}\n\t\t</ul>`,
);
fs.writeFileSync(indexPath, indexHtml);
console.log(`\nUpdated index.html with ${files.length} files.`);
