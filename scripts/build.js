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

async function buildAll() {
  console.log('开始构建多平台二进制文件...\n');

  try {
    // 清理 bin 目录
    await fs.remove('bin');

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

    const packageName = `@winner-fed/deploy-${mappedPlatform}-${mappedArch}`;
    const packageDir = path.join('packages', `${mappedPlatform}-${mappedArch}`);

    // 创建包目录
    await fs.ensureDir(packageDir);
    await fs.ensureDir(path.join(packageDir, 'bin'));

    // 复制二进制文件
    const binaryName = `go-deploy${suffix}`;
    const sourcePath = path.join('bin', `${mappedPlatform}-${mappedArch}`, binaryName);
    const targetPath = path.join(packageDir, 'bin', binaryName);

    await fs.copy(sourcePath, targetPath);

    // 创建 package.json
    const packageJson = {
      name: packageName,
      version: '1.0.0',
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