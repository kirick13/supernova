
import os, json, yaml, hashlib
from urllib.parse import urlparse

from .supernova_runner import SupernovaRunner
from .supernova_logger import SupernovaLogger
from .supernova_shell import SupernovaShell

STEPS_INIT = yaml.safe_load(open('/supernova/configs/init.yml', 'r'))['steps']

class Supernova:
	def __init__ (self):
		self.logger = SupernovaLogger(self)

		self.logger.log()
		self.logger.log()

		self.shell = SupernovaShell(logger = self.logger).exec

		self._parse_args()

		self.NAME_HASH = hashlib.sha256(self.name.encode('utf-8')).hexdigest()[:16]

		self.DOCKER_VOLUME_REPO = f'supernova-{ self.NAME_HASH }-repo'
		self.DOCKER_VOLUME_TMP = f'supernova-{ self.NAME_HASH }-tmp'

		self._prepare_volumes()

	def _parse_args(self):
		self.logger.log('[INIT] Parse input arguments')
		self.logger.increase_indent()

		self.name = ''
		self.display_name = None
		self.git_url = ''
		self.git_url_hostname = ''
		self.git_branch = ''
		self.git_token = ''
		self.steps = []
		self.notifications_credentials = None
		self.env = {}

		for key, value in os.environ.items():
			if key == 'SUPERNOVA_NAME':
				self.name = value
				self.logger.repo_name = value
			elif key == 'SUPERNOVA_DISPLAY_NAME':
				self.display_name = value
			elif key == 'SUPERNOVA_GIT_URL':
				self.git_url = value
				self.git_url_hostname = urlparse(value).hostname
			elif key == 'SUPERNOVA_GIT_BRANCH':
				self.git_branch = value
			elif key == 'SUPERNOVA_STEPS':
				self.steps = json.loads(value)
			elif key == 'SUPERNOVA_GIT_TOKEN':
				self.git_token = value
			elif key == 'SUPERNOVA_NOTIFICATIONS':
				self.notifications_credentials = json.loads(value)
			elif key.startswith('SUPERNOVA_'):
				self.env[key] = value

		self.logger.log('name:', self.name)
		self.logger.log('display name:', self.display_name)
		self.logger.log('git_url:', self.git_url)
		self.logger.log('git_branch:', self.git_branch)
		self.logger.log('steps:', self.steps)
		self.logger.log('env:', self.env)

		self.logger.decrease_indent()

	def _prepare_volumes(self):
		self.logger.log('[INIT] Create docker volumes')
		self.logger.increase_indent()

		self.shell(
			[
				'docker',
				'volume',
				'create',
				self.DOCKER_VOLUME_REPO,
			],
			noerror = True,
		)

		self.shell(
			[
				'docker',
				'volume',
				'create',
				self.DOCKER_VOLUME_TMP,
			],
			noerror = True,
		)

		self.logger.decrease_indent()

	def run(self):
		try:
			self._run_init()
			self._run_repo()
			self._run_local()
		except:
			pass

		self._cleanup()

		self.logger.end(is_ended = True)

	def _run_init(self):
		self.logger.log('[PIPELINE STAGE] Init')
		self.logger.increase_indent()

		value = SupernovaRunner(
			supernova = self,
			restricted = False,
			volumes_readonly = False,
		).run(STEPS_INIT)
		self.logger.log('value:', value)

		self.config_repo = {
			'steps': [],
		}
		if value is not None and len(value) > 0:
			try:
				self.config_repo = yaml.safe_load(value)
			except:
				raise Exception('Invalid config file found at the root of the repository.')

		self.logger.decrease_indent()

	def _run_repo(self):
		self.logger.log('[PIPELINE STAGE] Repo steps')
		self.logger.increase_indent()

		SupernovaRunner(
			supernova = self,
		).run(self.config_repo['steps'])

		self.logger.decrease_indent()

	def _run_local(self):
		if self.steps is not None:
			self.logger.log('[PIPELINE STAGE] Local steps')
			self.logger.increase_indent()

			SupernovaRunner(
				supernova = self,
				restricted = False,
			).run(self.steps)

			self.logger.decrease_indent()

	def _cleanup(self):
		self.logger.log('[CLEANUP] Remove temporary docker volume')
		self.logger.increase_indent()

		self.shell([
			'docker',
			'volume',
			'rm',
			self.DOCKER_VOLUME_TMP,
		])

		self.logger.decrease_indent()
