const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取平台特定的二进制文件路径
function getBinaryPath() {
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
    throw new Error(`不支持的平台: ${platform}-${arch}`);
  }

  const packageName = `@winner-fed/deploy-${mappedPlatform}-${mappedArch}`;
  const binaryName = platform === 'win32' ? 'go-deploy.exe' : 'go-deploy';

  try {
    // 尝试从可选依赖中找到二进制文件
    const binaryPath = require.resolve(`${packageName}/bin/${binaryName}`);
    return binaryPath;
  } catch (error) {
    // 如果找不到可选依赖，尝试从本地 bin 目录
    const localBinaryPath = path.join(__dirname, '..', 'bin', `${mappedPlatform}-${mappedArch}`, binaryName);
    if (fs.existsSync(localBinaryPath)) {
      return localBinaryPath;
    }

    throw new Error(`找不到适用于 ${platform}-${arch} 的 go-deploy 二进制文件`);
  }
}

// 执行 go-deploy 命令
function deploy(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const binaryPath = getBinaryPath();
      const args = [];

      // 处理配置文件参数
      if (options.config) {
        args.push('--config', options.config);
      }

      // 处理其他参数
      if (options.help) {
        args.push('--help');
      }

      if (options.version) {
        args.push('--version');
      }

      const child = spawn(binaryPath, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: options.cwd || process.cwd()
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            code,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        } else {
          reject(new Error(`go-deploy 执行失败，退出代码: ${code}\n${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`执行 go-deploy 时出错: ${error.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
}

// 获取版本信息
async function getVersion() {
  try {
    const result = await deploy({ version: true, silent: true });
    return result.stdout;
  } catch (error) {
    throw new Error(`获取版本信息失败: ${error.message}`);
  }
}

// 检查二进制文件是否可用
function checkBinary() {
  try {
    const binaryPath = getBinaryPath();
    return fs.existsSync(binaryPath);
  } catch (error) {
    return false;
  }
}

module.exports = {
  deploy,
  getVersion,
  checkBinary,
  getBinaryPath
};
