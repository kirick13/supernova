
import { createValidator } from 'oh-my-props';

import { FQDN_REGEXP } from '../consts.js';

export default createValidator({
	type: Object,
	default: () => ({}),
	entries: {
		imagesAllowed: {
			type: Array,
			optional: true,
			values: {
				type: String,
				validator: (value) => value.length > 0,
			},
		},
		login: {
			type: Object,
			default: () => ({}),
			keys: {
				type: String,
				validator: (value) => value.length === 0 || FQDN_REGEXP.test(value),
			},
			values: {
				type: Object,
				entries: {
					user: {
						type: String,
						validator: (value) => value.length > 0,
					},
					token: {
						type: String,
						validator: (value) => value.length > 0,
					},
				},
			},
		},
	},
});
