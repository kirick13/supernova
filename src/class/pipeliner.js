
export default class Pipeliner {
	#run_id = Math.random().toString(36).slice(-7);
	#prefix = `\u001B[${Math.floor((Math.random() * 6) + 31)}m[${this.#run_id}]\u001B[0m `;

	get run_id() {
		return this.#run_id;
	}

	print(...chunks) {
		process.stdout.write(this.#prefix);

		for (const chunk of chunks) {
			if (chunk !== null) {
				process.stdout.write(chunk);
			}
		}

		process.stdout.write('\n');
	}

	async #iterate(async_iterable) {
		let buffer = null;

		for await (const chunk of async_iterable) {
			let index_subarray = 0;
			for (
				let index = 0;
				index < chunk.length;
				index++
			) {
				const byte = chunk[index];

				if (byte === 10) {
					this.print(
						buffer,
						chunk.subarray(
							index_subarray,
							index,
						),
					);

					buffer = null;
					index_subarray = index + 1;
				}
			}

			buffer = (index_subarray < chunk.length) ? chunk.subarray(index_subarray) : null;
		}
	}

	attach(async_iterable) {
		this.#iterate(async_iterable).catch((error) => console.error(error));
	}
}
