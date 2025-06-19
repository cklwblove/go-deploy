/**
 * npm 发布脚本
 * 功能：
 * 1. 更新版本号（patch, minor, major 或指定版本）
 * 2. 同时更新主包和所有平台子包的版本号
 * 3. 重新构建二进制文件
 * 4. 发布到 npm
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// 支持的平台组合
const platforms = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'win32-x64'
];

/**
 * 执行命令
 */
function execCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`命令错误: ${error.message}`));
    });
  });
}

/**
 * 获取当前版本号
 */
function getCurrentVersion() {
  const packageJson = fs.readJsonSync('package.json');
  return packageJson.version;
}

/**
 * 更新版本号
 */
function updateVersion(newVersion) {
  const versionRegex = /^\d+\.\d+\.\d+$/;

  if (!versionRegex.test(newVersion)) {
    throw new Error(`无效的版本号格式: ${newVersion}`);
  }

  console.log(`更新版本号: ${getCurrentVersion()} -> ${newVersion}`);

  // 更新主包版本
  const mainPackageJson = fs.readJsonSync('package.json');
  mainPackageJson.version = newVersion;

  // 同时更新 optionalDependencies 中的版本
  for (const dep in mainPackageJson.optionalDependencies) {
    mainPackageJson.optionalDependencies[dep] = `^${newVersion}`;
  }

  fs.writeJsonSync('package.json', mainPackageJson, { spaces: 2 });
  console.log('✓ 更新主包版本');

  // 更新所有平台子包版本
  for (const platform of platforms) {
    const packagePath = path.join('packages', platform, 'package.json');

    if (fs.existsSync(packagePath)) {
      const packageJson = fs.readJsonSync(packagePath);
      packageJson.version = newVersion;
      fs.writeJsonSync(packagePath, packageJson, { spaces: 2 });
      console.log(`✓ 更新 ${platform} 版本`);
    }
  }
}

/**
 * 计算新版本号
 */
function calculateNewVersion(type, customVersion) {
  if (customVersion) {
    return customVersion;
  }

  const currentVersion = getCurrentVersion();
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`无效的版本类型: ${type}`);
  }
}

/**
 * 发布到 npm
 */
async function publishPackages(options = {}) {
  const { dryRun = false, tag = 'latest' } = options;

  console.log('\n开始发布包...');

  const publishArgs = ['publish'];
  if (dryRun) {
    publishArgs.push('--dry-run');
  }
  if (tag !== 'latest') {
    publishArgs.push('--tag', tag);
  }

  try {
    // 发布主包
    console.log('发布主包...');
    await execCommand('npm', publishArgs);
    console.log('✓ 主包发布完成');

    // 发布所有平台子包
    for (const platform of platforms) {
      const packageDir = path.join('packages', platform);

      if (fs.existsSync(packageDir)) {
        console.log(`发布 ${platform} 包...`);
        await execCommand('npm', publishArgs, { cwd: packageDir });
        console.log(`✓ ${platform} 包发布完成`);
      }
    }

    console.log('\n🎉 所有包发布完成！');

  } catch (error) {
    console.error('发布失败:', error.message);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
用法: node scripts/publish.js [选项]

选项:
  patch                 更新补丁版本 (x.y.Z+1)
  minor                 更新次版本 (x.Y+1.0)
  major                 更新主版本 (X+1.0.0)
  <version>             指定版本号 (如: 1.2.3)

额外选项:
  --dry-run             模拟发布，不实际发布
  --tag <tag>           指定发布标签 (默认: latest)
  --no-build            跳过构建步骤

示例:
  node scripts/publish.js patch
  node scripts/publish.js minor --dry-run
  node scripts/publish.js 1.2.3 --tag beta
    `);
    process.exit(0);
  }

  const versionArg = args[0];
  const isDryRun = args.includes('--dry-run');
  const noBuild = args.includes('--no-build');
  const tagIndex = args.indexOf('--tag');
  const tag = tagIndex !== -1 && args[tagIndex + 1] ? args[tagIndex + 1] : 'latest';

  try {
    // 计算新版本号
    let newVersion;
    if (['patch', 'minor', 'major'].includes(versionArg)) {
      newVersion = calculateNewVersion(versionArg);
    } else {
      newVersion = versionArg;
    }

    console.log(`准备发布版本: ${newVersion}`);

    if (isDryRun) {
      console.log('🔍 模拟模式 - 不会实际执行发布操作\n');
    }

    // 更新版本号
    updateVersion(newVersion);

    // 重新构建（除非指定跳过）
    if (!noBuild) {
      console.log('\n重新构建二进制文件...');
      await execCommand('node', ['scripts/build.js']);
    }

    // 发布到 npm
    await publishPackages({ dryRun: isDryRun, tag });

    console.log(`\n✅ 发布完成! 版本: ${newVersion}`);

  } catch (error) {
    console.error('发布失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
main();
