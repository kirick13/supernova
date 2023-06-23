#!/usr/local/bin/bun

// curl -s -X POST -H "X-Supernova-Token: $(cat /var/run/supernova/token.txt)" -D - http://localhost:9000/webhook/$1

const project = process.argv[2];

const token_file = Bun.file('/var/run/supernova/token.txt');
const token = await token_file.text();

const request = new Request(
    `http://localhost:9000/webhook/${project}`,
    {
        method: 'POST',
        headers: {
            'X-Supernova-Token': token,
        },
    },
);

const response = await fetch(request);

console.log(`HTTP ${response.status} ${response.statusText}`)
for (const [ name, value ] of response.headers.entries()) {
    console.log(`${name}: ${value}`);
}
console.log();
console.log(await response.text());
