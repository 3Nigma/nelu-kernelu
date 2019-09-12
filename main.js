const fs = require("fs");

const { createLogger, format, transports } = require('winston');

const { Kernel } = require("./src/kernel");

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -c /tmp/conn.json', 'Instantiate the kernel using /tmp/conn.json as the connection-file')
    .alias('s', 'startup-script')
        .describe('s', 'The location of a .js file to execute immediatelly after the kernel starts up')
    .alias('l', 'logging-level')
        .choices('l', ['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
        .default('l', 'error')
        .describe('l', "The runtime logging level to start from. 'silly' logs everything while 'error' logs only the errors.")
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

process.on("uncaughtException", err => {
    logger.error(`An uncaught exception triggered in the kernel: ${err}\nStack dumped: ${err.stack}`);
});

// Initialize the kernel and fire it up
const kernel = new Kernel({
    logger,
    protocolVersion: "5.3",
    buildNumber: 1, // TODO: take this automatically from somewhere
    connection: JSON.parse(fs.readFileSync(argv['connection-file'])),
    startupScript: argv['startup-script']
});
kernel.bindAndGo();