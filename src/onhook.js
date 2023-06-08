
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
import runSteps,
       { ACCESS_LEVEL }                 from './run/runner.js';
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

	// run init steps
	await supernovaConsole.indent(
		'[INIT] Run init steps',
		async () => {
			const steps = await readSteps('/app/configs/init.yml');

			await runSteps(
				steps,
				ACCESS_LEVEL.SYSTEM,
			);
		},
	);

	// run external steps
	try {
		const steps = await readSteps(
			joinPath(
				'/var/supernova/repos',
				ARGS.name,
				'supernova.config.yml',
			),
		);

		await runSteps(
			steps,
			ACCESS_LEVEL.EXTERNAL_USER,
		);
	}
	catch (error) {
		if (error instanceof SupernovaConfigNotExistsError !== true) {
			throw error;
		}
	}

	// run admin steps
	if (ARGS.steps.length > 0) {
		await runSteps(
			ARGS.steps,
			ACCESS_LEVEL.ADMIN,
		);
	}

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
