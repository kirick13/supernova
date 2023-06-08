
import { createObjectValidator } from 'oh-my-props';

import { ENV_KEY_REGEXP }             from '../consts.js';
import validator_ProjectValues_Docker from '../validator/project.docker.js';
import validator_ProjectValues_Repo   from '../validator/project.repo.js';
import validator_ProjectValues_Steps  from '../validator/steps.js';

export default createObjectValidator({
	displayName: {
		type: String,
		optional: true,
		validator: (value) => value.length > 0,
	},
	webhookSecret: {
		type: String,
		validator: (value) => value.length > 0,
	},
	repo: validator_ProjectValues_Repo,
	env: {
		type: Object,
		default: () => ({}),
		keys: {
			type: String,
			validator: (value) => ENV_KEY_REGEXP.test(value),
		},
		values: {
			type: String,
			validator: (value) => value.length > 0,
		},
	},
	docker: validator_ProjectValues_Docker,
	steps: validator_ProjectValues_Steps,
	notify: {
		type: Array,
		default: () => [],
		values: {
			type: String,
			validator: (value) => value.length > 0,
		},
	},
});
