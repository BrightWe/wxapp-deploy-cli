const fs = require('fs');
const cp = require('child_process');

/**
 * 判断文件对调用进程是否可调用
 * @param path
 * @returns {boolean}
 */
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

function shell(path, args, opt, verbase, resume) {
    const stdout = [];
    let stderr = '';

    const cmd = `${path} ${args.join(' ')}`;
    if (verbase || resume) {
        console.log(cmd);
    }
    let printStdoutBufferMessage = message => {
        const str = message.toString();
        stdout.push(str);

        if (verbase || resume) {
            console.log(stdout.join(''));
        }
    };
    let printStderrBufferMessage = message => {
        let str = message.toString();
        stderr += str;

        if (verbase || resume) {
            console.log(str);
        }
    };

    return new Promise((resolve, reject) => {
        // path = "\"" + path + "\"";
        // var shell = cp.spawn(path + " " + args.join(" "));
        const shell = cp.spawn(path, args, {});

        // 登录并且禁用续传
        if (cmd.indexOf('-l') > 0 && !resume) {
            setTimeout(() => {
                shell.kill();
            }, 3000);
        }

        shell.on('error', message => {
            console.log(message);
        });
        shell.stderr.on('data', printStderrBufferMessage);
        shell.stderr.on('error', printStderrBufferMessage);
        shell.stdout.on('data', printStdoutBufferMessage);
        shell.stdout.on('error', printStdoutBufferMessage);

        shell.on('exit', (code, signal) => {
            if (code !== 0 && signal !== 'SIGTERM') {
                if (verbase) {
                    console.log('Failed: code ' + code + ' signal ' + signal);
                }
                reject({
                    code,
                    signal,
                    stdout: stdout.join(''),
                    stderr,
                });
            } else {
                resolve({
                    code,
                    signal,
                    stdout: stdout.join(''),
                    stderr,
                });
            }
        });
    });
}

async function executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        cp.exec(command, options, (error, stdout, stderr) => {
            resolve({
                error,
                stdout,
                stderr,
            });
        });
    });
}

module.exports = {
    fsExistsSync: fsExistsSync,
    executeCommand: executeCommand,
    shell: shell,
};
