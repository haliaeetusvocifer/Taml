import { parse, stringify } from './index.js';

// Example 1: Parse a TAML document
console.log('=== Example 1: Parsing TAML ===\n');

const tamlDocument = `# Application Configuration
application	MyApp
version	1.0.0
author	Developer Name
license	~

server
	host	0.0.0.0
	port	8080
	ssl	true

database
	type	postgresql
	connection
		host	db.example.com
		port	5432
		database	myapp_db
		password	~

features
	user-authentication
	api-gateway
	rate-limiting
	logging

environments
	development
		debug	true
		log_level	verbose
	production
		debug	false
		log_level	error
`;

const config = parse(tamlDocument);
console.log('Parsed configuration:');
console.log(JSON.stringify(config, null, 2));

// Example 2: Serialize an object to TAML
console.log('\n=== Example 2: Serializing to TAML ===\n');

const myConfig = {
  name: 'My Service',
  version: '2.0.0',
  enabled: true,
  port: 3000,
  description: '',
  apiKey: null,
  endpoints: [
    '/api/users',
    '/api/posts',
    '/api/comments'
  ],
  database: {
    host: 'localhost',
    port: 5432,
    credentials: {
      username: 'admin',
      password: null
    }
  }
};

const taml = stringify(myConfig);
console.log('Serialized TAML:');
console.log(taml);

// Example 3: Round-trip conversion
console.log('\n=== Example 3: Round-trip ===\n');

const original = {
  user: {
    name: 'Alice',
    email: 'alice@example.com',
    roles: ['admin', 'editor', 'viewer']
  }
};

const tamlString = stringify(original);
console.log('Original object:');
console.log(JSON.stringify(original, null, 2));
console.log('\nTAML representation:');
console.log(tamlString);
console.log('\nParsed back:');
const parsed = parse(tamlString);
console.log(JSON.stringify(parsed, null, 2));
console.log('\nObjects match:', JSON.stringify(original) === JSON.stringify(parsed));
