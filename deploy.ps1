echo -------------------------------------------------------
echo 代码分支: $env:branch
echo -------------------------------------------------------
echo $env:build_type
# 准备工作

yarn config set registry http://registry.npm.qima-inc.com
npm config set registry http://registry.npm.qima-inc.com

# 安装依赖
yarn install

# 删除dist
rm -r -force dist
# 执行打包
npm run build:$env:build_type
if (($env:build_type -eq "prod") -or ($env:build_type -eq "publish")) {
    wxapp-deploy-cli --mode=upload --ver=$env:upload_version --desc="$env:upload_desc" --login.format=image --login.qr='login.png' --no-resume
    echo -----------------------------
    echo $value
    $result = $value
    if ($result -eq 0) {
        echo $result
    }
}
else {
    wxapp-deploy-cli --mode=preview --login.format=image --login.qr='login.png' --no-resume
    echo -----------------------------
    echo $value
    $result = $value

    if ($result -eq 2) {
        echo "need login"
    }
}