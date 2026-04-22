import { Script, ScriptDraft } from './supabase';

export type ExportFormat = 'pdf' | 'fountain' | 'fdx' | 'txt';

interface ExportOptions {
  script: Script;
  drafts: ScriptDraft[];
}

const SCENE_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E.', 'E/I.'];
const TRANSITION_SUFFIXES = ['TO:', 'IN:', 'OUT:'];

type ElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

function detectElementType(line: string, prevType?: ElementType): ElementType {
  const trimmed = line.trim();
  const upper = trimmed.toUpperCase();

  if (SCENE_PREFIXES.some(prefix => upper.startsWith(prefix))) {
    return 'scene';
  }

  if (TRANSITION_SUFFIXES.some(suffix => upper.endsWith(suffix)) && upper === trimmed) {
    return 'transition';
  }

  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return 'parenthetical';
  }

  if (prevType === 'character' || prevType === 'parenthetical') {
    if (trimmed.startsWith('(')) {
      return 'parenthetical';
    }
    if (upper !== trimmed || trimmed.length > 30) {
      return 'dialogue';
    }
  }

  if (upper === trimmed && trimmed.length > 0 && /^[A-Z]/.test(trimmed)) {
    const hasNumbers = /\d/.test(trimmed);
    const isShort = trimmed.length < 40;
    if (isShort && !hasNumbers) {
      return 'character';
    }
  }

  return 'action';
}

function buildTitlePage(script: Script): string {
  const lines: string[] = [];
  for (let i = 0; i < 8; i++) lines.push('');
  lines.push(`                    ${script.title.toUpperCase()}`);
  lines.push('');
  lines.push('');
  if (script.written_by) {
    lines.push(`                    ${script.written_by}`);
  }
  lines.push('');
  if (script.author_name) {
    lines.push(`                    ${script.author_name}`);
  }
  for (let i = 0; i < 6; i++) lines.push('');
  if (script.contact_info) {
    lines.push(script.contact_info);
  }
  if (script.draft_date) {
    lines.push(`Draft Date: ${script.draft_date}`);
  }
  return lines.join('\n');
}

function getActiveDraftContent(drafts: ScriptDraft[]): string {
  if (drafts.length > 0) {
    return drafts[0].content || '';
  }
  return '';
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportFountain({ script, drafts }: ExportOptions) {
  const titlePage = buildTitlePage(script);
  const draftContent = getActiveDraftContent(drafts);
  const fullContent = titlePage + '\n\n\n===\n\n\n' + draftContent;
  downloadFile(fullContent, `${script.title}.fountain`, 'text/plain');
}

export function exportTxt({ script, drafts }: ExportOptions) {
  const draftContent = getActiveDraftContent(drafts);
  const lines = draftContent.split('\n');
  const formattedLines: string[] = [];

  formattedLines.push('');
  formattedLines.push(`                    ${script.title.toUpperCase()}`);
  formattedLines.push('');
  if (script.written_by) {
    formattedLines.push(`                    ${script.written_by}`);
  }
  if (script.author_name) {
    formattedLines.push(`                    by ${script.author_name}`);
  }
  formattedLines.push('');
  formattedLines.push('');
  formattedLines.push('='.repeat(60));
  formattedLines.push('');
  formattedLines.push('');

  let prevType: ElementType | undefined;
  for (const line of lines) {
    const type = detectElementType(line, prevType);
    const trimmed = line.trim();

    switch (type) {
      case 'scene':
        formattedLines.push('');
        formattedLines.push(trimmed.toUpperCase());
        formattedLines.push('');
        break;
      case 'action':
        formattedLines.push(trimmed);
        break;
      case 'character':
        formattedLines.push('');
        formattedLines.push('                         ' + trimmed.toUpperCase());
        break;
      case 'dialogue':
        formattedLines.push('              ' + trimmed);
        break;
      case 'parenthetical':
        formattedLines.push('                    ' + trimmed);
        break;
      case 'transition':
        formattedLines.push('');
        formattedLines.push('                                        ' + trimmed.toUpperCase());
        formattedLines.push('');
        break;
    }
    prevType = type;
  }

  downloadFile(formattedLines.join('\n'), `${script.title}.txt`, 'text/plain');
}

export function exportFdx({ script, drafts }: ExportOptions) {
  const draftContent = getActiveDraftContent(drafts);
  const lines = draftContent.split('\n');

  const paragraphs: string[] = [];
  let prevType: ElementType | undefined;

  for (const line of lines) {
    const type = detectElementType(line, prevType);
    const trimmed = line.trim();

    if (!trimmed) {
      prevType = type;
      continue;
    }

    let fdxType = 'Action';
    switch (type) {
      case 'scene':
        fdxType = 'Scene Heading';
        break;
      case 'action':
        fdxType = 'Action';
        break;
      case 'character':
        fdxType = 'Character';
        break;
      case 'dialogue':
        fdxType = 'Dialogue';
        break;
      case 'parenthetical':
        fdxType = 'Parenthetical';
        break;
      case 'transition':
        fdxType = 'Transition';
        break;
    }

    paragraphs.push(`    <Paragraph Type="${fdxType}">
      <Text>${escapeXml(trimmed)}</Text>
    </Paragraph>`);

    prevType = type;
  }

  const fdxContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="3">
  <Content>
    <TitlePage>
      <Content>
        <Paragraph Alignment="Center" Type="Text">
          <Text>${escapeXml(script.title.toUpperCase())}</Text>
        </Paragraph>
        <Paragraph Alignment="Center" Type="Text">
          <Text></Text>
        </Paragraph>
        <Paragraph Alignment="Center" Type="Text">
          <Text>${escapeXml(script.written_by || '')}</Text>
        </Paragraph>
        <Paragraph Alignment="Center" Type="Text">
          <Text>${escapeXml(script.author_name || '')}</Text>
        </Paragraph>
        <Paragraph Alignment="Left" Type="Text">
          <Text>${escapeXml(script.contact_info || '')}</Text>
        </Paragraph>
      </Content>
    </TitlePage>
${paragraphs.join('\n')}
  </Content>
</FinalDraft>`;

  downloadFile(fdxContent, `${script.title}.fdx`, 'application/xml');
}

export function exportPdf({ script, drafts }: ExportOptions) {
  const draftContent = getActiveDraftContent(drafts);
  const lines = draftContent.split('\n');

  let prevType: ElementType | undefined;
  const parsedLines: { text: string; type: ElementType }[] = [];

  for (const line of lines) {
    const type = detectElementType(line, prevType);
    parsedLines.push({ text: line.trim(), type });
    prevType = type;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for this site to export PDF');
    return;
  }

  const htmlLines = parsedLines.map(({ text, type }) => {
    if (!text) return '<p class="empty">&nbsp;</p>';

    let className = type;
    let displayText = text;

    if (type === 'scene' || type === 'character' || type === 'transition') {
      displayText = text.toUpperCase();
    }

    return `<p class="${className}">${escapeHtml(displayText)}</p>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(script.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');

    @page {
      size: letter;
      margin: 1in;
    }

    body {
      font-family: 'Courier Prime', 'Courier New', monospace;
      font-size: 12pt;
      line-height: 1;
      margin: 0;
      padding: 0;
    }

    .title-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .title-page h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 24pt;
      text-transform: uppercase;
    }

    .title-page .written-by {
      margin-bottom: 6pt;
    }

    .title-page .author {
      margin-bottom: 48pt;
    }

    .title-page .contact {
      position: absolute;
      bottom: 1in;
      left: 1in;
      text-align: left;
      font-size: 12pt;
    }

    .script-content {
      padding: 0;
    }

    p {
      margin: 0;
      padding: 0;
    }

    p.empty {
      height: 12pt;
    }

    p.scene {
      margin-top: 24pt;
      margin-bottom: 12pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    p.action {
      margin-bottom: 12pt;
    }

    p.character {
      margin-left: 2.5in;
      margin-top: 12pt;
      text-transform: uppercase;
    }

    p.dialogue {
      margin-left: 1in;
      margin-right: 1.5in;
      margin-bottom: 12pt;
    }

    p.parenthetical {
      margin-left: 1.5in;
      margin-right: 2in;
      font-style: italic;
    }

    p.transition {
      text-align: right;
      margin-top: 12pt;
      margin-bottom: 12pt;
      text-transform: uppercase;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHtml(script.title)}</h1>
    ${script.written_by ? `<p class="written-by">${escapeHtml(script.written_by)}</p>` : ''}
    ${script.author_name ? `<p class="author">${escapeHtml(script.author_name)}</p>` : ''}
    <div class="contact">
      ${script.contact_info ? `<p>${escapeHtml(script.contact_info).replace(/\n/g, '<br>')}</p>` : ''}
      ${script.draft_date ? `<p>Draft Date: ${escapeHtml(script.draft_date)}</p>` : ''}
    </div>
  </div>
  <div class="script-content">
    ${htmlLines}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportScript(format: ExportFormat, options: ExportOptions) {
  switch (format) {
    case 'pdf':
      exportPdf(options);
      break;
    case 'fountain':
      exportFountain(options);
      break;
    case 'fdx':
      exportFdx(options);
      break;
    case 'txt':
      exportTxt(options);
      break;
  }
}
