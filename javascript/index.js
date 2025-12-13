/**
 * TAML (Tab Accessible Markup Language) Parser and Serializer
 * Version 0.1.0
 */

const TAB = '\t';
const NULL_VALUE = '~';
const EMPTY_STRING = '""';

export class TAMLError extends Error {
  constructor(message, line) {
    super(line !== undefined ? `Line ${line}: ${message}` : message);
    this.name = 'TAMLError';
    this.line = line;
  }
}

/**
 * Parse a TAML string into a JavaScript object
 * @param {string} text - TAML formatted text
 * @param {Object} options - Parsing options
 * @param {boolean} options.strict - Enable strict parsing (default: false)
 * @param {boolean} options.typeConversion - Convert string values to native types (default: true)
 * @returns {Object} Parsed JavaScript object
 */
export function parse(text, options = {}){
  const { strict = false, typeConversion = true } = options;
  
  const lines = text.split('\n');
  const root = {};
  const stack = [{ level: -1, node: root }];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    if (line.trim() === '') continue;
    if (line.trimStart().startsWith('#')) continue;
    
    if (line.match(/^[ \t]+/) && line.match(/^ /)) {
      if (strict) {
        throw new TAMLError('Indentation must use tabs, not spaces', lineNum);
      }
      continue;
    }
    
    const indentMatch = line.match(/^(\t*)/);
    const level = indentMatch ? indentMatch[1].length : 0;
    const content = line.substring(level);
    
    if (content.trim() === '') continue;
    
    const tabIndex = content.indexOf(TAB);
    const hasValue = tabIndex !== -1;
    const key = hasValue ? content.substring(0, tabIndex) : content.trim();
    const rawValue = hasValue ? content.substring(tabIndex + 1).replace(/^\t+/, '').trimEnd() : null;
    
    if (!key) {
      if (strict) throw new TAMLError('Line has no key', lineNum);
      continue;
    }
    
    if (rawValue && rawValue.includes(TAB)) {
      if (strict) throw new TAMLError('Value contains invalid tab character', lineNum);
      continue;
    }
    
    let value = rawValue;
    if (rawValue === NULL_VALUE) {
      value = null;
    } else if (rawValue === EMPTY_STRING) {
      value = '';
    } else if (rawValue !== null && rawValue !== '' && typeConversion) {
      value = convertType(rawValue);
    }
    
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    const parent = stack[stack.length - 1];
    
    if (level > parent.level + 1) {
      if (strict) {
        throw new TAMLError(`Invalid indentation level (expected ${parent.level + 1} tabs, found ${level})`, lineNum);
      }
      continue;
    }
    
    if (Array.isArray(parent.node)) {
      // Parent is an array, this is a list item
      if (hasValue) {
        if (strict) {
          throw new TAMLError('List items cannot be key-value pairs', lineNum);
        }
        continue;
      }
      parent.node.push(key);
    } else {
      // Parent is an object
      if (hasValue) {
        // Leaf value
        parent.node[key] = value;
      } else {
        // Parent node - look ahead to determine if it's an array or object
        // Check immediate children: if they have no tabs AND no grandchildren, they're list items
        let isArray = false;
        let hasListItems = false;
        let hasKeyValuePairs = false;
        
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.trim() === '' || nextLine.trimStart().startsWith('#')) {
            continue;
          }
          const nextIndent = (nextLine.match(/^(\t*)/) || ['', ''])[1].length;
          
          if (nextIndent < level + 1) {
            break;
          }
          
          if (nextIndent === level + 1) {
            // This is an immediate child
            const nextContent = nextLine.substring(nextIndent);
            const nextTabIdx = nextContent.indexOf(TAB);
            
            if (nextTabIdx > 0) {
              // Has key-value with tab separator
              hasKeyValuePairs = true;
            } else if (nextTabIdx === -1) {
              // No tab - could be list item or parent node
              // Check if it has children (look at next line)
              let hasChildren = false;
              for (let k = j + 1; k < lines.length; k++) {
                const checkLine = lines[k];
                if (checkLine.trim() === '' || checkLine.trimStart().startsWith('#')) {
                  continue;
                }
                const checkIndent = (checkLine.match(/^(\t*)/) || ['', ''])[1].length;
                if (checkIndent > nextIndent) {
                  hasChildren = true;
                  break;
                } else if (checkIndent <= nextIndent) {
                  break;
                }
              }
              
              if (!hasChildren) {
                // It's a leaf with no value - must be a list item
                hasListItems = true;
              }
            }
          }
        }
        
        // If we found list items and no key-value pairs, it's an array
        isArray = hasListItems && !hasKeyValuePairs;
        
        parent.node[key] = isArray ? [] : {};
        stack.push({ level, node: parent.node[key] });
      }
    }
  }
  
  return root;
}

/**
 * Convert string value to native type
 */
function convertType(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  
  return value;
}

/**
 * Serialize a JavaScript object to TAML format
 * @param {*} obj - JavaScript object to serialize
 * @param {Object} options - Serialization options
 * @param {number} options.indentLevel - Starting indentation level (default: 0)
 * @param {boolean} options.typeConversion - Convert native types to strings (default: true)
 * @returns {string} TAML formatted string
 */
export function stringify(obj, options = {}) {
  const { indentLevel = 0, typeConversion = true } = options;
  const lines = [];
  
  serializeValue(obj, lines, indentLevel, typeConversion);
  
  return lines.join('\n');
}

function serializeValue(value, lines, level, typeConversion) {
  if (value === null) {
    return NULL_VALUE;
  }
  
  if (value === '') {
    return EMPTY_STRING;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (Array.isArray(value)) {
    for (const item of value) {
      const indent = TAB.repeat(level);
      if (typeof item === 'object' && item !== null) {
        serializeObject(item, lines, level, typeConversion);
      } else {
        const serialized = serializeValue(item, [], level, typeConversion);
        lines.push(indent + serialized);
      }
    }
    return null;
  }
  
  if (typeof value === 'object') {
    serializeObject(value, lines, level, typeConversion);
    return null;
  }
  
  return String(value);
}

function serializeObject(obj, lines, level, typeConversion) {
  const indent = TAB.repeat(level);
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      lines.push(indent + key + TAB + NULL_VALUE);
    } else if (value === '') {
      lines.push(indent + key + TAB + EMPTY_STRING);
    } else if (typeof value === 'object') {
      lines.push(indent + key);
      if (Array.isArray(value)) {
        serializeValue(value, lines, level + 1, typeConversion);
      } else {
        serializeObject(value, lines, level + 1, typeConversion);
      }
    } else {
      const serialized = serializeValue(value, [], level, typeConversion);
      lines.push(indent + key + TAB + serialized);
    }
  }
}

export default {
  parse,
  stringify,
  TAMLError
};
