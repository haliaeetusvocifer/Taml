# TAML-JS

JavaScript parser and serializer for TAML (Tab Accessible Markup Language).

## Installation

```bash
npm install taml-js
```

## Usage

### Parsing TAML

```javascript
import { parse } from 'taml-js';

const taml = `
application	MyApp
version	1.0.0

server
	host	localhost
	port	8080
	ssl	true

features
	authentication
	logging
	caching
`;

const obj = parse(taml);
console.log(obj);
// {
//   application: 'MyApp',
//   version: '1.0.0',
//   server: {
//     host: 'localhost',
//     port: 8080,
//     ssl: true
//   },
//   features: ['authentication', 'logging', 'caching']
// }
```

### Serializing to TAML

```javascript
import { stringify } from 'taml-js';

const obj = {
  application: 'MyApp',
  version: '1.0.0',
  server: {
    host: 'localhost',
    port: 8080,
    ssl: true
  },
  features: ['authentication', 'logging', 'caching']
};

const taml = stringify(obj);
console.log(taml);
```

### Options

#### Parse Options

```javascript
parse(text, {
  strict: false,        // Enable strict validation (default: false)
  typeConversion: true  // Convert strings to numbers/booleans (default: true)
});
```

#### Stringify Options

```javascript
stringify(obj, {
  indentLevel: 0,       // Starting indentation level (default: 0)
  typeConversion: true  // Convert native types to strings (default: true)
});
```

### Special Values

- **Null values**: Use `~`
  ```javascript
  { password: null } → "password\t~"
  ```

- **Empty strings**: Use `""`
  ```javascript
  { nickname: '' } → "nickname\t\"\""
  ```

- **Regular strings**: No quotes needed
  ```javascript
  { name: 'John' } → "name\tJohn"
  ```

### Type Conversion

When `typeConversion` is enabled (default), the parser automatically converts:
- `"true"` and `"false"` → boolean
- `"42"` → number (integer)
- `"3.14"` → number (float)
- `"~"` → null
- `'""'` → empty string

## Error Handling

```javascript
import { parse, TAMLError } from 'taml-js';

try {
  const obj = parse(invalidTaml, { strict: true });
} catch (error) {
  if (error instanceof TAMLError) {
    console.error(`TAML Error on line ${error.line}: ${error.message}`);
  }
}
```

## API

### `parse(text, options)`

Parses a TAML string into a JavaScript object.

- **Parameters:**
  - `text` (string): TAML formatted text
  - `options` (object, optional):
    - `strict` (boolean): Enable strict parsing (default: false)
    - `typeConversion` (boolean): Convert string values to native types (default: true)
- **Returns:** Parsed JavaScript object
- **Throws:** `TAMLError` if parsing fails in strict mode

### `stringify(obj, options)`

Serializes a JavaScript object to TAML format.

- **Parameters:**
  - `obj` (any): JavaScript object to serialize
  - `options` (object, optional):
    - `indentLevel` (number): Starting indentation level (default: 0)
    - `typeConversion` (boolean): Convert native types to strings (default: true)
- **Returns:** TAML formatted string

### `TAMLError`

Custom error class for TAML parsing errors.

- **Properties:**
  - `message` (string): Error message
  - `line` (number): Line number where error occurred

## License

MIT
