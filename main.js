const fs = require("fs");

const { createLogger, format, transports } = require('winston');

const { Kernel } = require("./src/kernel");

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -c /tmp/conn.json', 'Instantiate the kernel using /tmp/conn.json as the connection-file')
    // .alias('e', 'environment').choices('e', ['staging', 'production']).describe('e', 'The environment to target')
    // .alias('p', 'project').nargs('p', 1).describe('p', 'The moment-formatted name of the project to create')
    .alias('c', 'connection-file').describe('c', 'The Jupyter connection file to use')
    .demandOption(['c'])
    .help('h')
    .alias('h', 'help')
    .argv;

/* Log levels: 
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  silly: 5 
 */
const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.service}-${info.level}: ${info.message}`)
    ),
    defaultMeta: { service: 'jjs' },
    transports: [
        //
        // - Write to all logs with level `info` and below to `quick-start-combined.log`.
        // - Write all logs error (and below) to `quick-start-error.log`.
        //
        // new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
        // new transports.File({ filename: 'quick-start-combined.log' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console());
}

// Interpret a SIGINT signal as a request to interrupt the kernel
process.on("SIGINT", async () => {
    log("Interrupting kernel");
    await kernel.destroy(); // TODO(NR) Implement kernel interruption
});

process.on("uncaughtException", err => {
    console.log(err);
});

// Start kernel
let kernel = new Kernel({
    logger,
    protocolVersion: "5.2.3",
    connection: JSON.parse(fs.readFileSync(argv['connection-file'])),
    startupScript: null
});

kernel.bindAndGo();