const { deploy, getVersion, checkBinary, getBinaryPath } = require('../lib/index.js');
const path = require('path');

async function runTests() {
  console.log('运行 go-deploy npm 包装器测试...\n');

  try {
    // 测试1: 检查二进制文件是否可用
    console.log('测试1: 检查二进制文件可用性');
    const binaryAvailable = checkBinary();
    console.log(`二进制文件可用: ${binaryAvailable}`);

    if (binaryAvailable) {
      const binaryPath = getBinaryPath();
      console.log(`二进制文件路径: ${binaryPath}\n`);
    }

    // 测试2: 获取版本信息
    if (binaryAvailable) {
      console.log('测试2: 获取版本信息');
      try {
        const version = await getVersion();
        console.log(`版本信息: ${version}\n`);
      } catch (error) {
        console.error(`获取版本失败: ${error.message}\n`);
      }
    }

    // 测试3: 显示帮助信息
    if (binaryAvailable) {
      console.log('测试3: 显示帮助信息');
      try {
        const result = await deploy({ help: true, silent: true });
        console.log('帮助信息获取成功\n');
      } catch (error) {
        console.error(`获取帮助信息失败: ${error.message}\n`);
      }
    }

    // 测试4: 使用配置文件（如果存在）
    const configPath = path.join(process.cwd(), 'config.json');
    console.log('测试4: 配置文件测试');
    console.log(`查找配置文件: ${configPath}`);

    if (require('fs').existsSync(configPath)) {
      console.log('配置文件存在，可以进行实际部署测试');
      // 注意：这里不实际执行部署，只是验证参数传递
      console.log('配置文件路径有效');
    } else {
      console.log('配置文件不存在，跳过部署测试');
    }

    console.log('\n✓ 所有测试完成');

  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
