import { jsPDF } from 'jspdf';
import { Script, ScriptDraft } from './supabase';

export type ExportFormat = 'pdf' | 'fountain' | 'fdx' | 'txt';

export interface ExportOptions {
  script: Script;
  drafts: ScriptDraft[];
  includePageNumbers?: boolean;
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

// PDF constants for US Letter
const PAGE_WIDTH = 8.5 * 72; // 612 points
const PAGE_HEIGHT = 11 * 72; // 792 points
const MARGIN_LEFT = 1.5 * 72; // 108 points
const MARGIN_RIGHT = 1 * 72; // 72 points
const MARGIN_TOP = 1 * 72; // 72 points
const MARGIN_BOTTOM = 1 * 72; // 72 points
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 432 points
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 648 points
const LINE_HEIGHT = 12; // 12pt single spaced
const LINES_PER_PAGE = Math.floor(CONTENT_HEIGHT / LINE_HEIGHT); // 54 lines
const CHAR_WIDTH = 7.2; // Approximate width of Courier 12pt character in points
const CHARS_PER_LINE = Math.floor(CONTENT_WIDTH / CHAR_WIDTH); // 60 chars

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

interface PdfLine {
  text: string;
  type: ElementType;
  x: number;
  y: number;
}

function buildPdfLines(lines: string[]): PdfLine[] {
  const pdfLines: PdfLine[] = [];
  let prevType: ElementType | undefined;
  let currentY = MARGIN_TOP;
  let pageLineCount = 0;

  for (const line of lines) {
    const type = detectElementType(line, prevType);
    const trimmed = line.trim();
    prevType = type;

    if (!trimmed) {
      currentY += LINE_HEIGHT;
      pageLineCount++;
      continue;
    }

    let x = MARGIN_LEFT;
    let maxChars = CHARS_PER_LINE;
    let text = trimmed;

    switch (type) {
      case 'scene':
        text = text.toUpperCase();
        break;
      case 'character':
        text = text.toUpperCase();
        x = MARGIN_LEFT + 2.5 * 72; // 2.5 inches from left
        maxChars = Math.floor((CONTENT_WIDTH - 2.5 * 72) / CHAR_WIDTH);
        break;
      case 'dialogue':
        x = MARGIN_LEFT + 1 * 72; // 1 inch from left
        maxChars = Math.floor((CONTENT_WIDTH - 1 * 72 - 1.5 * 72) / CHAR_WIDTH);
        break;
      case 'parenthetical':
        x = MARGIN_LEFT + 1.5 * 72; // 1.5 inches from left
        maxChars = Math.floor((CONTENT_WIDTH - 1.5 * 72 - 2 * 72) / CHAR_WIDTH);
        break;
      case 'transition':
        text = text.toUpperCase();
        x = MARGIN_LEFT + 3 * 72; // Right-aligned, 3 inches from left
        maxChars = Math.floor((CONTENT_WIDTH - 3 * 72) / CHAR_WIDTH);
        break;
    }

    const wrappedLines = wrapText(text, maxChars);
    for (const wrappedLine of wrappedLines) {
      pdfLines.push({ text: wrappedLine, type, x, y: currentY });
      currentY += LINE_HEIGHT;
      pageLineCount++;
    }

    // Add spacing after certain elements
    if (type === 'scene' || type === 'transition') {
      currentY += LINE_HEIGHT;
      pageLineCount++;
    }
  }

  return pdfLines;
}

export function exportPdf({ script, drafts, includePageNumbers = false }: ExportOptions) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter',
    orientation: 'portrait',
  });

  // Set font to Courier
  doc.setFont('Courier', 'normal');
  doc.setFontSize(12);

  // Title Page
  const titleY = PAGE_HEIGHT / 2 - 50;
  doc.setFontSize(24);
  doc.text(script.title.toUpperCase(), PAGE_WIDTH / 2, titleY, { align: 'center' });
  
  doc.setFontSize(12);
  if (script.written_by) {
    doc.text(script.written_by, PAGE_WIDTH / 2, titleY + 36, { align: 'center' });
  }
  if (script.author_name) {
    doc.text(script.author_name, PAGE_WIDTH / 2, titleY + 60, { align: 'center' });
  }
  if (script.contact_info) {
    doc.text(script.contact_info, MARGIN_LEFT, PAGE_HEIGHT - MARGIN_BOTTOM - 24);
  }
  if (script.draft_date) {
    doc.text(`Draft Date: ${script.draft_date}`, MARGIN_LEFT, PAGE_HEIGHT - MARGIN_BOTTOM - 12);
  }

  // Script Content
  const draftContent = getActiveDraftContent(drafts);
  const lines = draftContent.split('\n');
  const pdfLines = buildPdfLines(lines);

  let currentPage = 1;
  let lineCount = 0;

  for (const pdfLine of pdfLines) {
    // Check if we need a new page
    if (lineCount >= LINES_PER_PAGE) {
      doc.addPage();
      currentPage++;
      lineCount = 0;
    }

    // Add page number (starting from page 2, top right)
    if (includePageNumbers && currentPage >= 2 && lineCount === 0) {
      doc.text(String(currentPage), PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP - 12, { align: 'right' });
    }

    // Draw the line
    doc.text(pdfLine.text, pdfLine.x, pdfLine.y);
    lineCount++;
  }

  // Save the PDF
  doc.save(`${script.title}.pdf`);
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
