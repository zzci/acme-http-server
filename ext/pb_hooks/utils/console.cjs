// Helper function to mimic path.basename
function getBasename(filePath) {
  return filePath.split('/').pop().split('\\').pop()
}

function getColor(level) {
  switch (level) {
    case 0: // log
    case 1: // trace
      return '\x1b[34m' // Blue
    case 2: // debug
    case 3: // info
      return '\x1b[32m' // Green
    case 4: // warn
      return '\x1b[33m' // Yellow
    case 5: // error
    case 6: // fatal
      return '\x1b[31m' // Red
    default:
      return '\x1b[0m' // Reset
  }
}

function createConsole(config) {
  const defaultConfig = {
    transport: data => {
      const color = getColor(data.level)
      const reset = '\x1b[0m'
      const levelMethod = data.level >= 4 ? console.error : console.log
      levelMethod(
        `${color}[${data.title}] (${data.file}:${data.line}) ${data.method}: ${data.message}${reset}`,
      )
    },
    level: 4,
    methods: ['log', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'],
  }

  class Console {
    constructor(config = {}) {
      this.config = Object.assign({}, defaultConfig, config)
      this.config.methods.forEach((method, index) => {
        this[method] = this.createLogMethod(method, index)
      })
    }

    createLogMethod(title, level) {
      return (...args) => {
        if (level < this.config.level) return

        const stack = new Error().stack ? new Error().stack.split('\n')[2] : ''
        const [method, file, line] = this.parseStackInfo(stack)

        const message = args
          .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
          .join(' ')
        const data = {
          message: message,
          title: title,
          level: level,
          method: method,
          file: file,
          line: line,
        }
        this.config.transport(data)
      }
    }

    parseStackInfo(stackLine) {
      const stackReg = /at\s+(.*?)\s+\(?([^():]+):(\d+):(\d+)\)?/
      const match = stackReg.exec(stackLine) || []
      return [
        match[1] || 'unknown',
        getBasename(match[2] || ''), // Use our custom function
        parseInt(match[3] || '0', 10),
      ]
    }
  }

  return new Console(config)
}

const logLevel = process.env.PB_LOG_LEVEL !== undefined ? parseInt(process.env.PB_LOG_LEVEL, 10) : 2

const logger = createConsole({
  level: logLevel,
})

module.exports = logger
