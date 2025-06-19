/**
 * 版本一致性检查脚本
 * 确保主包和所有平台子包的版本号保持一致
 */

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

function checkVersionConsistency() {
  console.log('检查版本一致性...\n');

  // 获取主包版本
  const mainPackageJson = fs.readJsonSync('package.json');
  const mainVersion = mainPackageJson.version;

  console.log(`主包版本: ${mainVersion}`);

  let hasInconsistency = false;

  // 检查所有平台子包版本
  for (const platform of platforms) {
    const packagePath = path.join('packages', platform, 'package.json');

    if (fs.existsSync(packagePath)) {
      const packageJson = fs.readJsonSync(packagePath);
      const platformVersion = packageJson.version;

      if (platformVersion !== mainVersion) {
        console.log(`❌ ${platform}: ${platformVersion} (不一致)`);
        hasInconsistency = true;
      } else {
        console.log(`✓ ${platform}: ${platformVersion}`);
      }
    } else {
      console.log(`⚠️  ${platform}: 包不存在`);
    }
  }

  // 检查 optionalDependencies 版本
  console.log('\n检查 optionalDependencies 版本...');
  for (const dep in mainPackageJson.optionalDependencies) {
    const depVersion = mainPackageJson.optionalDependencies[dep];
    const expectedVersion = `^${mainVersion}`;

    if (depVersion !== expectedVersion) {
      console.log(`❌ ${dep}: ${depVersion} (期望: ${expectedVersion})`);
      hasInconsistency = true;
    } else {
      console.log(`✓ ${dep}: ${depVersion}`);
    }
  }

  if (hasInconsistency) {
    console.log('\n❌ 发现版本不一致！请运行构建脚本或发布脚本来修复。');
    process.exit(1);
  } else {
    console.log('\n✅ 所有版本号一致！');
  }
}

// 运行检查
checkVersionConsistency();
