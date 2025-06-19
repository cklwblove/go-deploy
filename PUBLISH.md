# 发布说明

这个项目包含了一套完整的npm发布脚本，支持自动版本号更新和多平台包发布。

## 脚本说明

### 1. 构建脚本 (`scripts/build.js`)
- 为所有支持的平台构建Go二进制文件
- 创建平台特定的npm包
- 自动同步版本号到所有子包

### 2. 发布脚本 (`scripts/publish.js`)
- 自动更新版本号（patch, minor, major）
- 同步所有包的版本号
- 重新构建二进制文件
- 发布主包和所有平台子包到npm

### 3. 版本检查脚本 (`scripts/version-check.js`)
- 检查主包和所有平台子包的版本一致性
- 验证optionalDependencies的版本引用

## 使用方法

### 基本发布命令

```bash
# 发布补丁版本 (1.0.1 -> 1.0.2)
npm run publish:patch

# 发布次版本 (1.0.1 -> 1.1.0)
npm run publish:minor

# 发布主版本 (1.0.1 -> 2.0.0)
npm run publish:major

# 指定具体版本号
node scripts/publish.js 1.2.3
```

### 测试发布

```bash
# 模拟发布（不会实际发布到npm）
npm run publish:dry

# 或者指定版本的模拟发布
node scripts/publish.js 1.2.3 --dry-run
```

### 版本检查

```bash
# 检查所有包的版本一致性
npm run version:check
```

### 高级选项

```bash
# 发布到指定标签
node scripts/publish.js patch --tag beta

# 跳过构建步骤（适用于已构建的情况）
node scripts/publish.js patch --no-build

# 组合选项
node scripts/publish.js 1.2.3 --tag beta --dry-run
```

## 发布流程

1. **版本更新**: 自动更新主包和所有平台子包的版本号
2. **构建**: 重新构建所有平台的二进制文件
3. **发布**: 依次发布主包和所有平台子包

## 支持的平台

- `darwin-arm64` (macOS Apple Silicon)
- `darwin-x64` (macOS Intel)
- `linux-arm64` (Linux ARM64)
- `linux-x64` (Linux x64)
- `win32-x64` (Windows x64)

## 包结构

```
@winner-fed/go-deploy (主包)
├── @winner-fed/go-deploy-darwin-arm64
├── @winner-fed/go-deploy-darwin-x64
├── @winner-fed/go-deploy-linux-arm64
├── @winner-fed/go-deploy-linux-x64
└── @winner-fed/go-deploy-win32-x64
```

主包通过`optionalDependencies`引用平台特定的包，npm会根据用户的平台自动选择合适的包进行安装。

## 注意事项

1. 确保已登录npm账号：`npm login`
2. 确保有发布权限
3. 建议先使用`--dry-run`参数测试发布流程
4. 发布前可以运行`npm run version:check`检查版本一致性
5. 发布过程中会自动重新构建，确保Go环境正常 
