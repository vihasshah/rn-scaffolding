#! /usr/bin/env node

const { program } = require('commander')
const download = require('download-git-repo')
const handlebars = require('handlebars')
const inquirer = require('inquirer')
const ora = require('ora')
const logSymbols = require('log-symbols')
const fs = require('fs')
const os = require('os')
const chalk = require('chalk')
const { exec } = require('child_process')



// templete list
const templates = {
    default: {
        url: "https://github.com/vihasshah/react-native-template.git",
        downloadUrl: "https://github.com/vihasshah/react-native-template.git",
        description: "Basic React Native Project"
    }
}

const getOptions = (projectName) => [
    {
        type: 'list',
        name: 'appType',
        message: 'Please select application type',
        choices: ['default', 'marketplace'],
        default: 'default'
    },
    {
        type: 'inpute',
        name: 'name',
        message: 'Please enter the project name',
        default: projectName
    },
    {
        type: 'inpute',
        name: 'appId',
        message: "Please enter Bundle Identifier / Application ID",
        default: `com.${projectName.toLowerCase()}`
    },
    {
        type: 'inpute',
        name: 'description',
        message: 'Please enter a project description',
        default: ''
    },
    {
        type: 'inpute',
        name: 'author',
        message: "Please enter the author's name",
        default: ''
    }
]

/**
 * show spinner log 
 * download repo
 */
const downloadRepo = (projectName, downloadUrl, answers) => {
    const { appId, ...restAnswers } = answers
    const spinner = ora('Downloading template...').start()
    download(downloadUrl, projectName, { clone: true }, (err) => {
        if (err) {
            spinner.fail()
            console.log(logSymbols.error, chalk.red(err))
        } else {
            spinner.succeed()
            const packagePath = `${projectName}/package.json`
            const packageContent = fs.readFileSync(packagePath, 'utf8')
            const packageResult = handlebars.compile(packageContent)(restAnswers);
            fs.writeFileSync(packagePath, packageResult)
            console.log(logSymbols.success, chalk.green('Success to initialize template'))
            // ask options to user
            renamePackage(projectName, appId)
        }
    })
}


//////////////////////////////
// COMMANDS                 //
//////////////////////////////


/**
 * render project using npx command 
 * it will also set app id
 * @param {string} projectName 
 * @param {string} appId 
 */
const renamePackage = (projectName, appId) => {
    const spinner = ora('Renaming Package...').start()
    exec(`cd ${projectName} &&  npx react-native-rename "${projectName}" -b ${appId}`, (error, stdout, stderr) => {
        if (error) {
            spinner.fail()
            console.log(logSymbols.error, chalk.red(error))
            removeProject(projectName)
        } else {
            spinner.succeed()
            console.log(chalk.green(stdout))
            installPackages(projectName)
        }
    })
}

/**
 * install packages and if os is mac then install pods
 * @param {string} projectName 
 */
const installPackages = (projectName) => {
    const spinner = ora('Installing Packages...').start()
    // execute yarn install 
    exec(`cd ${projectName} && yarn install`, (error, stdout, stderr) => {
        if (error) {
            spinner.fail()
            console.log(logSymbols.error, chalk.red(error))
            removeProject(projectName)
        } else {
            spinner.succeed()
            console.log(chalk.green(stdout))
            // if mac then install pods
            if (os.platform() === 'darwin') {
                installPods(projectName)
            }
        }
    })
}

const installPods = (projectName) => {
    const spinner = ora('Installing Pods...').start()
    // execute yarn pod-install 
    exec(`cd ${projectName} && yarn pod-install`, (error, stdout, stderr) => {
        if (error) {
            spinner.fail()
            console.log(logSymbols.error, chalk.red(error))
            removeProject(projectName)
        } else {
            spinner.succeed()
            console.log(chalk.green(stdout))
        }
    })
}

/**
 * remove folder if any error found in install stages
 * @param {string} projectName 
 */
const removeProject = (projectName) => {
    exec(`rm -rf ${projectName}`)
}


//////////////////////////////
// TERMINAL                 //
//////////////////////////////


program.version('1.0.4')

/**
 * init command handle 
 * based onthis options will be asked and 
 * based on app type respective repo will be downloaded
 */
program
    .command('init <project>')
    .description('Initializing project templete')
    .action((projectName) => {
        inquirer.prompt(getOptions(projectName)).then((answers) => {
            const { appType } = answers
            if (appType === 'marketplace') {
                console.log(chalk.magentaBright("Oops! Currently this type is not supported :)"))
            } else {
                const { downloadUrl } = templates[appType]
                downloadRepo(projectName, downloadUrl, answers)
            }
        })

    })

program
    .command('list')
    .description('View list of available templates')
    .action(() => {
        console.log("default - React Native basic templete")
        console.log("marketplace - React Native marketplace templete (Coming Soon)")
    })

program.parse(process.argv)