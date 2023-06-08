
const textEncoder = new TextEncoder();

let indent_size = 0;
let indent_next_chunk = true;

export function transform(chunk, write) {
	const indent_string = textEncoder.encode('=> '.repeat(indent_size));

	if (typeof chunk === 'string') {
		chunk = textEncoder.encode(chunk);
	}
	// console.log(chunk);

	let index_subarray_start = 0;

	for (
		let index_array = 0;
		index_array < chunk.length;
		index_array++
	) {
		if (chunk[index_array] === 10) {
			if (indent_next_chunk) {
				write(indent_string);
			}

			write(
				chunk.subarray(
					index_subarray_start,
					index_array + 1,
				),
			);

			indent_next_chunk = true;

			index_subarray_start = index_array + 1;
		}
	}

	if (index_subarray_start < chunk.length) {
		if (indent_next_chunk) {
			write(indent_string);
		}

		write(
			chunk.subarray(
				index_subarray_start,
			),
		);

		indent_next_chunk = chunk.at(-1) === 10;
	}
}

export function increateIndentation() {
	indent_size++;
}

export function decreaseIndentation() {
	indent_size--;
}

export function resetIndentation() {
	indent_size = 0;
}
