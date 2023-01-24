
from .telegram import send as telegram_send

def send_notification (
	exit_code = None,
	log_file_name = None,
	repo_display_name = None,
	credentials = None,
):
	is_ok = exit_code == 0

	if is_ok:
		text = '✅ Build passed'
	else:
		text = '❌ Build failed'

	text += f': *{ repo_display_name }*'

	if not is_ok:
		with open(log_file_name, 'r') as file:
			last_lines_list = file.read().splitlines()[-10:]
			last_lines = '\n'.join(last_lines_list)
			text += '\n\n*Exit code:* {}\n*Output log:*\n```\n{}```'.format(exit_code, last_lines)

	if credentials['type'] == 'telegram':
		telegram_send(
			credentials = credentials,
			text = text,
			log_file_name = log_file_name if not is_ok else None,
		)
	else:
		print('Unknown notification type:', credentials['type'])
