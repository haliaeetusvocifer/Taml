import { parse, stringify, TAMLError } from './index.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
  }
}

// Tests
console.log('Running TAML-JS Tests\n');

test('Parse simple key-value pairs', () => {
  const taml = 'name\tJohn\nage\t30';
  const result = parse(taml);
  assertEquals(result, { name: 'John', age: 30 });
});

test('Parse nested objects', () => {
  const taml = 'server\n\thost\tlocalhost\n\tport\t8080';
  const result = parse(taml);
  assertEquals(result, { server: { host: 'localhost', port: 8080 } });
});

test('Parse lists', () => {
  const taml = 'items\n\tfirst\n\tsecond\n\tthird';
  const result = parse(taml);
  assertEquals(result, { items: ['first', 'second', 'third'] });
});

test('Parse null values', () => {
  const taml = 'name\tJohn\npassword\t~';
  const result = parse(taml);
  assertEquals(result, { name: 'John', password: null });
});

test('Parse empty strings', () => {
  const taml = 'name\tJohn\nnickname\t""';
  const result = parse(taml);
  assertEquals(result, { name: 'John', nickname: '' });
});

test('Parse booleans', () => {
  const taml = 'enabled\ttrue\ndisabled\tfalse';
  const result = parse(taml);
  assertEquals(result, { enabled: true, disabled: false });
});

test('Parse numbers', () => {
  const taml = 'integer\t42\nfloat\t3.14';
  const result = parse(taml);
  assertEquals(result, { integer: 42, float: 3.14 });
});

test('Skip comments', () => {
  const taml = '# Comment\nname\tJohn\n# Another comment\nage\t30';
  const result = parse(taml);
  assertEquals(result, { name: 'John', age: 30 });
});

test('Skip blank lines', () => {
  const taml = 'name\tJohn\n\nage\t30\n\n';
  const result = parse(taml);
  assertEquals(result, { name: 'John', age: 30 });
});

test('Parse complex document', () => {
  const taml = `application\tMyApp
version\t1.0.0

server
\thost\tlocalhost
\tport\t8080
\tssl\ttrue

features
\tauthentication
\tlogging`;
  
  const result = parse(taml);
  assertEquals(result, {
    application: 'MyApp',
    version: '1.0.0',
    server: {
      host: 'localhost',
      port: 8080,
      ssl: true
    },
    features: ['authentication', 'logging']
  });
});

test('Stringify simple object', () => {
  const obj = { name: 'John', age: 30 };
  const result = stringify(obj);
  assertEquals(result, 'name\tJohn\nage\t30');
});

test('Stringify nested object', () => {
  const obj = { server: { host: 'localhost', port: 8080 } };
  const result = stringify(obj);
  assertEquals(result, 'server\n\thost\tlocalhost\n\tport\t8080');
});

test('Stringify array', () => {
  const obj = { items: ['first', 'second', 'third'] };
  const result = stringify(obj);
  assertEquals(result, 'items\n\tfirst\n\tsecond\n\tthird');
});

test('Stringify null values', () => {
  const obj = { name: 'John', password: null };
  const result = stringify(obj);
  assertEquals(result, 'name\tJohn\npassword\t~');
});

test('Stringify empty strings', () => {
  const obj = { name: 'John', nickname: '' };
  const result = stringify(obj);
  assertEquals(result, 'name\tJohn\nnickname\t""');
});

test('Stringify booleans', () => {
  const obj = { enabled: true, disabled: false };
  const result = stringify(obj);
  assertEquals(result, 'enabled\ttrue\ndisabled\tfalse');
});

test('Stringify numbers', () => {
  const obj = { integer: 42, float: 3.14 };
  const result = stringify(obj);
  assertEquals(result, 'integer\t42\nfloat\t3.14');
});

test('Round-trip simple object', () => {
  const original = { name: 'John', age: 30, active: true };
  const taml = stringify(original);
  const result = parse(taml);
  assertEquals(result, original);
});

test('Round-trip nested object', () => {
  const original = {
    server: {
      host: 'localhost',
      port: 8080,
      ssl: true
    }
  };
  const taml = stringify(original);
  const result = parse(taml);
  assertEquals(result, original);
});

test('Round-trip with arrays', () => {
  const original = {
    name: 'MyApp',
    features: ['auth', 'logging', 'caching']
  };
  const taml = stringify(original);
  const result = parse(taml);
  assertEquals(result, original);
});

test('Round-trip with null and empty', () => {
  const original = {
    name: 'John',
    password: null,
    nickname: '',
    bio: 'Hello'
  };
  const taml = stringify(original);
  const result = parse(taml);
  assertEquals(result, original);
});

test('Parse without type conversion', () => {
  const taml = 'age\t30\nenabled\ttrue';
  const result = parse(taml, { typeConversion: false });
  assertEquals(result, { age: '30', enabled: 'true' });
});

test('Strict mode rejects spaces in indentation', () => {
  const taml = 'server\n    host\tlocalhost';
  try {
    parse(taml, { strict: true });
    throw new Error('Should have thrown TAMLError');
  } catch (error) {
    if (!(error instanceof TAMLError)) {
      throw error;
    }
  }
});

test('Parse deeply nested structure', () => {
  const taml = `root
\tlevel1
\t\tlevel2
\t\t\tlevel3\tvalue`;
  const result = parse(taml);
  assertEquals(result, {
    root: {
      level1: {
        level2: {
          level3: 'value'
        }
      }
    }
  });
});

test('Stringify deeply nested structure', () => {
  const obj = {
    root: {
      level1: {
        level2: {
          level3: 'value'
        }
      }
    }
  };
  const result = stringify(obj);
  assertEquals(result, 'root\n\tlevel1\n\t\tlevel2\n\t\t\tlevel3\tvalue');
});

// Summary
console.log(`\n${testsPassed} tests passed, ${testsFailed} tests failed`);
process.exit(testsFailed > 0 ? 1 : 0);
