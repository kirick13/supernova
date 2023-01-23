
import shlex

from modules.env_template import use_env_vars

def _mounter (source, target = None, type = 'volume', readonly = False):
	return 'type={type},source={source},target={target}{flag_readonly}'.format_map({
		'type': type,
		'source': source,
		'target': target or source,
		'flag_readonly': ',readonly' if readonly else '',
	})

class SupernovaRunner:
	def __init__(self, supernova = None, restricted = True, volumes_readonly = True):
		self.supernova = supernova
		self.logger = supernova.logger
		self.shell = supernova.shell

		self.restricted = restricted
		self.volumes_readonly = volumes_readonly

	def run(self, steps):
		return_value = None

		for step in steps:
			step_name = step['name']
			is_docker = 'docker' in step
			docker_image = step['image'] if 'image' in step else ('docker:20.10.22-alpine3.17' if is_docker else 'busybox:stable')

			self.logger.log(f'[PIPELINE STEP] { step_name } ({ docker_image })')
			self.logger.increase_indent()

			mounts = self._get_mounts(step, is_docker)
			commands = self._get_commands(step, is_docker)
			env = self._get_env(step)

			docker_command = [
				'docker',
				'run',
				'--rm',
				*[ a for mount in mounts for a in ('--mount', mount) ],
				*[ a for env in env.items() for a in ('--env', '{}={}'.format(env[0], env[1])) ],
				'--workdir', step['workdir'] if ('workdir' in step) else '/opt/supernova',
				'--entrypoint', step['entrypoint'] if ('entrypoint' in step) else '/bin/sh',
				docker_image,
				'-c',
				commands,
			]

			# self.logger.log('Running:', shlex.join(docker_command))
			return_code, stdout, stderr = self.shell(docker_command)
			if self.restricted == False:
				return_value = stdout

			self.logger.decrease_indent()

		return return_value

	def _get_mounts(self, step, is_docker):
		mounts = [
			_mounter(
				self.supernova.DOCKER_VOLUME_REPO,
				'/opt/supernova',
				readonly = self.volumes_readonly,
			),
			_mounter(
				self.supernova.DOCKER_VOLUME_TMP,
				'/tmp/supernova',
			),
		]

		if is_docker:
			mounts.append(
				_mounter(
					'/var/run/docker.sock',
					type = 'bind',
				),
			)

		if self.restricted == False and 'bind' in step:
			for data in step['bind']:
				mounts.append(
					_mounter(
						data['source'],
						data['target'],
						type = 'bind',
					),
				)

		return mounts

	def _get_commands(self, step, is_docker):
		if is_docker:
			if type(step['docker']) is dict:
				docker_command = [ 'docker' ]

				if 'build' in step['docker']:
					data = step['docker']['build']

					docker_command += [ 'build' ]

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

					docker_command += [
						data['context'] if 'context' in data else '.',
					]
				else:
					raise Exception('Unknown docker command in step.')

				return shlex.join(docker_command)

			elif self.restricted:
				raise Exception('Cannot run docker commands in restricted mode.')

		return ' && '.join(step['commands'])

	def _get_env(self, step):
		env = {
			'SUPERNOVA_NAME': self.supernova.name,
		}

		if not self.restricted:
			env['SUPERNOVA_GIT_URL'] = self.supernova.git_url
			env['SUPERNOVA_GIT_URL_HOSTNAME'] = self.supernova.git_url_hostname
			env['SUPERNOVA_GIT_BRANCH'] = self.supernova.git_branch
			env['SUPERNOVA_GIT_TOKEN'] = self.supernova.git_token

		for key, value in self.supernova.env.items():
			env[key] = value

		if 'env' in step:
			for key, value in step['env'].items():
				env[key] = use_env_vars(value)

		return env
