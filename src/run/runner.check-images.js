
import { minimatch } from 'minimatch';

import * as ARGS from '../run/args.js';

export default function (image_tag) {
	for (const glob of ARGS.docker.images_allowed) {
		if (minimatch(image_tag, glob)) {
			return;
		}
	}

	throw new Error(`Docker tag "${image_tag}" is not allowed to build.`);
}
