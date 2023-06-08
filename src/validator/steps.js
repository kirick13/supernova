
import { createValidator,
         createMultiTypeValidator } from 'oh-my-props';

import { ENV_KEY_REGEXP } from '../consts.js';
import { isPlainObject }  from '../utils.js';

export default createValidator({
	type: Array,
	values: {
		type: Object,
		entries: {
			name: {
				type: String,
				validator: (value) => value.length > 0,
			},
			docker: createMultiTypeValidator(
				{
					type: Boolean,
					optional: true,
				},
				{
					type: Object,
					optional: true,
					validator: (value) => Object.keys(value).length === 1,
					entries: {
						build: {
							type: Object,
							entries: {
								// TODO: check if that Dockerfile withing the repo
								file: {
									type: String,
									optional: true,
									validator: (value) => value.length > 0,
								},
								tag: {
									type: String,
									validator: (value) => value.length > 0,
								},
								// TODO: add support for context, need to check if that context withing the repo
								// context: {
								// 	type: String,
								// 	default: '.',
								// 	validator: (value) => value.length > 0,
								// },
								platforms: {
									type: Array,
									optional: true,
									values: {
										type: String,
										validator: (value) => value.length > 0,
									},
								},
							},
						},
					},
				},
			),
			image: {
				type: String,
				optional: true,
				validator: (value) => value.length > 0,
			},
			bind: {
				type: Array,
				optional: true,
				values: {
					type: Object,
					entries: {
						source: {
							type: String,
							validator: (value) => value.length > 0,
						},
						target: {
							type: String,
							validator: (value) => value.length > 0,
						},
						readonly: {
							type: Boolean,
							default: false,
						},
					},
				},
			},
			container: {
				type: String,
				optional: true,
				validator: (value) => value.length > 0,
			},
			commands: {
				type: Array,
				optional: true,
				values: createMultiTypeValidator(
					{
						type: String,
						validator: (value) => value.length > 0,
					},
					{
						type: Object,
						validator: (value) => Object.keys(value).length === 1,
						keys: {
							type: String,
							validator: (value) => ENV_KEY_REGEXP.test(value),
						},
						values: {
							type: String,
							validator: (value) => value.length > 0,
						},
					},
				),
			},
		},
		contentValidator(value) {
			if (isPlainObject(value.docker)) {
				return value.image === null
					&& value.bind === null
					&& value.container === null
					&& value.commands === null;
			}

			if (value.image !== null) {
				return value.container === null
					&& value.commands !== null;
			}

			if (value.container !== null) {
				return value.docker === null
					&& value.image === null
					&& value.bind === null;
			}

			return value.commands !== null;
		},
	},
});
