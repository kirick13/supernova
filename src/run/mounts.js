
async function getContainerInfo() {
	const proc = Bun.spawn([
		'docker',
		'inspect',
		process.env.HOSTNAME,
	]);

	const text = await new Response(proc.stdout).text();

	return JSON.parse(text)[0];
}

export const container_info = await getContainerInfo();

async function getReposPathOnHost() {
	if (hasOwnProperty.call(container_info, 'Mounts')) {
		for (const mount of container_info.Mounts) {
			if (
				mount.Type === 'bind'
				&& mount.Destination === '/var/supernova/repos'
			) {
				return mount.Source;
			}
		}
	}
	else if (hasOwnProperty.call(container_info.HostConfig, 'Mounts')) {
		for (const mount of container_info.HostConfig.Mounts) {
			if (
				mount.Type === 'bind'
				&& mount.Target === '/var/supernova/repos'
			) {
				return mount.Source;
			}
		}
	}
	else if (hasOwnProperty.call(container_info.HostConfig, 'Binds')) {
		for (const bind of container_info.HostConfig.Binds) {
			const bind_parts = bind.split(':');
			if (bind_parts[1] === '/var/supernova/repos') {
				return bind_parts[0];
			}
		}
	}
}

export const repos_path_on_host = await getReposPathOnHost();
