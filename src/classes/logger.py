
import sys, random

from modules.notification import send_notification

def random_string():
	return ''.join(random.choice('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') for x in range(30))

class BuildLogger:
	def __init__(self):
		self.file_name = f'/tmp/{ random_string() }.log.txt'
		self.file = open(self.file_name, 'w')
		self.repo_name = None
		self.notifications_credentials = None

	def log (self, *args):
		print(*args)
		self.file.write(
			' '.join(str(el) for el in args) + '\n',
		)

	def end (self, exit_code = 0):
		self.file.close()
		send_notification(
			exit_code = exit_code,
			log_file_name = self.file_name,
			repo_name = self.repo_name,
			credentials = self.notifications_credentials,
		)
		sys.exit(exit_code)
