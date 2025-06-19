# Go-Deploy 使用示例

这个示例展示了如何使用 `@winner-fed/go-deploy` 进行自动化部署。

## 📋 目录结构

```
example/
├── package.json          # 项目配置和脚本
├── config.json           # 部署配置文件
├── deploy-example.js     # JavaScript API 使用示例
├── test-example.js       # 功能测试脚本
├── setup-example.js      # 测试环境设置脚本
├── test-files/           # 测试文件目录（运行 setup 后创建）
└── README.md            # 本文件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd example
npm install
```

### 2. 设置测试环境

```bash
npm run setup
```

这将创建测试文件和目录结构，用于演示部署功能。

### 3. 运行功能测试

```bash
npm run test
```

执行各种功能测试，验证 go-deploy 是否正常工作。

### 4. 查看API示例

```bash
npm start
```

或者：

```bash
node deploy-example.js
```

这将展示如何在 JavaScript 代码中使用 go-deploy。

## 📝 可用脚本

| 脚本命令 | 描述 |
|---------|------|
| `npm run setup` | 创建测试环境和文件 |
| `npm run test` | 执行功能测试 |
| `npm start` | 运行 API 使用示例 |
| `npm run deploy` | 使用默认配置执行部署 |
| `npm run deploy:prod` | 使用生产配置执行部署 |
| `npm run deploy:test` | 使用测试配置执行部署 |

## ⚙️ 配置文件说明

### config.json 结构

```json
{
  "server": {
    "host": "服务器地址",
    "port": 22,
    "username": "用户名",
    "password": "密码",
    "timeout": 10
  },
  "paths": {
    "local": "./test-files",
    "remote": "/目标/路径"
  },
  "options": {
    "backup": true,
    "backup_suffix": ".backup",
    "exclude_patterns": ["*.log", "*.tmp", ".DS_Store"],
    "max_retries": 3,
    "chunk_size": 1048576
  }
}
```

### 配置项说明

#### server 配置
- `host`: 服务器 IP 地址或域名
- `port`: SSH 端口（默认 22）
- `username`: SSH 用户名
- `password`: SSH 密码
- `timeout`: 连接超时时间（秒）

#### paths 配置
- `local`: 本地文件路径（相对于配置文件位置）
- `remote`: 远程服务器路径（绝对路径）

#### options 配置
- `backup`: 是否创建备份
- `backup_suffix`: 备份文件后缀
- `exclude_patterns`: 排除文件模式（支持通配符）
- `max_retries`: 最大重试次数
- `chunk_size`: 文件传输块大小

## 🔧 JavaScript API 使用

### 基本用法

```javascript
const { deploy, getVersion, checkBinary } = require('@winner-fed/go-deploy');

// 检查二进制文件
const isAvailable = checkBinary();

// 获取版本
const version = await getVersion();

// 执行部署
await deploy({
  config: './config.json'
});
```

### 高级用法

```javascript
// 带参数的部署
await deploy({
  config: './config.json',
  cwd: process.cwd(),
  silent: false
});

// 静默模式获取输出
const result = await deploy({
  config: './config.json',
  silent: true
});
console.log(result.stdout);
```

## 🧪 测试功能

测试脚本会验证以下功能：

1. ✅ 二进制文件可用性
2. ✅ 版本信息获取
3. ✅ 帮助信息显示
4. ✅ 配置文件验证
5. ✅ 文件过滤功能
6. ⚠️ 连接测试（需要真实服务器）

## 🛠️ 故障排除

### 常见问题

1. **二进制文件不可用**
   - 确保安装了 `@winner-fed/go-deploy`
   - 检查是否安装了对应平台的二进制包

2. **配置文件错误**
   - 检查 JSON 格式是否正确
   - 验证所有必需字段是否存在

3. **连接失败**
   - 检查服务器地址和端口
   - 确认用户名和密码正确
   - 验证网络连接

4. **权限问题**
   - 确保远程路径存在
   - 检查用户是否有写入权限

### 调试技巧

1. 使用 `npm run test` 运行全面测试
2. 检查配置文件格式：
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('./config.json')))"
   ```
3. 测试服务器连接：
   ```bash
   ssh username@server-host
   ```

## 📚 更多示例

### 1. 部署到多个环境

创建不同的配置文件：
- `config.dev.json` - 开发环境
- `config.prod.json` - 生产环境

```bash
go-deploy --config config.dev.json
go-deploy --config config.prod.json
```

### 2. 集成到 CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Deploy
  run: |
    npm install @winner-fed/go-deploy
    go-deploy --config deploy-config.json
```

### 3. 使用环境变量

```javascript
const config = {
  server: {
    host: process.env.DEPLOY_HOST,
    username: process.env.DEPLOY_USER,
    password: process.env.DEPLOY_PASS,
    port: 22,
    timeout: 10
  },
  // ... 其他配置
};
```

## 🔗 相关链接

- [Go-Deploy 主页](https://github.com/cklwblove/go-deploy)
- [NPM 包](https://www.npmjs.com/package/@winner-fed/go-deploy)
- [问题反馈](https://github.com/cklwblove/go-deploy/issues)

## �� 许可证

MIT License 
