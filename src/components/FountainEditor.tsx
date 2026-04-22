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

// Line height for 12pt Courier
const LINE_HEIGHT_PX = 16;
const LINES_PER_PAGE = 55;

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
    case 'scene': return { left: 0, right: 0 };
    case 'action': return { left: 0, right: 0 };
    case 'character': return { left: 180, right: 0 };
    case 'dialogue': return { left: 100, right: 100 };
    case 'parenthetical': return { left: 140, right: 140 };
    case 'transition': return { left: 0, right: 0 };
    default: return { left: 0, right: 0 };
  }
}

function getNextElementType(currentType: ElementType): ElementType {
  switch (currentType) {
    case 'scene': return 'action';
    case 'action': return 'action';
    case 'character': return 'dialogue';
    case 'dialogue': return 'action';
    case 'parenthetical': return 'dialogue';
    case 'transition': return 'scene';
    default: return 'action';
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

function wrapText(text: string, type: ElementType): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [''];
  
  const margins = getElementMargins(type);
  const availableWidth = 576 - margins.left - margins.right;
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

function calculateDialogueBlockLines(parsedLines: ParsedLine[], startIndex: number): { lines: number; endIndex: number } {
  let totalLines = 0;
  let i = startIndex;
  
  if (i < parsedLines.length && parsedLines[i].type === 'character') {
    const wrapped = wrapText(parsedLines[i].text, 'character');
    totalLines += wrapped.length;
    i++;
    
    while (i < parsedLines.length) {
      const type = parsedLines[i].type;
      if (type === 'parenthetical' || type === 'dialogue') {
        const wrapped = wrapText(parsedLines[i].text, type);
        totalLines += wrapped.length;
        i++;
      } else {
        break;
      }
    }
  }
  
  return { lines: totalLines, endIndex: i - 1 };
}

// Title page component
function TitlePage({ title, writtenBy, authorName }: { title: string; writtenBy?: string; authorName?: string }) {
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
  const [isFocused, setIsFocused] = useState(false);
  
  // Track scroll position to restore after render
  const scrollPosRef = useRef(0);

  // Parse all lines with their types - memoized to avoid recalculation
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

  // Calculate pages based on line count with proper page break logic
  const pages = useMemo((): Page[] => {
    const result: Page[] = [];
    let currentPageLines: PageLine[] = [];
    let currentLineCount = 0;
    let pageNumber = 2;
    let i = 0;

    while (i < parsedLines.length) {
      const line = parsedLines[i];
      const wrappedLines = wrapText(line.text, line.type);
      const lineHeight = wrappedLines.length;
      
      // DIALOGUE BLOCK KEEPING
      if (line.type === 'character') {
        const blockInfo = calculateDialogueBlockLines(parsedLines, i);
        
        if (currentLineCount > 0 && currentLineCount + blockInfo.lines > LINES_PER_PAGE) {
          result.push({
            lines: currentPageLines,
            pageNumber: pageNumber,
            isTitlePage: false,
          });
          currentPageLines = [];
          currentLineCount = 0;
          pageNumber++;
        }
        
        for (let j = i; j <= blockInfo.endIndex; j++) {
          const blockLine = parsedLines[j];
          const blockWrapped = wrapText(blockLine.text, blockLine.type);
          for (let k = 0; k < blockWrapped.length; k++) {
            currentPageLines.push({
              text: blockWrapped[k],
              type: blockLine.type,
              lineIndex: blockLine.index,
            });
          }
          currentLineCount += blockWrapped.length;
        }
        
        i = blockInfo.endIndex + 1;
        continue;
      }
      
      // SCENE HEADING PROTECTION
      if (line.type === 'scene') {
        if (currentLineCount > 0 && currentLineCount + lineHeight >= LINES_PER_PAGE) {
          result.push({
            lines: currentPageLines,
            pageNumber: pageNumber,
            isTitlePage: false,
          });
          currentPageLines = [];
          currentLineCount = 0;
          pageNumber++;
        }
      }
      
      // Regular page break
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

      for (let j = 0; j < wrappedLines.length; j++) {
        currentPageLines.push({
          text: wrappedLines[j],
          type: line.type,
          lineIndex: line.index,
        });
      }
      currentLineCount += lineHeight;
      i++;
    }

    if (currentPageLines.length > 0) {
      result.push({
        lines: currentPageLines,
        pageNumber: pageNumber,
        isTitlePage: false,
      });
    }

    return result;
  }, [parsedLines]);

  // Update toolbar indicator only - NO scroll, NO state that causes re-render
  const updateCurrentLine = useCallback(() => {
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
  }, [value, parsedLines, forcedElement]);

  // Save scroll position before value changes
  const saveScrollPosition = useCallback(() => {
    if (editorRef.current) {
      scrollPosRef.current = editorRef.current.scrollTop;
    }
  }, []);

  // Restore scroll position after render
  const restoreScrollPosition = useCallback(() => {
    if (editorRef.current && scrollPosRef.current > 0) {
      editorRef.current.scrollTop = scrollPosRef.current;
    }
  }, []);

  // Handle keyboard input - ONLY intercept Tab and Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Save scroll position before any changes
    saveScrollPosition();

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

      const paddingChars = Math.floor(margins.left / 10);
      const padding = ' '.repeat(paddingChars);
      const paddedContent = padding + newLineContent.trimStart();

      const beforeLine = value.substring(0, currentLineStart);
      const afterLine = textAfterCursor;
      const newValue = beforeLine + paddedContent + afterLine;

      onChange(newValue);

      requestAnimationFrame(() => {
        if (textarea) {
          const newPos = currentLineStart + paddedContent.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
          restoreScrollPosition();
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

      requestAnimationFrame(() => {
        if (textarea) {
          const newPos = cursorPos + 1 + padding.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
          restoreScrollPosition();
        }
      });

      return;
    }

    // Allow ALL other keys to pass through normally (including Backspace, Delete, arrows)
    // Don't prevent default, don't intercept
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Save scroll position before updating value
    saveScrollPosition();
    onChange(e.target.value);
    // Restore scroll after React re-renders
    requestAnimationFrame(() => {
      restoreScrollPosition();
    });
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
    const lines = value.split('\n');
    let charPos = 0;
    for (let i = 0; i < lineIndex && i < lines.length; i++) {
      charPos += lines[i].length + 1;
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = charPos;
      textareaRef.current.selectionEnd = charPos;
      setCurrentLineIndex(lineIndex);
      setIsFocused(true);
    }
  };

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
              className="script-page"
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
