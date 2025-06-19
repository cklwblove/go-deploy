# 如何将 Go 项目包装成 npm 包

本指南展示如何将你的 `go-deploy` 项目包装成类似 esbuild 的 npm 包，使用预编译二进制文件 + npm 包装器的方式。

## 架构概述

```
go-deploy/
├── main.go                    # Go 源代码
├── package.json              # 主 npm 包配置
├── lib/index.js              # JavaScript API 接口
├── bin/go-deploy             # 命令行包装器
├── scripts/
│   ├── build.js              # 构建脚本
│   └── postinstall.js        # 安装后处理
├── packages/                 # 平台特定的包（自动生成）
│   ├── darwin-x64/
│   ├── darwin-arm64/
│   ├── linux-x64/
│   ├── linux-arm64/
│   └── win32-x64/
└── bin/                      # 编译后的二进制文件（自动生成）
    ├── darwin-x64/
    ├── darwin-arm64/
    ├── linux-x64/
    ├── linux-arm64/
    └── win32-x64/
```

## 实施步骤

### 步骤 1: 初始化 npm 项目

```bash
# 安装开发依赖
npm install --save-dev fs-extra
```

### 步骤 2: 构建多平台二进制文件

```bash
# 执行构建脚本
npm run build

# 或者手动构建
node scripts/build.js
```

这会创建以下二进制文件：
- `bin/darwin-x64/go-deploy`
- `bin/darwin-arm64/go-deploy`
- `bin/linux-x64/go-deploy`
- `bin/linux-arm64/go-deploy`
- `bin/win32-x64/go-deploy.exe`

### 步骤 3: 测试本地功能

```bash
# 运行测试
npm test

# 或者手动测试
node test/test.js
```

### 步骤 4: 发布包

#### 方法 1: 使用自动脚本

```bash
# 构建并发布
./build-npm.sh --publish
```

#### 方法 2: 手动发布

```bash
# 1. 首先发布所有平台特定的包
cd packages/darwin-x64 && npm publish --access public
cd ../darwin-arm64 && npm publish --access public
cd ../linux-x64 && npm publish --access public
cd ../linux-arm64 && npm publish --access public
cd ../win32-x64 && npm publish --access public

# 2. 然后发布主包
cd ../..
npm publish --access public
```

## 关键技术点

### 1. 平台检测和二进制选择

```javascript
// lib/index.js 中的关键逻辑
function getBinaryPath() {
  const platform = os.platform();
  const arch = os.arch();
  
  // 平台映射
  const platformMap = {
    'darwin': 'darwin',
    'linux': 'linux',
    'win32': 'win32'
  };
  
  const archMap = {
    'x64': 'x64',
    'arm64': 'arm64'
  };
  
  // 尝试从可选依赖中找到二进制文件
  const packageName = `@winner-fed/go-deploy-${mappedPlatform}-${mappedArch}`;
  const binaryPath = require.resolve(`${packageName}/bin/${binaryName}`);
  
  return binaryPath;
}
```

### 2. 可选依赖机制

主包的 `package.json` 使用 `optionalDependencies` 来引用平台特定的包：

```json
{
  "optionalDependencies": {
    "@winner-fed/go-deploy-darwin-x64": "1.0.0",
    "@winner-fed/go-deploy-darwin-arm64": "1.0.0",
    "@winner-fed/go-deploy-linux-x64": "1.0.0",
    "@winner-fed/go-deploy-linux-arm64": "1.0.0",
    "@winner-fed/go-deploy-win32-x64": "1.0.0"
  }
}
```

npm 会自动只安装当前平台适用的可选依赖。

### 3. 静态编译

构建时使用 `CGO_ENABLED=0` 来生成静态二进制文件：

```javascript
const child = spawn('go', ['build', '-o', outputPath, 'main.go'], {
  env: {
    ...process.env,
    GOOS: goos,
    GOARCH: goarch,
    CGO_ENABLED: '0'  // 重要：生成静态二进制文件
  }
});
```

## 使用方式

### 命令行使用

```bash
# 全局安装
npm install -g go-deploy

# 使用
go-deploy --config config.json
```

### JavaScript API 使用

```javascript
const { deploy } = require('go-deploy');

await deploy({
  config: './config.json'
});
```

### 在 package.json 中使用

```json
{
  "scripts": {
    "deploy": "go-deploy --config prod.json"
  }
}
```

## 优势

1. **零依赖**: 用户不需要安装 Go 环境
2. **快速安装**: 只下载当前平台的二进制文件
3. **跨平台**: 支持多种操作系统和架构
4. **双接口**: 同时提供命令行和 JavaScript API
5. **自动化**: 通过脚本自动化构建和发布流程

## 与 esbuild 的相似性

| 特性 | esbuild | go-deploy |
|------|---------|-----------|
| 核心语言 | Go | Go |
| 包装方式 | npm 包 | npm 包 |
| 二进制分发 | 平台特定包 | 平台特定包 |
| 命令行工具 | ✅ | ✅ |
| JavaScript API | ✅ | ✅ |
| 可选依赖 | ✅ | ✅ |

## 发包清单

发布前确保：

- [ ] 所有平台的二进制文件都已构建
- [ ] 测试通过
- [ ] 版本号已更新
- [ ] README 文档完整
- [ ] .npmignore 配置正确
- [ ] 首次发布需要先发布平台特定的包，然后发布主包

## 故障排除

### 二进制文件不可执行

```bash
# 设置权限
chmod +x bin/*/go-deploy*
```

### 找不到平台特定的包

```bash
# 检查可选依赖是否正确安装
npm ls --depth=0
```

### 构建失败

```bash
# 检查 Go 环境
go version

# 检查依赖
go mod tidy
```

这种方式让你的 Go 工具可以像 esbuild 一样方便地被 JavaScript 项目使用，同时保持了 Go 的性能优势。 
