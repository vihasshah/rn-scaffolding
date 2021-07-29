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
    basic: {
        url: "https://github.com/vihasshah/react-native-template.git",
        downloadUrl: "https://github.com:vihasshah/react-native-template#master",
        description: "Basic React Native Project"
    }
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


program.version('0.0.1')

program
    .command('init <template> <project>')
    .description('Initializing project templete')
    .action((templateName, projectName) => {
        const { downloadUrl } = templates[templateName]
        const spinner = ora('Downloading template...').start()
        download(downloadUrl, projectName, { clone: true }, (err) => {
            if (err) {
                spinner.fail()
                console.log(logSymbols.error, chalk.red(err))
                return
            } else {
                spinner.succeed()
                // ask options to user
                inquirer.prompt([
                    {
                        type: 'inpute',
                        name: 'appId',
                        message: "Please enter Bundle Identifier / Application ID"
                    },
                    {
                        type: 'inpute',
                        name: 'description',
                        message: 'Please enter a project description'
                    },
                    {
                        type: 'inpute',
                        name: 'author',
                        message: "Please enter the author's name"
                    }
                ]).then((answers) => {
                    const { appId, ...restAnswers } = answers
                    const packagePath = `${projectName}/package.json`
                    const packageContent = fs.readFileSync(packagePath, 'utf8')
                    const packageResult = handlebars.compile(packageContent)({ name: projectName, ...restAnswers });
                    fs.writeFileSync(packagePath, packageResult)
                    console.log(logSymbols.success, chalk.green('Success to initialize template'))
                    renamePackage(projectName, appId)
                })
            }
        })
    })

program
    .command('list')
    .description('View list of available templates')
    .action(() => {
        console.log(process.platform, os.platform())
        console.log("basic - React Native basic templete")
    })

program.parse(process.argv)