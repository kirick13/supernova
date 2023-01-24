
import os, sys, random

from modules.notification import send_notification

def random_string():
	return ''.join(random.choice('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') for x in range(30))

class SupernovaLogger:
	def __init__ (self, supernova):
		self.supernova = supernova

		self.file_name = f'/tmp/{ random_string() }.log.txt'
		self.file = open(self.file_name, 'w')

		self.indent = 0

		self.exit_code = None

	def log (self, *args, no_indent = False):
		if self.indent > 0 and no_indent == False:
			args = (
				' '.join('=>' for _ in range(self.indent)),
				# '=> ' * self.indent,
				*args,
			)

		print(*args)

		if self.exit_code is None:
			self.file.write(
				' '.join(str(el) for el in args) + '\n',
			)

	def increase_indent(self):
		self.indent += 1

	def decrease_indent(self):
		self.indent -= 1

	def end (self, exit_code = 0, is_ended = False):
		if self.exit_code is None:
			self.exit_code = exit_code

			self.file.close()
			send_notification(
				exit_code = exit_code,
				log_file_name = self.file_name,
				repo_display_name = self.supernova.name if self.supernova.display_name is None else self.supernova.display_name,
				credentials = self.supernova.notifications_credentials,
			)

			self.log(f'[EXIT] Process ended with code {exit_code}.', no_indent = True)

			if not is_ended:
				self.indent = 0
				self.log('[EXIT] Now waiting for cleanup.')
				raise RuntimeError('')

		if is_ended:
			os.remove(self.file_name)
			sys.exit(self.exit_code)
