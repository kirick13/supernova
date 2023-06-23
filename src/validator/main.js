
import { createMultiTypeValidator,
         createObjectValidator   } from 'oh-my-props';

import { NAME_REGEXP }  from '../consts.js';
import validatorProject from '../validator/project.js';

const configValidator = createObjectValidator({
	projects: {
		type: Object,
		default: () => ({}),
		keys: {
			type: String,
			validator: (value) => NAME_REGEXP.test(value),
		},
		values: createMultiTypeValidator(
			{
				type: String,
				validator: (value) => value.length > 0,
			},
			validatorProject,
		),
	},
	notifications: {
		type: Object,
		default: () => ({}),
		keys: {
			type: String,
			validator: (value) => NAME_REGEXP.test(value),
		},
		values: {
			type: Object,
			entries: {
				type: {
					type: String,
					validator: (value) => value === 'telegram' || value === 'discord',
				},
				logs: {
					type: Boolean,
					default: false,
				},
				chat_id: {
					type: String,
					validator: (value) => value.length > 0,
				},
				bot_token: {
					type: String,
					validator: (value) => value.length > 0,
				},
			},
		},
	},
});

export default function (config) {
	return configValidator.cast(config ?? {});
}
