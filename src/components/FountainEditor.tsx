import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

type ElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

interface FountainEditorProps {
  value: string;
  onChange: (value: string) => void;
  scriptTitle?: string;
  authorName?: string;
  writtenBy?: string;
  placeholder?: string;
}

const SCENE_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E.', 'E/I.'];
const TRANSITION_SUFFIXES = ['TO:', 'IN:', 'OUT:'];
const ELEMENT_CYCLE: ElementType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];

// Standard screenplay page dimensions
const PAGE_HEIGHT_PX = 1056; // 11 inches at 96 DPI
const PAGE_MARGIN_TOP_PX = 96; // 1 inch
const PAGE_MARGIN_BOTTOM_PX = 96; // 1 inch
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX;

// Line height for 12pt Courier
const LINE_HEIGHT_PX = 16;
const LINES_PER_PAGE = Math.floor(CONTENT_HEIGHT_PX / LINE_HEIGHT_PX);

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

function getElementLabel(type: ElementType): string {
  switch (type) {
    case 'scene': return 'Scene Heading';
    case 'action': return 'Action';
    case 'character': return 'Character';
    case 'dialogue': return 'Dialogue';
    case 'parenthetical': return 'Parenthetical';
    case 'transition': return 'Transition';
    default: return 'Action';
  }
}

function getElementMargins(type: ElementType): { left: number; right: number } {
  switch (type) {
    case 'scene':
      return { left: 0, right: 0 };
    case 'action':
      return { left: 0, right: 0 };
    case 'character':
      return { left: 180, right: 0 };
    case 'dialogue':
      return { left: 100, right: 100 };
    case 'parenthetical':
      return { left: 140, right: 140 };
    case 'transition':
      return { left: 0, right: 0 };
    default:
      return { left: 0, right: 0 };
  }
}

function getNextElementType(currentType: ElementType): ElementType {
  switch (currentType) {
    case 'scene':
      return 'action';
    case 'action':
      return 'action';
    case 'character':
      return 'dialogue';
    case 'dialogue':
      return 'action';
    case 'parenthetical':
      return 'dialogue';
    case 'transition':
      return 'scene';
    default:
      return 'action';
  }
}

interface ParsedLine {
  text: string;
  type: ElementType;
  index: number;
}

interface PageLine {
  text: string;
  type: ElementType;
  lineIndex: number;
}

interface Page {
  lines: PageLine[];
  pageNumber: number;
  isTitlePage: boolean;
}

// Wrap text into lines based on element type margins
function wrapText(text: string, type: ElementType): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [''];
  
  const margins = getElementMargins(type);
  const availableWidth = 576 - margins.left - margins.right; // 6 inches content width
  const charWidth = 7.2;
  const maxChars = Math.floor(availableWidth / charWidth);
  
  const words = trimmed.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxChars || !currentLine) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
}

// Title page component
function TitlePage({ 
  title, 
  writtenBy, 
  authorName 
}: { 
  title: string; 
  writtenBy?: string; 
  authorName?: string;
}) {
  return (
    <div className="script-page title-page">
      <div className="title-page-content">
        <div className="title-section">
          <h1 className="script-title">{title || 'UNTITLED'}</h1>
        </div>
        <div className="credit-section">
          {writtenBy && <p className="written-by">{writtenBy}</p>}
          {authorName && <p className="author-name">{authorName}</p>}
        </div>
      </div>
    </div>
  );
}

export default function FountainEditor({ 
  value, 
  onChange, 
  scriptTitle = '',
  authorName = '',
  writtenBy = 'Written by',
}: FountainEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentElement, setCurrentElement] = useState<ElementType>('action');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [forcedElement, setForcedElement] = useState<ElementType | null>(null);
  const [cursorPage, setCursorPage] = useState(2);
  const [isFocused, setIsFocused] = useState(false);

  // Parse all lines with their types
  const parsedLines = useMemo((): ParsedLine[] => {
    const lines = value.split('\n');
    const result: ParsedLine[] = [];
    let prevType: ElementType | undefined;

    for (let i = 0; i < lines.length; i++) {
      const type = detectElementType(lines[i], prevType);
      result.push({ text: lines[i], type, index: i });
      prevType = type;
    }

    return result;
  }, [value]);

  // Calculate pages based on line count
  const pages = useMemo((): Page[] => {
    const result: Page[] = [];
    
    // Script content pages
    let currentPageLines: PageLine[] = [];
    let currentLineCount = 0;
    let pageNumber = 2;

    for (let i = 0; i < parsedLines.length; i++) {
      const line = parsedLines[i];
      const wrappedLines = wrapText(line.text, line.type);
      const lineHeight = wrappedLines.length;
      
      // Check if we need a new page
      if (currentLineCount + lineHeight > LINES_PER_PAGE && currentPageLines.length > 0) {
        result.push({
          lines: currentPageLines,
          pageNumber: pageNumber,
          isTitlePage: false,
        });
        currentPageLines = [];
        currentLineCount = 0;
        pageNumber++;
      }

      // Add the wrapped lines
      for (let j = 0; j < wrappedLines.length; j++) {
        currentPageLines.push({
          text: wrappedLines[j],
          type: line.type,
          lineIndex: line.index,
        });
      }
      currentLineCount += lineHeight;
    }

    // Add the last page if it has content
    if (currentPageLines.length > 0) {
      result.push({
        lines: currentPageLines,
        pageNumber: pageNumber,
        isTitlePage: false,
      });
    }

    return result;
  }, [parsedLines]);

  // Update current element based on cursor position
  const updateCurrentLine = useCallback((shouldUpdatePage = true) => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lineIndex = textBeforeCursor.split('\n').length - 1;

    setCurrentLineIndex(lineIndex);

    if (forcedElement) {
      setCurrentElement(forcedElement);
    } else if (parsedLines[lineIndex]) {
      setCurrentElement(parsedLines[lineIndex].type);
    }

    // Calculate which page the cursor is on
    if (shouldUpdatePage) {
      let linesCounted = 0;
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageLines = page.lines.filter((l, idx, arr) => 
          idx === 0 || l.lineIndex !== arr[idx - 1].lineIndex
        ).length;
        
        if (lineIndex < linesCounted + pageLines) {
          setCursorPage(page.pageNumber);
          break;
        }
        linesCounted += pageLines;
      }
    }
  }, [value, parsedLines, forcedElement, pages]);

  // Only update current line on value change, NOT page scroll
  useEffect(() => {
    updateCurrentLine(false);
  }, [value, updateCurrentLine]);

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(selectionEnd);
    const lines = textBeforeCursor.split('\n');
    const lineIndex = lines.length - 1;
    const currentLine = lines[lineIndex] || '';
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;

    if (e.key === 'Tab') {
      e.preventDefault();

      const activeType = forcedElement || (parsedLines[lineIndex]?.type || 'action');
      const currentIndex = ELEMENT_CYCLE.indexOf(activeType);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length
        : (currentIndex + 1) % ELEMENT_CYCLE.length;
      const nextType = ELEMENT_CYCLE[nextIndex];

      setForcedElement(nextType);
      setCurrentElement(nextType);

      const margins = getElementMargins(nextType);
      const needsUppercase = nextType === 'character' || nextType === 'scene' || nextType === 'transition';

      let newLineContent = currentLine.trimStart();
      if (needsUppercase) {
        newLineContent = newLineContent.toUpperCase();
      }

      // Calculate spaces for indentation (10px per space)
      const paddingChars = Math.floor(margins.left / 10);
      const padding = ' '.repeat(paddingChars);
      const paddedContent = padding + newLineContent.trimStart();

      const beforeLine = value.substring(0, currentLineStart);
      const afterLine = textAfterCursor;
      const newValue = beforeLine + paddedContent + afterLine;

      onChange(newValue);

      // Restore cursor position without jumping
      requestAnimationFrame(() => {
        if (textarea) {
          const newPos = currentLineStart + paddedContent.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
        }
      });

      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const activeType = forcedElement || (parsedLines[lineIndex]?.type || 'action');
      const nextType = getNextElementType(activeType);

      setForcedElement(nextType);
      setCurrentElement(nextType);

      const margins = getElementMargins(nextType);
      const paddingChars = Math.floor(margins.left / 10);
      const padding = ' '.repeat(paddingChars);

      const newValue = value.substring(0, cursorPos) + '\n' + padding + textAfterCursor;
      onChange(newValue);

      // Restore cursor position without jumping
      requestAnimationFrame(() => {
        if (textarea) {
          const newPos = cursorPos + 1 + padding.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
        }
      });

      return;
    }

    // Don't clear forced element on normal typing - only Tab and Enter should change formatting
    // This prevents auto-detection from changing formatting while typing
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Don't clear forced element on change - let Tab/Enter control formatting
  };

  const handleClick = () => {
    updateCurrentLine();
  };

  const handleSelect = () => {
    updateCurrentLine();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleLineClick = (lineIndex: number) => {
    // Calculate cursor position for the clicked line
    const lines = value.split('\n');
    let charPos = 0;
    for (let i = 0; i < lineIndex && i < lines.length; i++) {
      charPos += lines[i].length + 1; // +1 for newline
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = charPos;
      textareaRef.current.selectionEnd = charPos;
      setCurrentLineIndex(lineIndex);
      setIsFocused(true);
    }
  };

  // Scroll to cursor page only when explicitly navigating (Tab/Enter), not on typing
  // This prevents the snap-to-title-page bug
  const scrollToPage = useCallback((pageNum: number) => {
    if (editorRef.current) {
      const pageElement = editorRef.current.querySelector(`[data-page-number="${pageNum}"]`);
      if (pageElement) {
        const container = editorRef.current;
        const pageRect = pageElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Only scroll if page is not fully visible
        if (pageRect.bottom > containerRect.bottom || pageRect.top < containerRect.top) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, []);

  // Only scroll on explicit navigation, not cursor page changes from typing
  useEffect(() => {
    // This effect is now only triggered by explicit user actions (Tab/Enter)
    // The cursorPage state update from typing won't trigger scroll
  }, [cursorPage, scrollToPage]);

  // Get display title
  const displayTitle = scriptTitle || 'UNTITLED';

  // Render a script line
  const renderLine = (line: PageLine, pageNumber: number) => {
    const margins = getElementMargins(line.type);
    const isUppercase = line.type === 'scene' || line.type === 'character' || line.type === 'transition';
    const isRightAligned = line.type === 'transition';
    const isItalic = line.type === 'parenthetical';
    const isBold = line.type === 'scene';
    const hasCursor = line.lineIndex === currentLineIndex && isFocused;

    return (
      <div
        key={`${pageNumber}-${line.lineIndex}`}
        className={`script-line ${line.type} ${isUppercase ? 'uppercase' : ''} ${isRightAligned ? 'text-right' : ''} ${isItalic ? 'italic' : ''} ${isBold ? 'font-bold' : ''} ${hasCursor ? 'cursor-line' : ''}`}
        style={{
          paddingLeft: margins.left,
          paddingRight: margins.right,
        }}
        data-line-index={line.lineIndex}
        onClick={() => handleLineClick(line.lineIndex)}
      >
        <span className="line-text">{line.text || '\u00A0'}</span>
        {hasCursor && <span className="cursor-indicator">|</span>}
      </div>
    );
  };

  return (
    <div className="fountain-editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-content">
          <span className="toolbar-label">Current:</span>
          <div className="element-buttons">
            {ELEMENT_CYCLE.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setForcedElement(type);
                  setCurrentElement(type);
                  textareaRef.current?.focus();
                }}
                className={`element-button ${currentElement === type ? 'active' : ''}`}
              >
                {getElementLabel(type)}
              </button>
            ))}
          </div>
          <span className="toolbar-hint">
            Tab to cycle | Enter for next
          </span>
        </div>
      </div>

      {/* Editor Area with synchronized textarea overlay */}
      <div className="editor-workspace" ref={editorRef}>
        {/* Hidden textarea for input handling - positioned over the content */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onSelect={handleSelect}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="editor-textarea"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        {/* Visible paginated pages - rendered behind textarea */}
        <div className="pages-container">
          {/* Title Page */}
          <TitlePage 
            title={displayTitle} 
            writtenBy={writtenBy} 
            authorName={authorName}
          />

          {/* Script Pages */}
          {pages.map((page) => (
            <div 
              key={page.pageNumber} 
              className={`script-page ${page.pageNumber === cursorPage && isFocused ? 'active-page' : ''}`}
              data-page-number={page.pageNumber}
            >
              <div className="page-number">{page.pageNumber - 1}</div>
              <div className="page-content">
                {page.lines.map((line) => renderLine(line, page.pageNumber))}
              </div>
            </div>
          ))}

          {/* Empty state for new scripts */}
          {pages.length === 0 && (
            <div className="script-page empty-script-page">
              <div className="page-number">1</div>
              <div className="page-content">
                <div className="script-line action">FADE IN:</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
