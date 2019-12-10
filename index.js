#!/usr/bin/env node
const path = require('path');
const axios = require('axios');
const program = require('commander');
const packageJson = require('./package.json');
const WechatCli = require('./wechat-cli');
const tool = require('./tool');
const errorCode = require('./wechat-cli').errorCode;

program
    .version(packageJson.version)
    .usage('[--options ...]')
    .option('-w, --workspace [value]', '微信小程序工作区目录', `${process.cwd()}\\dist`)
    .option('-ver, --ver [value]', '发布版本号', '1.0.0')
    .option('-d, --desc [value]', '发布简介', '美业买家版：1.0.0')
    .option('-m, --mode [value]', '模式: preview|upload', 'preview')
    .option('--resume', '启用任务续传', true)
    .option('--no-resume', '禁用任务续传')
    .option('--preview.format [value]', '二维码输出形式：terminal|base64|image', 'image')
    .option('--preview.qr [value]', '二维码存放路径(相对项目)', 'preview.png')
    .option('--preview.log [value]', '预览日志路径')
    .option('--preview.compileCondition [value]', '自定义编译条件')
    .option('--login.format [value]', '二维码输出形式：terminal|base64|image', 'terminal')
    .option('--login.qr [value]', '二维码存放路径(相对项目)')
    .option('--login.log [value]', '登录日志路径')
    .option('-d, --debug', 'debug mode')
    .option('--jenkins [value]', 'jenkins任务名', 'wxapp-build')
    .option('--wxurl [value]', '企业微信机器人');


program.parse(process.argv);

const wechatCli = new WechatCli(program);

const noticeWx = async (type, content) => {
    if (program.wxurl) {
        const ip = tool.getIPAddress();
        if (type === 'photo') {
            const data_news = {
                msgtype: 'news',
                news: {
                    articles: [{
                        title: '点击预览二维码',
                        url: `http://${ip}:8080/job/${program.jenkins}/${content}`,
                        picurl: 'http://img.yzcdn.cn/upload_files/2019/10/08/FoWQVnCeaWtxSprNNwuozNdKSm8E.jpeg',
                    }]
                }
            }
            await axios.post(program.wxurl, data_news)
        } else if (type === 'text') {
            const data_text = {
                msgtype: 'text',
                text: {
                    content: content
                }
            }
            await axios.post(program.wxurl, data_text)
        }
    }
}

const preview = async () => {
    let res = await wechatCli.preview();

    if (res) {
        if (res.errorCode === errorCode.success) {
            // jenkins中利用该信息显示Build详情
            if (program['preview.format'] === 'image') {
                const linkUrl = path.join('./ws/dist', program['preview.qr']);
                await noticeWx('photo', linkUrl);
                console.log(
                    '[wxapp-deploy-cli] <img src="' + linkUrl + '" alt="开发码" width="200" height="200" /><a href="' + linkUrl + '" target="_blank">开发码</a>'
                );
            } else if (program['preview.format'] === 'terminal') {
                console.log('[wxapp-deploy-cli] 进入Build详情扫开发码进入小程序');
            }
        }

        process.exit(res.errorCode);
    } else {
        console.error('preview error!');
        console.error(res && res.message);
        process.exit(res.errorCode);
    }
};

const upload = async () => {
    // 上传
    let res = await wechatCli.upload();

    if (res) {
        if (res.errorCode === errorCode.success) {
            await noticeWx('text', res.message);
            console.log(res.message);
            console.log('[wxapp-deploy-cli] ' + res.message);
            process.exit(res.errorCode);
        }

        console.log(res.message);
        process.exit(res.errorCode);
    } else {
        console.error('upload error!');
        console.error(res && res.message);
        process.exit(res.errorCode);
    }
};

const start = async () => {
    if (tool.fsExistsSync(path.join(program.workspace, 'project.config.json'))) {
        // 启动微信开发者工具
        const result = await wechatCli.start();

        if (result) {
            if (program.mode === 'preview') {
                await preview();
            } else if (program.mode === 'upload') {
                await upload();
            } else if (program.mode ==='test') {
                noticeWx('photo');
            }
        } else {
            process.exit(errorCode.failed);
        }
    } else {
        console.error('workspace下未找到 project.config.json，请指定为小程序目录。');
        process.exit(errorCode.failed);
    }
};

(async () => await start())();
