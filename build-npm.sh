#!/bin/bash

set -e

echo "构建 go-deploy npm 包..."

# 1. 安装依赖
echo "步骤 1: 安装依赖"
npm install

# 2. 构建所有平台的二进制文件
echo "步骤 2: 构建多平台二进制文件"
npm run build

# 3. 运行测试（需要先构建二进制文件）
echo "步骤 3: 运行测试"
npm test

# 4. 发布平台特定的包
echo "步骤 4: 发布平台特定的包"
if [ "$1" = "--publish" ]; then
  echo "发布平台特定的包..."

  for platform_dir in packages/*/; do
    if [ -d "$platform_dir" ]; then
      echo "发布 $(basename "$platform_dir")"
      cd "$platform_dir"
      npm publish --access public
      cd ../..
    fi
  done

  echo "发布主包..."
  npm publish --access public
else
  echo "跳过发布步骤（使用 --publish 参数来发布）"
fi

echo "构建完成！"

# 使用说明
echo ""
echo "使用方法:"
echo "  ./build-npm.sh           # 只构建，不发布"
echo "  ./build-npm.sh --publish # 构建并发布到 npm"
echo ""
echo "手动发布步骤:"
echo "1. 先发布所有平台特定的包:"
echo "   cd packages/darwin-x64 && npm publish --access public"
echo "   cd packages/darwin-arm64 && npm publish --access public"
echo "   cd packages/linux-x64 && npm publish --access public"
echo "   cd packages/linux-arm64 && npm publish --access public"
echo "   cd packages/win32-x64 && npm publish --access public"
echo ""
echo "2. 然后发布主包:"
echo "   npm publish --access public"
