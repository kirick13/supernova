
import os, shlex
from typing import Any, TYPE_CHECKING

from modules.env_template import use_env_vars

if TYPE_CHECKING:
	from .supernova import Supernova

def _mounter (source, target = None, type = 'volume', readonly = False):
	return 'type={type},source={source},target={target}{flag_readonly}'.format_map({
		'type': type,
		'source': source,
		'target': target or source,
		'flag_readonly': ',readonly' if readonly else '',
	})

class SupernovaRunner:
	def __init__(self, supernova: 'Supernova', restricted = True, volumes_readonly = True):
		self.supernova = supernova
		self.logger = supernova.logger
		self.shell = supernova.shell

		self.restricted = restricted
		self.volumes_readonly = volumes_readonly

	def run(self, steps):
		return_value = None

		for step in steps:
			stdout = SupernovaRunnerStep(step, supernova_runner=self).run()
			if self.restricted == False:
				return_value = stdout

		return return_value


class SupernovaRunnerStep:
	def __init__(self, step: dict[str, Any], supernova_runner: 'SupernovaRunner'):
		self.supernova_runner = supernova_runner

		self.step = step

		self.is_docker = 'docker' in step
		self.local_container_name = step.get('container', None)

		self.env = self._get_env()

	def _get_env(self):
		env = {
			'SUPERNOVA_NAME': self.supernova_runner.supernova.name,
		}

		if not self.supernova_runner.restricted:
			env.update(os.environ)

			env['SUPERNOVA_GIT_URL'] = self.supernova_runner.supernova.git_url
			env['SUPERNOVA_GIT_URL_HOSTNAME'] = self.supernova_runner.supernova.git_url_hostname
			env['SUPERNOVA_GIT_BRANCH'] = self.supernova_runner.supernova.git_branch
			env['SUPERNOVA_GIT_TOKEN'] = self.supernova_runner.supernova.git_token

		for key, value in self.supernova_runner.supernova.env.items():
			env[key] = value

		if 'env' in self.step:
			for key, value in self.step['env'].items():
				env[key] = use_env_vars(value)

		return env

	def _get_mounts(self):
		mounts = [
			_mounter(
				self.supernova_runner.supernova.host_path_repo,
				'/opt/supernova',
				type = 'bind',
				readonly = self.supernova_runner.volumes_readonly,
			),
			_mounter(
				self.supernova_runner.supernova.DOCKER_VOLUME_TMP,
				'/tmp/supernova',
			),
		]

		if self.is_docker:
			mounts.append(
				_mounter(
					'/var/run/docker.sock',
					type = 'bind',
				),
			)

		if self.supernova_runner.restricted == False and 'bind' in self.step:
			for data in self.step['bind']:
				mounts.append(
					_mounter(
						data['source'],
						data['target'],
						type = 'bind',
					),
				)

		return mounts

	def _get_image(self) -> str:
		if 'image' in self.step:
			return self.step['image']

		if self.is_docker:
			return 'docker:20.10.22-alpine3.17'

		return 'busybox:stable'

	def _get_commands(self):
		if self.is_docker:
			if type(self.step['docker']) is dict:
				commands_before = []
				docker_command = [ 'docker' ]
				commands_after = []

				if 'build' in self.step['docker']:
					data = self.step['docker']['build']

					if 'platforms' in data:
						platforms = data['platforms']
						if not isinstance(platforms, list):
							raise Exception('Docker platforms must be a list.')

						commands_before.append('docker buildx create --name multibuilder >/dev/null 2>&1')
						commands_before.append('docker buildx use multibuilder')

						docker_command += [
							'buildx',
							'build',
							'--load',
							'--platform',
							','.join(platforms),
							'--output',
							'type=docker',
						]
					else:
						docker_command += [ 'build' ]

					if 'file' in data:
						docker_command += [
							'--file',
							use_env_vars(data['file'], self.env),
						]

					if 'tag' in data:
						tag = use_env_vars(data['tag'], self.env)
						if self.supernova_runner.restricted and tag not in self.supernova_runner.supernova.docker_images_allowed:
							raise Exception(f'Docker tag "{ tag }" is not allowed to build.')

						docker_command += [
							'--tag',
							tag,
						]
					else:
						raise Exception('Docker build command must have a tag.')

					docker_command += [
						data['context'] if 'context' in data else '.',
					]
				else:
					raise Exception('Unknown docker command in step.')

				return ' && '.join(commands_before + [ shlex.join(docker_command) ] + commands_after)

			elif self.supernova_runner.restricted:
				raise Exception('Cannot run docker commands in restricted mode.')

		return ' && '.join(self.step['commands'])

	def run(self):
		step_name = self.step['name']

		docker_command = [ 'docker' ]

		if self.local_container_name:
			if self.supernova_runner.restricted:
				raise Exception('Cannot execute commands inside local containers in restricted mode.')

			self.supernova_runner.logger.log(f'[PIPELINE STEP] { step_name } (container { self.local_container_name })')

			docker_command.extend([
				'exec',
				self.local_container_name,
				'/bin/sh',
			])
		else:
			docker_image = self._get_image()

			self.supernova_runner.logger.log(f'[PIPELINE STEP] { step_name } (image { docker_image })')

			docker_command.extend([
				'run',
				'--rm',
				*[ a for mount in self._get_mounts() for a in ('--mount', mount) ],
				*[ a for env in self.env.items() for a in ('--env', '{}={}'.format(env[0], env[1])) ],
				'--workdir', self.step['workdir'] if ('workdir' in self.step) else '/opt/supernova',
				'--entrypoint', self.step['entrypoint'] if ('entrypoint' in self.step) else '/bin/sh',
				docker_image,
			])

		self.supernova_runner.logger.increase_indent()

		docker_command.extend([
			'-c',
			self._get_commands(),
		])

		self.supernova_runner.logger.log('Running:', shlex.join(docker_command))
		return_code, stdout, stderr = self.supernova_runner.shell(docker_command)

		self.supernova_runner.logger.decrease_indent()

		return stdout

