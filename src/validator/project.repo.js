
import { createValidator } from 'oh-my-props';

export default createValidator({
	type: Object,
	entries: {
		url: {
			type: String,
			validator: (value) => value.length > 0,
		},
		branch: {
			type: String,
			default: 'main',
		},
		user: {
			type: String,
			default: 'user',
			validator: (value) => value.length > 0,
		},
		token: {
			type: String,
			optional: true,
			validator: (value) => value.length > 0,
		},
	},
});
