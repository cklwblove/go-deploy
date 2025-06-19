# Go 项目 npm 包装器方案总结

本文档总结了如何将 `go-deploy` 项目包装成类似 esbuild 的 npm 包，使用预编译二进制文件 + npm 包装器的方式。

## 🏗️ 架构设计

**核心思想**：预编译多平台二进制文件 + JavaScript 包装器 + 可选依赖机制

```
go-deploy/
├── main.go                # Go 源代码
├── package.json          # 主 npm 包
├── lib/index.js          # JavaScript API
├── bin/go-deploy.js      # 命令行包装器
├── scripts/
│   ├── build.js          # 多平台构建脚本
│   └── postinstall.js    # 安装后处理
├── packages/             # 平台特定包（自动生成）
│   ├── darwin-x64/
│   ├── darwin-arm64/
│   ├── linux-x64/
│   ├── linux-arm64/
│   └── win32-x64/
└── bin/                  # 编译后的二进制文件
    ├── darwin-x64/go-deploy
    ├── darwin-arm64/go-deploy
    ├── linux-x64/go-deploy
    ├── linux-arm64/go-deploy
    └── win32-x64/go-deploy.exe
```

## 🔧 核心技术点

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

## 📦 使用方式

### 命令行使用

```bash
# 全局安装
npm install -g go-deploy

# 使用
go-deploy --config config.json
go-deploy --help
go-deploy --version
```

### JavaScript API 使用

```javascript
const { deploy, getVersion, checkBinary } = require('go-deploy');

// 检查可用性
console.log('可用:', checkBinary());

// 获取版本
const version = await getVersion();

// 执行部署
await deploy({
  config: './config.json',
  cwd: process.cwd(),
  silent: false
});
```

### package.json 脚本

```json
{
  "scripts": {
    "deploy": "go-deploy --config prod.json",
    "deploy:test": "go-deploy --config test.json"
  }
}
```

## 🚀 构建和发布流程

### 1. 构建多平台二进制文件

```bash
npm run build
```

这会创建以下二进制文件：

- `bin/darwin-x64/go-deploy`
- `bin/darwin-arm64/go-deploy`
- `bin/linux-x64/go-deploy`
- `bin/linux-arm64/go-deploy`
- `bin/win32-x64/go-deploy.exe`

### 2. 测试功能

```bash
npm test
```

### 3. 发布包

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

## ✅ 优势对比

| 特性               | 传统方式     | npm 包装器方式          |
| ------------------ | ------------ | ----------------------- |
| **安装依赖** | 需要 Go 环境 | 零依赖安装              |
| **跨平台**   | 手动编译     | 自动选择                |
| **包大小**   | N/A          | 只下载当前平台          |
| **使用方式** | 单一命令行   | 命令行 + JavaScript API |
| **集成性**   | 需要外部调用 | 原生 Node.js 集成       |

## 🎯 实际测试结果

测试结果显示：

1. ✅ **多平台构建成功** - 生成了 5 个平台的二进制文件
2. ✅ **JavaScript API 工作正常** - 可以检测平台、获取版本、执行命令
3. ✅ **命令行工具可用** - 支持 `--help`、`--version`、`--config` 参数
4. ✅ **包结构正确** - 平台特定包已正确生成

## 📋 发布前检查清单

- [X] 所有平台的二进制文件都已构建
- [X] JavaScript API 测试通过
- [X] 命令行工具测试通过
- [X] 平台特定包结构正确
- [X] 示例代码可正常运行
- [X] 文档完整
- [X] 版本号已更新
- [X] README 文档完整
- [X] .npmignore 配置正确

## 🔄 与 esbuild 的相似性

| 特性           | esbuild    | go-deploy  |
| -------------- | ---------- | ---------- |
| 核心语言       | Go         | Go         |
| 包装方式       | npm 包     | npm 包     |
| 二进制分发     | 平台特定包 | 平台特定包 |
| 命令行工具     | ✅         | ✅         |
| JavaScript API | ✅         | ✅         |
| 可选依赖       | ✅         | ✅         |
| 静态编译       | ✅         | ✅         |
| 零依赖安装     | ✅         | ✅         |

## 🛠️ 故障排除

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

## 📚 相关文档

- [HOWTO-npm.md](./HOWTO-npm.md) - 详细实施指南
- [README-npm.md](./README-npm.md) - npm 包使用文档
- [example/](./example/) - 使用示例代码

## 🎉 结论

通过这种方式，Go 项目可以像 esbuild 一样方便地被 JavaScript 生态系统使用，用户可以：

1. **零依赖安装** - 无需安装 Go 环境
2. **快速使用** - npm 一键安装即可使用
3. **双重接口** - 同时支持命令行和 JavaScript API
4. **性能优势** - 保持 Go 的高性能特性
5. **无缝集成** - 与现有 Node.js 项目完美集成

这种架构让 Go 工具能够享受到 npm 生态系统的便利性，同时保持了 Go 语言的性能优势。
