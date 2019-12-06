#!/bin/bash
echo -------------------------------------------------------
echo 代码分支: ${GIT_BRANCH}
echo -------------------------------------------------------
# 准备工作

yarn config set registry https://registry.npm.taobao.org

# 安装依赖
yarn install

# 删除dist并执行打包
if [ "$build_type" == "dev" ]
  then
  rm -rf dist && yarn run build
else
  rm -rf dist && yarn run $build_type
fi

if [ "$build_type" == "prod" ] || [ "$build_type" == "build" ]
  then
    mini-deploy --mode=upload --ver=$upload_version --desc="$upload_desc" --login.format=image --login.qr='login.png' --no-resume

    let "result |= $?"

    if [ "$result" == "0" ]
      then
        # 发送通知到钉钉群
        yarn run notify
      fi
else
  rm -rf ./preview.png
  rm -rf ./login.png
  mini-deploy --mode=preview --login.format=image --login.qr='login.png' --no-resume

  let "result |= $?"

  if [ "$result" == "2" ]
    then
        echo "need login"
  fi
fi
