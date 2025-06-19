# @winner-fed/go-deploy

基于 Go 的自动化部署工具 - 通过 SFTP 协议将本地文件上传到远程服务器

[![npm version](https://badge.fury.io/js/@winner-fed%2Fgo-deploy.svg)](https://www.npmjs.com/package/@winner-fed/go-deploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/cklwblove/go-deploy/workflows/Node.js%20CI/badge.svg)](https://github.com/cklwblove/go-deploy/actions)

## ✨ 特性

- 🚀 **零依赖安装** - 使用预编译的 Go 二进制文件，无需安装 Go 环境
- 🌍 **跨平台支持** - 支持 macOS (Intel/Apple Silicon)、Linux (x64/ARM64)、Windows (x64)
- 🔧 **双重接口** - 同时提供命令行工具和 JavaScript API
- ⚡ **高性能** - 基于 Go 语言，传输速度快，资源占用低
- 🛡️ **安全传输** - 使用 SFTP 协议，基于 SSH 加密传输
- 📁 **目录同步** - 递归上传整个目录结构，保持文件层级
- 🔄 **智能重试** - 支持上传失败自动重试机制
- 📋 **文件排除** - 支持通配符模式排除不需要上传的文件
- 💾 **自动备份** - 上传前可自动备份远程现有文件
- 📊 **详细统计** - 显示上传文件数、传输大小、耗时和速度

## 📦 安装

### npm 安装

```bash
npm install @winner-fed/go-deploy
```

### 全局安装

```bash
npm install -g @winner-fed/go-deploy
```

### yarn 安装

```bash
yarn add @winner-fed/go-deploy
```

## 🚀 快速开始

### 1. 创建配置文件

创建 `config.json` 文件：

```json
{
  "server": {
    "host": "your-server-ip",
    "port": 22,
    "username": "your-username",
    "password": "your-password",
    "timeout": 10
  },
  "paths": {
    "local": "./dist",
    "remote": "/opt/your-app/dist"
  },
  "options": {
    "backup": true,
    "backup_suffix": ".backup",
    "exclude_patterns": [
      "*.log",
      "*.map",
      ".DS_Store",
      "node_modules"
    ],
    "max_retries": 3,
    "chunk_size": 1048576
  }
}
```

### 2. 命令行使用

```bash
# 使用默认配置文件 config.json
go-deploy

# 使用指定配置文件
go-deploy --config prod.json

# 显示帮助信息
go-deploy --help

# 显示版本信息
go-deploy --version
```

### 3. JavaScript API 使用

```javascript
const { deploy } = require('@winner-fed/go-deploy');

async function deployApp() {
  try {
    await deploy({
      config: './config.json'
    });
    console.log('部署成功！');
  } catch (error) {
    console.error('部署失败:', error.message);
  }
}

deployApp();
```

## 📖 API 文档

### 导入模块

```javascript
const { 
  deploy, 
  getVersion, 
  checkBinary, 
  getBinaryPath 
} = require('@winner-fed/go-deploy');
```

### deploy(options)

执行部署操作。

**参数:**

- `options` (Object): 部署选项
  - `config` (string): 配置文件路径
  - `cwd` (string): 工作目录，默认为 `process.cwd()`
  - `silent` (boolean): 静默模式，默认为 `false`
  - `help` (boolean): 显示帮助信息
  - `version` (boolean): 显示版本信息

**返回值:** Promise`<Object>`

- `code` (number): 退出代码
- `stdout` (string): 标准输出
- `stderr` (string): 标准错误

**示例:**

```javascript
// 基本使用
await deploy({ config: './config.json' });

// 静默模式
const result = await deploy({ 
  config: './config.json', 
  silent: true 
});
console.log(result.stdout);

// 指定工作目录
await deploy({ 
  config: './config.json', 
  cwd: '/path/to/project' 
});
```

### getVersion()

获取 go-deploy 版本信息。

**返回值:** Promise`<string>` - 版本信息

**示例:**

```javascript
const version = await getVersion();
console.log('版本:', version);
```

### checkBinary()

检查二进制文件是否可用。

**返回值:** boolean - 是否可用

**示例:**

```javascript
const isAvailable = checkBinary();
if (!isAvailable) {
  console.error('go-deploy 二进制文件不可用');
}
```

### getBinaryPath()

获取当前平台对应的二进制文件路径。

**返回值:** string - 二进制文件路径

**示例:**

```javascript
try {
  const binaryPath = getBinaryPath();
  console.log('二进制文件路径:', binaryPath);
} catch (error) {
  console.error('获取二进制文件路径失败:', error.message);
}
```

## 🔧 配置文件详解

### server 配置

| 字段     | 类型   | 必填 | 默认值 | 说明                         |
| -------- | ------ | ---- | ------ | ---------------------------- |
| host     | string | ✅   | -      | SSH 服务器地址               |
| port     | number | ❌   | 22     | SSH 端口                     |
| username | string | ✅   | -      | SSH 用户名                   |
| password | string | ✅   | -      | SSH 密码（建议使用密钥认证） |
| timeout  | number | ❌   | 10     | 连接超时时间（秒）           |

### paths 配置

| 字段   | 类型   | 必填 | 默认值 | 说明                               |
| ------ | ------ | ---- | ------ | ---------------------------------- |
| local  | string | ✅   | -      | 本地目录路径（支持相对和绝对路径） |
| remote | string | ✅   | -      | 远程目录路径（必须是绝对路径）     |

### options 配置

| 字段             | 类型     | 必填 | 默认值  | 说明                         |
| ---------------- | -------- | ---- | ------- | ---------------------------- |
| backup           | boolean  | ❌   | false   | 是否在上传前备份远程现有文件 |
| backup_suffix    | string   | ❌   | .backup | 备份文件的后缀名             |
| exclude_patterns | string[] | ❌   | []      | 文件排除模式（支持通配符）   |
| max_retries      | number   | ❌   | 3       | 上传失败时的最大重试次数     |
| chunk_size       | number   | ❌   | 1048576 | 文件传输块大小（字节）       |

### 配置文件示例

```json
{
  "server": {
    "host": "192.168.1.100",
    "port": 22,
    "username": "deployer",
    "password": "your-secure-password",
    "timeout": 30
  },
  "paths": {
    "local": "./build",
    "remote": "/var/www/html"
  },
  "options": {
    "backup": true,
    "backup_suffix": ".bak",
    "exclude_patterns": [
      "*.log",
      "*.map",
      ".DS_Store",
      "node_modules",
      "*.tmp"
    ],
    "max_retries": 5,
    "chunk_size": 2097152
  }
}
```

## 🛠️ 在项目中使用

### package.json 脚本

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "deploy": "npm run build && go-deploy",
    "deploy:prod": "npm run build && go-deploy --config prod.json",
    "deploy:test": "npm run build && go-deploy --config test.json",
    "deploy:staging": "npm run build && go-deploy --config staging.json"
  }
}
```

### 多环境配置

创建不同环境的配置文件：

```
config/
├── prod.json      # 生产环境
├── test.json      # 测试环境
└── staging.json   # 预发布环境
```

### CI/CD 集成

#### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
  
    steps:
    - uses: actions/checkout@v3
  
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
      
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      run: npx @winner-fed/go-deploy --config config/prod.json
```

#### 环境变量支持

可以通过环境变量动态替换配置：

```javascript
const { deploy } = require('@winner-fed/go-deploy');
const fs = require('fs');

// 读取配置模板
const configTemplate = JSON.parse(fs.readFileSync('config.template.json', 'utf8'));

// 使用环境变量替换
const config = {
  ...configTemplate,
  server: {
    ...configTemplate.server,
    host: process.env.DEPLOY_HOST || configTemplate.server.host,
    username: process.env.DEPLOY_USER || configTemplate.server.username,
    password: process.env.DEPLOY_PASSWORD || configTemplate.server.password
  }
};

// 写入临时配置文件
fs.writeFileSync('config.temp.json', JSON.stringify(config, null, 2));

// 执行部署
await deploy({ config: 'config.temp.json' });

// 清理临时文件
fs.unlinkSync('config.temp.json');
```

## 🌍 支持的平台

| 操作系统 | 架构  | 状态 | 二进制包                           |
| -------- | ----- | ---- | ---------------------------------- |
| macOS    | x64   | ✅   | @winner-fed/go-deploy-darwin-x64   |
| macOS    | ARM64 | ✅   | @winner-fed/go-deploy-darwin-arm64 |
| Linux    | x64   | ✅   | @winner-fed/go-deploy-linux-x64    |
| Linux    | ARM64 | ✅   | @winner-fed/go-deploy-linux-arm64  |
| Windows  | x64   | ✅   | @winner-fed/go-deploy-win32-x64    |

## 🔍 错误处理

### 常见错误类型

```javascript
const { deploy } = require('@winner-fed/go-deploy');

try {
  await deploy({ config: './config.json' });
} catch (error) {
  if (error.message.includes('找不到')) {
    console.error('❌ 二进制文件不可用，请检查安装');
    console.error('尝试重新安装: npm install @winner-fed/go-deploy');
  } else if (error.message.includes('配置文件')) {
    console.error('❌ 配置文件错误，请检查配置');
    console.error('配置文件路径:', path.resolve('./config.json'));
  } else if (error.message.includes('连接')) {
    console.error('❌ 服务器连接失败，请检查网络和服务器配置');
  } else if (error.message.includes('权限')) {
    console.error('❌ 权限不足，请检查用户权限和目录权限');
  } else {
    console.error('❌ 部署失败:', error.message);
  }
}
```

### 调试模式

```javascript
const { deploy } = require('@winner-fed/go-deploy');

// 启用详细输出
await deploy({ 
  config: './config.json',
  silent: false  // 显示详细的部署过程
});
```

## 🧪 开发和测试

### 本地开发

```bash
# 克隆项目
git clone https://github.com/cklwblove/go-deploy.git
cd go-deploy

# 安装依赖
npm install

# 构建二进制文件
npm run build

# 运行测试
npm test
```

### 构建多平台二进制文件

```bash
# 构建所有平台
npm run build

# 查看构建结果
ls bin/
```

### 测试本地包

```bash
# 在项目目录中
npm link

# 在其他项目中测试
npm link @winner-fed/go-deploy
```

## 📈 性能和限制

### 性能数据

- **传输速度**: 取决于网络带宽，通常可达到网络上限的 80-90%
- **内存占用**: 约 10-20MB（静态编译的 Go 二进制文件）
- **并发连接**: 支持单连接多文件传输
- **文件大小限制**: 无硬性限制，受可用内存影响

### 使用限制

- **Node.js 版本**: >= 14.0.0
- **网络要求**: 需要稳定的网络连接
- **服务器要求**: 目标服务器需支持 SSH/SFTP 协议
- **权限要求**: 需要对目标目录有写入权限

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 代码风格遵循 ESLint 配置
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/)
- 新功能需要添加对应的测试用例
- 更新文档说明

## 📄 更新日志

### v1.0.0

- 🎉 初始版本发布
- ✨ 支持 SFTP 文件上传
- ✨ 支持多平台二进制文件
- ✨ 提供命令行和 JavaScript API
- ✨ 支持文件排除和自动备份
- ✨ 支持上传重试机制

## 📞 支持和反馈

- **GitHub Issues**: [提交问题](https://github.com/cklwblove/go-deploy/issues)

## 📋 FAQ

### Q: 如何处理大文件上传？

A: 工具会自动分块传输，通过 `chunk_size` 配置项可以调整块大小，默认 1MB。

### Q: 支持断点续传吗？

A: 当前版本不支持断点续传，如果传输中断需要重新开始。

### Q: 如何使用 SSH 密钥认证？

A: 当前版本主要支持密码认证，SSH 密钥认证功能在开发计划中。

### Q: 可以同时上传到多个服务器吗？

A: 当前版本不支持，需要分别配置和执行多次部署。

## 🔗 相关链接

- [项目主页](https://github.com/cklwblove/go-deploy)
- [npm 包页面](https://www.npmjs.com/package/@winner-fed/go-deploy)
- [问题反馈](https://github.com/cklwblove/go-deploy/issues)
- [贡献指南](https://github.com/cklwblove/go-deploy/blob/main/CONTRIBUTING.md)

## 📜 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️ Star！**

Made with ❤️ by [cklwblove](https://github.com/cklwblove)

</div>
