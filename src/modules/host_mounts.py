
import json, os, subprocess
from typing import Any

_labels: dict
def _get_labels() -> dict[str, Any]:
	global _labels
	if '_labels' not in vars():
		output, error = subprocess.Popen('docker ps --filter name=supernova --format \'{{json .}}\' --no-trunc', stdout=subprocess.PIPE, shell=True).communicate()

		for line in output.decode().splitlines():
			container = json.loads(line)

			if container['ID'].startswith(os.environ['HOSTNAME']):
				if isinstance(container.get('Labels'), str):
					try:
						_labels = json.loads(container['Labels'])
					except json.JSONDecodeError:
						_labels = {}
						for pair in container['Labels'].split(','):
							key, value = pair.split('=', 1)
							_labels[key] = value

	return _labels

_repos_host_path: str
def get_repos_host_path() -> str:
	global _repos_host_path

	if '_repos_host_path' not in vars():
		labels = _get_labels()

		for i in range(len(labels)):
			key_target = 'desktop.docker.io/mounts/{}/Target'.format(i)
			if key_target in labels and labels[key_target] == '/var/supernova/repos':
				_repos_host_path = labels['desktop.docker.io/mounts/{}/Source'.format(i)]
				break

	return _repos_host_path
