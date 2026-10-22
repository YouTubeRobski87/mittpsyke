// Synthetic inputs shared by SSR and real-browser checks. No diary data.
export const hostileDiaryMarkdown = [
	'<script>window.__diaryXss = true</script>',
	'<p onclick="window.__diaryXss = true">Hej</p><img src=x onerror="window.__diaryXss = true">',
	'[länk](javascript:window.__diaryXss=true) [data](data:text/html,script) [vb](vbscript:msgbox(1))',
	'<a href="jav&#x61;script:alert(1)">länk</a><a href="java\tscript:alert(1)">tabb</a>',
	'<iframe srcdoc="<script>parent.__diaryXss=true</script>"></iframe>',
	'<svg><a xlink:href="javascript:alert(1)"><text>länk</text></a><g onload="window.__diaryXss=true"></g></svg>',
	'<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=window.__diaryXss=true>">',
	'<svg><style><img src=x onerror="window.__diaryXss=true"></style></svg>',
	'<div><p><strong>Hej</div><img src=x onerror="window.__diaryXss=true"></strong>',
	'&lt;img src=x onerror=window.__diaryXss=true&gt; &#60;script&#62;alert(1)&#60;/script&#62;',
	'\\<script>window.__diaryXss=true</script> `</code><img src=x onerror=window.__diaryXss=true>`',
	'<form id="__diaryClobber"><input name="attributes"><input name="__diaryClobber"></form><p id="__diaryClobber" name="__diaryClobber">Hej</p>',
	'<style></style><img src=x onerror="window.__diaryXss=true"></style>',
	'<!--><img src=x onerror="window.__diaryXss=true">--><object data="javascript:alert(1)"></object>'
];

export const ordinaryDiaryMarkdown = 'Återhämtning äöå 🌿\nEn ny rad\n\n**Vila** och *lugn*\n\n- Promenad\n- Sömn';
