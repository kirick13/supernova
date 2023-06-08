
import * as ARGS       from './args.js';
import * as loggerFile from './logger.file.js';
import sendDiscord	   from './notification/discord.js';
import sendTelegram    from './notification/telegram.js';

export default async function (exit_code) {
	const is_ok = exit_code === 0;

	let text = is_ok ? '✅ Build passed' : '❌ Build failed';
	text += `: *${ARGS.display_name}*`;

	let text_logs = '';
	if (!is_ok) {
		const log = await loggerFile.read();
		const log_last_lines = log.split('\n').slice(-10).join('\n');

		text_logs = '\n\n*Exit code:* ' + exit_code + '\n*Output log:*\n```\n' + log_last_lines + '```';
	}

	for (const notifier of ARGS.notifiers) {
		const add_logs = notifier.logs && !is_ok;
		const args = [
			notifier,
			text + (add_logs ? text_logs : ''),
			add_logs,
		];

		switch (notifier.type) {
			case 'telegram':
				await sendTelegram(...args); // eslint-disable-line no-await-in-loop
				break;
			case 'discord':
				await sendDiscord(...args); // eslint-disable-line no-await-in-loop
				break;
			// no default
		}
	}
}
