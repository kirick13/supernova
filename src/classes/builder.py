
import os, json, hashlib, shlex
import yaml

from classes.shell import BuilderShell
from classes.logger import BuildLogger
from config import (
	SUPERNOVA_DOCKERFILE_NAME,
	SUPERNOVA_CONFIG_DIR_NAME,
	SUPERNOVA_SHARED_DIR_NAME,
)
from modules.env_template import use_env_vars

def _mounter (source, target = None, type = 'bind'):
	return f'type={ type },source={ source },target={ target or source }'

class Builder:
	def __init__ (self):
		self.logger = BuildLogger()

		self.logger.log()
		self.logger.log()

		self.shell = BuilderShell(self.logger).exec

		self.name = ''
		self.git_url = ''
		self.git_branch = ''
		self.steps = None
		self.notifications_credentials = None
		self.env = {}

		for key, value in os.environ.items():
			if key == 'SUPERNOVA_NAME':
				self.name = value
				self.logger.repo_name = value
			elif key == 'SUPERNOVA_GIT_URL':
				self.git_url = value
			elif key == 'SUPERNOVA_GIT_BRANCH':
				self.git_branch = value
			elif key == 'SUPERNOVA_STEPS':
				self.steps = json.loads(value)
			elif key == 'SUPERNOVA_NOTIFICATIONS':
				self.logger.notifications_credentials = json.loads(value)
			elif key.startswith('SUPERNOVA_'):
				self.env[key] = value

		self.logger.log('name:', self.name)
		self.logger.log('git_url:', self.git_url)
		self.logger.log('git_branch:', self.git_branch)
		self.logger.log('steps:', self.steps)
		self.logger.log('env:', self.env)

		self.WORKDIR = '/opt/supernova/' + self.name
		self.NAME_HASH = hashlib.sha256(self.name.encode('utf-8')).hexdigest()[:16]
		self.DOCKER_VOLUME_NAME = f'supernova-tmp-{ self.NAME_HASH }'
		self.DOCKER_CONTAINER_NAME = f'local/supernova-runner-{ self.NAME_HASH }'

		self._prepare_filesystem()

	def run (self):
		self.shell([
			'docker',
			'volume',
			'create',
			self.DOCKER_VOLUME_NAME,
		])

		self._execute_main_steps()
		self._execute_after_steps()

		self.shell([
			'docker',
			'volume',
			'rm',
			self.DOCKER_VOLUME_NAME,
		])

		self.logger.end()

	def _prepare_filesystem (self):
		os.makedirs(
			self.WORKDIR,
			mode = 0o777,
			exist_ok = True,
		)
		os.chdir(self.WORKDIR)

		self.shell(
			[
				'git',
				'clone',
				self.git_url,
				'.',
			],
			noerror = True,
		)
		self.shell([
			'git',
			'checkout',
			self.git_branch,
		])
		self.shell([
			'git',
			'pull',
		])

	def _run_step (self, step, is_approved = False):
		step_name = step['name']
		is_docker = 'docker' in step
		docker_image = step['image'] if 'image' in step else ('docker:20.10.22-alpine3.17' if is_docker else 'busybox:stable')

		# self.logger.log()
		self.logger.log(f'*** [STEP] { step_name } ({ docker_image }) ***************')

		os.makedirs(
			SUPERNOVA_CONFIG_DIR_NAME,
			mode = 0o777,
			exist_ok = True,
		)
		if is_docker and is_approved:
			self.shell([
				'cp',
				'/root/.docker/config.json',
				SUPERNOVA_CONFIG_DIR_NAME + '/docker.json',
			])
		if is_approved:
			self.shell([
				'cp',
				'-r',
				'/etc/supernova/shared',
				SUPERNOVA_SHARED_DIR_NAME,
			])

		with open(SUPERNOVA_DOCKERFILE_NAME, 'w') as docker_file:
			docker_file.write(f'FROM { docker_image }')
			docker_file.write('\nCOPY . /supernova')
			if is_docker and is_approved:
				docker_file.write(f'\nCOPY { SUPERNOVA_CONFIG_DIR_NAME }/docker.json /root/.docker/config.json')
			if is_approved:
				docker_file.write(f'\nCOPY { SUPERNOVA_SHARED_DIR_NAME } /etc/supernova/shared')
			docker_file.write('\nWORKDIR /supernova')
			docker_file.write(f'\nRUN rm { SUPERNOVA_DOCKERFILE_NAME } && rm -rf { SUPERNOVA_CONFIG_DIR_NAME } { SUPERNOVA_SHARED_DIR_NAME } || true')
			docker_file.close()

		# self.shell([
		# 	'cat',
		# 	SUPERNOVA_DOCKERFILE_NAME,
		# ])

		self.shell([
			'docker',
			'build',
			'-f', SUPERNOVA_DOCKERFILE_NAME,
			'-t', self.DOCKER_CONTAINER_NAME,
			'.',
		])

		os.remove(SUPERNOVA_DOCKERFILE_NAME)
		self.shell(
			[
				'rm',
				'-rf',
				SUPERNOVA_CONFIG_DIR_NAME,
				SUPERNOVA_SHARED_DIR_NAME,
			],
			noerror = True,
		)

		MOUNTS = [
			_mounter(
				self.DOCKER_VOLUME_NAME,
				'/tmp/supernova',
				type = 'volume',
			),
		]
		if is_docker:
			MOUNTS.append(
				_mounter('/var/run/docker.sock'),
			)

		commands = ''
		if is_docker and type(step['docker']) is dict:
			print(step['docker'])
			if 'build' in step['docker']:
				data = step['docker']['build']

				docker_command = [
					'docker',
					'build',
				]

				if 'tag' in data:
					docker_command += [
						'--tag',
						use_env_vars(data['tag']),
					]

				if 'file' in data:
					docker_command += [
						'--file',
						use_env_vars(data['file']),
					]

				if 'context' in data:
					docker_command += [
						data['context'],
					]
				else:
					docker_command += [ '.' ]

				commands = shlex.join(docker_command)
			else:
				raise Exception('Unknown docker command in step')
		else:
			commands = '; '.join(step['shell'])

		self.shell([
		# print([
			'docker',
			'run',
			'--rm',
			*[ a for mount in MOUNTS for a in ('--mount', mount) ],
			*[ a for env in self.env.items() for a in ('--env', f'{ env[0] }={ env[1] }') ],
			'--entrypoint', '/bin/sh',
			self.DOCKER_CONTAINER_NAME,
			'-c',
			# f'ls -lha /etc/supernova/shared/vault',
			commands,
		])

	def _execute_main_steps (self):
		with open('supernova.config.yml', 'r+') as stream:
			config = yaml.safe_load(stream)
			self.logger.log('config =', config)

			for step in config['steps']:
				self._run_step(step)
				# break

	def _execute_after_steps (self):
		for step in self.steps:
			self._run_step(
				step,
				is_approved = True,
			)
			# break
