
export const file_name = Bun.spawnSync([ 'mktemp' ]).stdout.toString().trim();

const file = Bun.file(file_name);
const writer = file.writer();

export function close() {
	writer.close();
}

export function write(chunk) {
	writer.write(chunk);
	writer.flush();
}

export async function read() {
	return Bun.file(file_name).text();
}
