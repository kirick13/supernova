
import { createValidator,
         createMultiTypeValidator } from 'oh-my-props';

export default createMultiTypeValidator(
	createValidator({
		type: Object,
		entries: {
			path: {
				type: String,
				validator: (value) => value.length > 0,
			},
		},
	}),
	createValidator({
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
	}),
);
