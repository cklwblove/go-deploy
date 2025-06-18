# go-deploy

基于 Go 的自动化部署工具 - 通过 SFTP 协议将本地文件上传到远程服务器

## 安装

```bash
npm install go-deploy
```

或者使用全局安装：

```bash
npm install -g go-deploy
```

## 命令行使用

### 基本用法

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

### 配置文件

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

## JavaScript API

### 基本用法

```javascript
const { deploy } = require('go-deploy');

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

### API 选项

```javascript
const { deploy, getVersion, checkBinary } = require('go-deploy');

// 检查二进制文件是否可用
const isAvailable = checkBinary();
console.log('go-deploy 可用:', isAvailable);

// 获取版本信息
const version = await getVersion();
console.log('版本:', version);

// 部署选项
await deploy({
  config: './prod.json',    // 配置文件路径
  cwd: './my-project',      // 工作目录
  silent: true,             // 静默模式
  help: false,              // 显示帮助
  version: false            // 显示版本
});
```

## 在 package.json 中使用

```json
{
  "scripts": {
    "deploy": "go-deploy",
    "deploy:prod": "go-deploy --config prod.json",
    "deploy:test": "go-deploy --config test.json"
  }
}
```

然后运行：

```bash
npm run deploy
npm run deploy:prod
npm run deploy:test
```

## 支持的平台

- macOS (Intel/Apple Silicon)
- Linux (x64/ARM64)
- Windows (x64)

## 特性

- ✅ **零依赖**: 使用预编译的 Go 二进制文件
- ✅ **跨平台**: 支持 macOS、Linux、Windows
- ✅ **自动安装**: 根据平台自动选择正确的二进制文件
- ✅ **JavaScript API**: 可以在 Node.js 代码中调用
- ✅ **命令行工具**: 可以直接在终端使用
- ✅ **配置灵活**: 支持多种配置方式

## 配置项说明

### server 配置

- `host`: SSH 服务器地址
- `port`: SSH 端口，通常为 22
- `username`: SSH 用户名
- `password`: SSH 密码
- `timeout`: 连接超时时间（秒）

### paths 配置

- `local`: 本地目录路径
- `remote`: 远程目录路径

### options 配置

- `backup`: 是否在上传前备份远程文件
- `backup_suffix`: 备份文件后缀
- `exclude_patterns`: 排除文件模式
- `max_retries`: 最大重试次数
- `chunk_size`: 传输块大小

## 错误处理

```javascript
const { deploy } = require('go-deploy');

try {
  await deploy({ config: './config.json' });
} catch (error) {
  if (error.message.includes('找不到')) {
    console.error('二进制文件不可用，请检查安装');
  } else if (error.message.includes('配置文件')) {
    console.error('配置文件错误，请检查配置');
  } else {
    console.error('部署失败:', error.message);
  }
}
```

## 许可证

MIT 
