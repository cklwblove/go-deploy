/**
 * 构建步骤：
 * 为每个平台编译 Go 二进制文件
*  将编译结果放到 bin/{platform}/go-deploy 路径下
*  然后再复制到对应的 packages/{platform}/bin/ 目录
*
* 这种结构的目的：
* bin/ 目录作为构建过程的中间输出，作为构建产物的统一存放地
* 最终发布时，每个平台的二进制文件会被打包到对应的 packages/{platform} 目录中
* 这样可以创建多个平台特定的 npm 包
*
* 分发策略：
* 每个平台需要单独的 npm 包，因为：
* 不同平台的二进制文件不兼容
* npm 的 optionalDependencies 机制会根据用户的平台自动选择合适的包
* 这样可以减少用户下载不需要的平台文件，减少包体积
类似 esbuild 的架构：
主包：@winner-fed/go-deploy（只包含 JavaScript 代码）
平台包：@winner-fed/go-deploy-darwin-arm64 等（包含对应平台的二进制文件）

总结：
* bin 目录下的各个平台子目录是构建过程的中间产物，用于：
* 统一构建管理：所有平台的二进制文件都先生成到 bin/ 下
* 后续分发：再从这里复制到各个 packages/{platform}/bin/ 目录
* 发布策略：最终用户只会安装主包 + 一个对应平台的包，而不是所有平台的文件
* 这种设计的好处：
* ✅ 用户下载量小（只获取需要的平台）
* ✅ 构建过程清晰（先统一构建，再分发）
* ✅ 符合 npm 生态的最佳实践
* ✅ 类似 esbuild, swc 等知名工具的架构
*/

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// 支持的平台和架构组合
const targets = [
  { os: 'darwin', arch: 'amd64', suffix: '' },
  { os: 'darwin', arch: 'arm64', suffix: '' },
  { os: 'linux', arch: 'amd64', suffix: '' },
  { os: 'linux', arch: 'arm64', suffix: '' },
  { os: 'windows', arch: 'amd64', suffix: '.exe' }
];

// 平台映射
const platformMap = {
  'darwin': 'darwin',
  'linux': 'linux',
  'windows': 'win32'
};

const archMap = {
  'amd64': 'x64',
  'arm64': 'arm64'
};

async function buildBinary(target) {
  const { os: goos, arch: goarch, suffix } = target;
  const mappedPlatform = platformMap[goos];
  const mappedArch = archMap[goarch];

  const outputName = `go-deploy${suffix}`;
  const outputDir = path.join('bin', `${mappedPlatform}-${mappedArch}`);
  const outputPath = path.join(outputDir, outputName);

  // 确保输出目录存在
  await fs.ensureDir(outputDir);

  console.log(`构建 ${goos}/${goarch}...`);

  return new Promise((resolve, reject) => {
    const child = spawn('go', ['build', '-o', outputPath, 'main.go'], {
      env: {
        ...process.env,
        GOOS: goos,
        GOARCH: goarch,
        CGO_ENABLED: '0' // 禁用 CGO 以获得静态二进制文件
      },
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ 构建完成: ${outputPath}`);
        resolve();
      } else {
        reject(new Error(`构建失败: ${goos}/${goarch}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`构建错误: ${error.message}`));
    });
  });
}

async function cleanBinDirectory() {
  // 只清理平台相关的子目录，保留 bin/go-deploy.js
  const platformDirs = targets.map(target => {
    const mappedPlatform = platformMap[target.os];
    const mappedArch = archMap[target.arch];
    return `${mappedPlatform}-${mappedArch}`;
  });

  for (const dir of platformDirs) {
    const platformDir = path.join('bin', dir);
    if (await fs.pathExists(platformDir)) {
      await fs.remove(platformDir);
      console.log(`清理目录: ${platformDir}`);
    }
  }
}

async function buildAll() {
  console.log('开始构建多平台二进制文件...\n');

  try {
    // 清理 bin 目录下的平台子目录，但保留 bin/go-deploy.js
    await cleanBinDirectory();

    // 并行构建所有目标
    await Promise.all(targets.map(buildBinary));

    console.log('\n✓ 所有平台构建完成！');

    // 创建平台特定的包
    await createPlatformPackages();

  } catch (error) {
    console.error('构建失败:', error.message);
    process.exit(1);
  }
}

async function createPlatformPackages() {
  console.log('\n创建平台特定的包...');

  for (const target of targets) {
    const { os: goos, arch: goarch, suffix } = target;
    const mappedPlatform = platformMap[goos];
    const mappedArch = archMap[goarch];

    const packageName = `@winner-fed/go-deploy-${mappedPlatform}-${mappedArch}`;
    const packageDir = path.join('packages', `${mappedPlatform}-${mappedArch}`);

    // 创建包目录
    await fs.ensureDir(packageDir);
    await fs.ensureDir(path.join(packageDir, 'bin'));

    // 复制二进制文件
    const binaryName = `go-deploy${suffix}`;
    const sourcePath = path.join('bin', `${mappedPlatform}-${mappedArch}`, binaryName);
    const targetPath = path.join(packageDir, 'bin', binaryName);

    await fs.copy(sourcePath, targetPath);

    // 设置执行权限（非 Windows 系统）
    if (mappedPlatform !== 'win32') {
      await fs.chmod(targetPath, '755');
    }

    // 读取主包的版本号
    const mainPackageJson = await fs.readJson('package.json');
    const version = mainPackageJson.version;

    // 创建 package.json
    const packageJson = {
      name: packageName,
      version: version,
      description: `go-deploy 二进制文件 (${mappedPlatform}-${mappedArch})`,
      main: 'index.js',
      os: [mappedPlatform],
      cpu: [mappedArch],
      repository: {
        type: 'git',
        url: 'git+https://github.com/cklwblove/go-deploy.git'
      },
      license: 'MIT'
    };

    await fs.writeJson(path.join(packageDir, 'package.json'), packageJson, { spaces: 2 });

    // 创建简单的 index.js
    const indexJs = `module.exports = require.resolve('./bin/go-deploy${suffix}');`;
    await fs.writeFile(path.join(packageDir, 'index.js'), indexJs);

    console.log(`✓ 创建包: ${packageName}`);
  }
}

// 运行构建
buildAll();
