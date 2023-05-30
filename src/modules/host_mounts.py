
import json, os, subprocess
from typing import Any

# _labels: dict
# def _get_labels() -> dict[str, Any]:
# 	global _labels
# 	if '_labels' not in vars():
# 		output, error = subprocess.Popen('docker ps --filter name=supernova --format \'{{json .}}\' --no-trunc', stdout=subprocess.PIPE, shell=True).communicate()

# 		for line in output.decode().splitlines():
# 			container = json.loads(line)

# 			if container['ID'].startswith(os.environ['HOSTNAME']):
# 				if isinstance(container.get('Labels'), str):
# 					try:
# 						_labels = json.loads(container['Labels'])
# 					except json.JSONDecodeError:
# 						_labels = {}
# 						for pair in container['Labels'].split(','):
# 							key, value = pair.split('=', 1)
# 							_labels[key] = value

# 	return _labels

_info: dict
def _get_info() -> dict[str, Any]:
	global _info
	if '_info' not in vars():
		output, error = subprocess.Popen('docker inspect {}'.format(os.environ['HOSTNAME']), stdout=subprocess.PIPE, shell=True).communicate()
		_info = json.loads(output.decode())[0]

	return _info

_repos_host_path: str
def get_repos_host_path() -> str:
	global _repos_host_path

	if '_repos_host_path' not in vars():
		info = _get_info()

		if 'Mounts' in info['HostConfig']:
			for mount in info['HostConfig']['Mounts']:
				if mount['Type'] == 'bind' and mount['Destination'] == '/var/supernova/repos':
					_repos_host_path = mount['Source']
					break
		elif 'Binds' in info['HostConfig']:
			for bind in info['HostConfig']['Binds']:
				bind_parts = bind.split(':')
				if bind_parts[1] == '/var/supernova/repos':
					_repos_host_path = bind_parts[0]
					break

	if type(_repos_host_path) is not str:
		raise Exception('Could not find repos mount')

	return _repos_host_path
