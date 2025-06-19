const fs = require('fs');
const path = require('path');
const os = require('os');

function makeExecutable(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.chmodSync(filePath, '755');
      console.log(`设置可执行权限: ${filePath}`);
    } catch (error) {
      console.warn(`设置权限失败: ${error.message}`);
    }
  }
}

function setupBinaries() {
  const platform = os.platform();
  const arch = os.arch();

  // 映射平台和架构
  const platformMap = {
    'darwin': 'darwin',
    'linux': 'linux',
    'win32': 'win32'
  };

  const archMap = {
    'x64': 'x64',
    'arm64': 'arm64'
  };

  const mappedPlatform = platformMap[platform];
  const mappedArch = archMap[arch];

  if (!mappedPlatform || !mappedArch) {
    console.warn(`不支持的平台: ${platform}-${arch}`);
    return;
  }

  const packageName = `@winner-fed/go-deploy-${mappedPlatform}-${mappedArch}`;
  const binaryName = platform === 'win32' ? 'go-deploy.exe' : 'go-deploy';

  try {
    // 尝试找到平台特定的二进制文件
    const binaryPath = require.resolve(`${packageName}/bin/${binaryName}`);

    if (platform !== 'win32') {
      makeExecutable(binaryPath);
    }

    console.log(`go-deploy 安装完成，平台: ${mappedPlatform}-${mappedArch}`);

  } catch (error) {
    console.warn(`找不到平台特定的二进制文件: ${error.message}`);

    // 尝试设置本地二进制文件权限
    const localBinaryPath = path.join(__dirname, '..', 'bin', `${mappedPlatform}-${mappedArch}`, binaryName);
    if (fs.existsSync(localBinaryPath) && platform !== 'win32') {
      makeExecutable(localBinaryPath);
    }
  }
}

// 设置主命令行工具权限
const mainBinPath = path.join(__dirname, '..', 'bin', 'go-deploy.js');
if (fs.existsSync(mainBinPath) && os.platform() !== 'win32') {
  makeExecutable(mainBinPath);
}

setupBinaries();
