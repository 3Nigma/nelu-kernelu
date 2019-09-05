const fs = require("fs");

const { createLogger, format, transports } = require('winston');

const { Kernel } = require("./src/kernel");

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -c /tmp/conn.json', 'Instantiate the kernel using /tmp/conn.json as the connection-file')
    .alias('l', 'logging-level')
        .choices('l', ['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
        .default('l', 'error')
        .describe('l', "The runtime logging level to start from. 'silly' logs everything while 'error' logs only the errors.")
    // .alias('p', 'project').nargs('p', 1).describe('p', 'The moment-formatted name of the project to create')
    .alias('c', 'connection-file')
        .describe('c', 'The Jupyter connection file to use.')
    .demandOption(['c'])
    .help('h')
    .alias('h', 'help')
    .argv;

const logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.service}-${info.level}: ${info.message}`)
    ),
    defaultMeta: { service: 'nk-js' },
    transports: [
        //
        // - Write to all logs with level `info` and below to `quick-start-combined.log`.
        // - Write all logs error (and below) to `quick-start-error.log`.
        //
        // new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
        // new transports.File({ filename: 'quick-start-combined.log' })
    ]
});
logger.level = argv['logging-level'];
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console());
}

// Handle process messages (like SIGINT)
process.on("SIGINT", async () => {
    logger.debug("Interrupting kernel");
    await kernel.destroy();
});
process.on("uncaughtException", err => {
    logger.error(`An uncaught exception triggered in the kernel: ${err}\nStack dumped: ${err.stack}`);
});

// Start kernel
let kernel = new Kernel({
    logger,
    protocolVersion: "5.3",
    connection: JSON.parse(fs.readFileSync(argv['connection-file'])),
    startupScript: null
});

kernel.bindAndGo();