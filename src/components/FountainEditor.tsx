import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

type ElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

interface FountainEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SCENE_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E.', 'E/I.'];
const TRANSITION_SUFFIXES = ['TO:', 'IN:', 'OUT:'];
const ELEMENT_CYCLE: ElementType[] = ['action', 'scene', 'character', 'dialogue', 'parenthetical', 'transition'];

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

interface ParsedLine {
  text: string;
  type: ElementType;
  index: number;
}

export default function FountainEditor({ value, onChange, placeholder }: FountainEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [currentElement, setCurrentElement] = useState<ElementType>('action');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [forcedElement, setForcedElement] = useState<ElementType | null>(null);

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

  useEffect(() => {
    updateCurrentLine();
  }, [value, updateCurrentLine]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && previewRef.current) {
      previewRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

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

      const paddingChars = Math.floor(margins.left / 10);
      const padding = ' '.repeat(paddingChars);
      const paddedContent = padding + newLineContent.trimStart();

      const beforeLine = value.substring(0, currentLineStart);
      const afterLine = textAfterCursor;
      const newValue = beforeLine + paddedContent + afterLine;

      onChange(newValue);

      setTimeout(() => {
        if (textarea) {
          const newPos = currentLineStart + paddedContent.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
        }
      }, 0);

      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const activeType = forcedElement || (parsedLines[lineIndex]?.type || 'action');
      let nextType: ElementType = 'action';

      switch (activeType) {
        case 'scene':
          nextType = 'action';
          break;
        case 'action':
          nextType = 'action';
          break;
        case 'character':
          nextType = 'dialogue';
          break;
        case 'dialogue':
          nextType = 'action';
          break;
        case 'parenthetical':
          nextType = 'dialogue';
          break;
        case 'transition':
          nextType = 'scene';
          break;
      }

      setForcedElement(nextType);

      const margins = getElementMargins(nextType);
      const paddingChars = Math.floor(margins.left / 10);
      const padding = ' '.repeat(paddingChars);

      const newValue = value.substring(0, cursorPos) + '\n' + padding + textAfterCursor;
      onChange(newValue);

      setTimeout(() => {
        if (textarea) {
          const newPos = cursorPos + 1 + padding.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
        }
      }, 0);

      return;
    }

    if (e.key !== 'Tab' && e.key !== 'Enter') {
      setForcedElement(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setForcedElement(null);
  };

  const renderPreviewLine = (line: ParsedLine, isCurrentLine: boolean) => {
    const appliedType = isCurrentLine && forcedElement ? forcedElement : line.type;
    const margins = getElementMargins(appliedType);

    let className = 'whitespace-pre-wrap break-words ';
    let style: React.CSSProperties = {
      paddingLeft: margins.left,
      paddingRight: margins.right,
      minHeight: '1.5em',
    };

    switch (appliedType) {
      case 'scene':
        className += 'font-bold uppercase';
        break;
      case 'character':
        className += 'uppercase';
        break;
      case 'transition':
        className += 'uppercase text-right';
        style.textAlign = 'right';
        break;
      case 'parenthetical':
        className += 'italic';
        break;
    }

    return (
      <div key={line.index} className={className} style={style}>
        {line.text || '\u00A0'}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Current:</span>
          <div className="flex gap-1">
            {ELEMENT_CYCLE.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setForcedElement(type);
                  setCurrentElement(type);
                  textareaRef.current?.focus();
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  currentElement === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getElementLabel(type)}
              </button>
            ))}
          </div>
          <span className="text-gray-400 dark:text-gray-500 ml-4">
            Tab to cycle | Enter for next
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 flex justify-center">
        <div className="w-full max-w-[900px] h-full py-8 px-4">
          <div className="bg-white dark:bg-gray-800 shadow-xl h-full rounded overflow-hidden relative">
            <div
              ref={previewRef}
              className="absolute inset-0 overflow-auto pointer-events-none px-16 py-12"
              style={{ fontFamily: 'Courier Prime, Courier New, monospace', fontSize: '13px', lineHeight: '1.6' }}
            >
              <div className="text-gray-900 dark:text-gray-100">
                {parsedLines.map((line) => renderPreviewLine(line, line.index === currentLineIndex))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onScroll={syncScroll}
              onClick={updateCurrentLine}
              onSelect={updateCurrentLine}
              className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-primary-500 dark:caret-primary-400 resize-none outline-none px-16 py-12 selection:bg-primary-200 dark:selection:bg-primary-800"
              style={{ fontFamily: 'Courier Prime, Courier New, monospace', fontSize: '13px', lineHeight: '1.6' }}
              placeholder={placeholder}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
