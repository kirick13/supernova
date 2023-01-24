
import asyncio

class SupernovaShell:
	def __init__ (self, logger):
		self.logger = logger

	async def _read_stream(self, stream):
		lines = []
		while True:
			line = await stream.readline()
			if line:
				lines.append(line)
				self.logger.log(
					line.decode('utf-8').strip(),
				)
			else:
				break
		return lines

	async def _stream_subprocess(self, args, noerror = False, return_text = False):
		try:
			process = await asyncio.create_subprocess_exec(
				*args,
				stdout = asyncio.subprocess.PIPE,
				stderr = asyncio.subprocess.PIPE,
			)
			stdout, stderr = await asyncio.gather(
				self._read_stream(process.stdout),
				self._read_stream(process.stderr),
			)
			return_code = await process.wait()

			if return_code != 0 and not noerror:
				self.logger.end(return_code)

			return return_code, stdout, stderr

		except OSError as e:
			self.logger.log(e)
			self.logger.end(1)

	def exec (self, args, noerror = False):
		loop = asyncio.new_event_loop()
		return_code, stdout, stderr = loop.run_until_complete(
			self._stream_subprocess(args, noerror),
		)
		loop.close()

		return return_code, ''.join(el.decode() for el in stdout), ''.join(el.decode() for el in stderr)
