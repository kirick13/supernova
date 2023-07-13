
module.exports = {
	root: true,
	parser: '@babel/eslint-parser',
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		requireConfigFile: false,
	},
	env: {
		node: true,
		browser: true,
		es2022: true,
	},
	extends: [
		'eslint:recommended',
		'xo',
		'plugin:import/recommended',
		'plugin:node/recommended',
		'plugin:promise/recommended',
		'plugin:unicorn/recommended',
	],
	plugins: [
		'import',
		'node',
		'promise',
		'unicorn',
	],
	globals: {
		Bun: 'readonly',
	},
	rules: {
		'array-bracket-spacing': [
			'error',
			'always',
			{
				arraysInArrays: false,
				objectsInArrays: false,
			},
		],
		'arrow-parens': [
			'warn',
			'always',
		],
		'brace-style': [
			'error',
			'stroustrup',
		],
		'camelcase': 'off',
		'capitalized-comments': 'off',
		'complexity': [
			'warn',
			{
				max: 25,
			},
		],
		'indent': [
			'error',
			'tab',
			{
				ignoredNodes: [
					'ImportDeclaration',
					'ObjectPattern',
				],
				ImportDeclaration: 'off',
				SwitchCase: 1,
			},
		],
		'max-depth': [
			'warn',
			{
				max: 5,
			},
		],
		'no-multi-spaces': [
			'error',
			{
				exceptions: {
					Property: true,
					ImportDeclaration: true,
				},
			},
		],
		'no-promise-executor-return': 'off',
		'node/no-unsupported-features/es-syntax': 'off',
		'object-curly-spacing': [
			'warn',
			'always',
			{
				arraysInObjects: true,
				objectsInObjects: true,
			},
		],
		'padding-line-between-statements': [
			'error',
			{
				blankLine: 'never',
				prev: 'case',
				next: 'break',
			},
		],
		'quote-props': [
			'error',
			'consistent-as-needed',
			{
				numbers: true,
			},
		],
		'quotes': [
			'error',
			'single',
		],
		'unicorn/no-null': 'off',
		'unicorn/prefer-ternary': [
			'error',
			'only-single-line',
		],
		'unicorn/prevent-abbreviations': [
			'error',
			{
				allowList: {
					args: true,
					arg0: true,
					env: true,
					Env: true,
					fn: true,
				},
			},
		],
		'unicorn/switch-case-braces': [
			'warn',
			'avoid',
		],
	},
};
