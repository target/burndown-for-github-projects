const fs = require('fs')

const envExists = fs.existsSync('.env')

if (envExists) {
  if (process.env.npm_config_loglevel === 'verbose') {
    console.debug(`.env already present, no new file created.`)
  }
  return
}

if (fs.existsSync('.env.sample')) {
  fs.copyFileSync('.env.sample', '.env')
  console.log(
    `A .env was generated as none was found. Fill in blank values or the application will not run successfully.`
  )
} else {
  console.log(
    `No .env was found, and one could not be generated because '.env.sample' is not present to reference.`
  )
}
