
console.log();

import { join as joinPath } from 'node:path';

import { SupernovaConfigNotExistsError,
         SupernovaInvalidConfigError  } from './errors.js';
import * as ARGS                        from './run/args.js';
import * as dockerVolume                from './run/docker.volume.js';
import * as supernovaConsole            from './run/logger.js';
import * as loggerFile                  from './run/logger.file.js';
import { resetIndentation }             from './run/logger.transformer.js';
import sendNotifications 			    from './run/notification.js';
import runSteps                         from './run/runner.js';
import { SubprocessError }              from './run/shell.js';
import { readSteps }                    from './utils.js';

let exit_code = 0;

try {
	if (process.env.SUPERNOVA_DEBUG) {
		await supernovaConsole.indent(
			'[INIT] Parse input arguments',
			() => {
				supernovaConsole.log('ARGS', ARGS);
			},
		);
	}

	await dockerVolume.create();

	const steps_system = await readSteps(
		ARGS.git.url
			? '/app/configs/init.git.clone.yml'
			: '/app/configs/init.git.path.yml',
	);

	await runSteps(
		steps_system,
		ARGS.steps,
		async () => {
			try {
				return await readSteps(
					joinPath(
						ARGS.git.url
							? joinPath(
								'/var/supernova/repos',
								ARGS.name,
							)
							: joinPath(
								'/bind',
								ARGS.git.path,
							),
						'supernova.config.yml',
					),
				);
			}
			catch (error) {
				if (error instanceof SupernovaConfigNotExistsError !== true) {
					throw error;
				}
			}

			return [];
		},
	);

	supernovaConsole.log('✅ Pipeline completed successfully.');
}
catch (error) {
	exit_code = -1;

	if (error instanceof SubprocessError) {
		exit_code = error.exit_code;
		supernovaConsole.error(`❌ Process terminated with code ${error.exit_code}.`);
	}
	else if (error instanceof SupernovaConfigNotExistsError) {
		supernovaConsole.error(`❌ Config file not found: ${error.path}`);
	}
	else if (error instanceof SupernovaInvalidConfigError) {
		supernovaConsole.error(`❌ Config file is invalid: ${error.path}`);
	}
	else {
		supernovaConsole.error('❌ Unhandled rejection happened.');
		supernovaConsole.error(error);
	}
}

resetIndentation();

await dockerVolume.remove();

loggerFile.close();

await sendNotifications(exit_code);
