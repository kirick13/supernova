
import sys, random

from modules.notification import send_notification

def random_string():
	return ''.join(random.choice('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') for x in range(30))

class SupernovaLogger:
	def __init__ (self, supernova):
		self.supernova = supernova

		self.file_name = f'/tmp/{ random_string() }.log.txt'
		self.file = open(self.file_name, 'w')

		self.indent = 0

	def log (self, *args):
		if self.indent > 0:
			args = (
				' '.join('=>' for _ in range(self.indent)),
				# '=> ' * self.indent,
				*args,
			)

		print(*args)

		self.file.write(
			' '.join(str(el) for el in args) + '\n',
		)

	def increase_indent(self):
		self.indent += 1

	def decrease_indent(self):
		self.indent -= 1

	def end (self, exit_code = 0):
		self.file.close()
		send_notification(
			exit_code = exit_code,
			log_file_name = self.file_name,
			repo_name = self.supernova.name,
			credentials = self.supernova.notifications_credentials,
		)
		sys.exit(exit_code)
